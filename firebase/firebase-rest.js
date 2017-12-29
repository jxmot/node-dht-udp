// https://firebase.google.com/docs/reference/rest/database/
// https://firebase.google.com/docs/database/rest/save-data#auth
// https://firebase.google.com/docs/database/rest/retrieve-data#section-rest-filtering
// https://firebase.google.com/docs/database/rest/retrieve-data#filtering-by-a-specified-child-key
// https://firebase.google.com/docs/database/rest/app-management
// https://firebase.google.com/docs/database/security/
// https://stackoverflow.com/questions/40520696/how-do-i-access-my-firebase-database-via-http-rest-api
// https://forums.tessel.io/t/using-one-of-sparkfun-real-time-clocks-with-tessel/2962/4
// https://forums.tessel.io/t/onboard-clock-how-to-tell-the-time/398/10

exports.firebase = (function() { 

    var https = require('https');

    firebase = {
        cfg : require(__dirname + '/firebase-rest-config.js'),
    };

//////////////////////////////////////////////////////////////////////////////

    firebase.ruleReq = {
        port: 443,
        method: 'GET',
        hostname: firebase.cfg.CONFIG.HOST,
        path: firebase.cfg.CONFIG.RULES_PATH + firebase.cfg.CONFIG.SECRET,
        headers: {
            'Host': firebase.cfg.CONFIG.HOST,
            'Accept': '*/*',
            'User-Agent': firebase.cfg.USER_AGENT
        }
    };

    firebase.loginReq = {
        port: 443,
        method: 'POST',
        hostname: firebase.cfg.CONFIG.LOGIN_HOST,
        path: firebase.cfg.CONFIG.EMAIL_LOGIN + firebase.cfg.CONFIG.APIKEY,
        headers: {
            'Host': firebase.cfg.CONFIG.LOGIN_HOST,
            'Accept': '*/*',
            'User-Agent': firebase.cfg.USER_AGENT,
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(firebase.cfg.CRED).length
        }
    };

    firebase.reauthReq = {
        port: 443,
        method: 'POST',
        hostname: firebase.cfg.CONFIG.REAUTH_HOST,
        path: firebase.cfg.CONFIG.REAUTH_LOGIN + firebase.cfg.CONFIG.APIKEY,
        headers: {
            'Host': firebase.cfg.CONFIG.REAUTH_HOST,
            'Accept': '*/*',
            'User-Agent': firebase.cfg.USER_AGENT,
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(firebase.cfg.CRED).length
        }
    };
    
    firebase.loginReqAnony = {
        port: 443,
        method: 'POST',
        hostname: firebase.cfg.CONFIG.LOGIN_HOST,
        path: firebase.cfg.CONFIG.ANONY_LOGIN + firebase.cfg.CONFIG.APIKEY,
        headers: {
            'Host': firebase.cfg.CONFIG.LOGIN_HOST,
            'Accept': '*/*',
            'User-Agent': firebase.cfg.USER_AGENT,
            'Content-Type': 'application/json'
        }
    };

    firebase.pushReq = {
        port: 443,
        method: 'POST',
        hostname: firebase.cfg.CONFIG.HOST,
        path: '',
        headers: {
            'Host': firebase.cfg.CONFIG.HOST,
            'Accept': '*/*',
            'User-Agent': firebase.cfg.USER_AGENT,
            'Content-Type': 'application/json',
            'Content-Length': ''
        }
    };

//////////////////////////////////////////////////////////////////////////////

    // For reference and for containing the logged-in user info after a 
    // successful login.
    var validUserStatus = 0;
    var validUser = {
        // Reflects the type of login and/or command.
        kind: '',
        localId: '',
        email: '',
        displayName: '',
        idToken: '',
        registered: false,
        refreshToken: '',
        expiresIn: '-1'
    };
    
    var currUser = {
        // copied from the response to a successful log in
        localId: '',        // aka "user id"
        email: '',
        displayName: '',
        idToken: '',
        refreshToken: '',
        expiresIn: '',

        // app-specific user info
        timeIn: -1,         // when the current user was logged in, epoch time
        timeRem: -1,        // counts down to 0, uses expiresIn and timeIn
                            // to calculate a value. updates when an "action"
                            // function is called AND if loggedIn === true
                            //
                            // timeRem = (timeIn + parseInt(expiresIn)) - now
                            
        loggedIn: false     // all "action" functions should check this
    };

    // for possible future enhancment(s), might want the
    // ability to route specific clients' data through a
    // their own logins.
    var currUsers = [];
    //   - OR -
    // firebase.currUsers = [];
    
//////////////////////////////////////////////////////////////////////////////

    firebase.readRules = function(cb) {
        var _callback = cb;
        var req = https.request(firebase.ruleReq, function(res) {
            var allData = '';
            res.on('data', function(d) {
                allData += d.toString();
            });
            res.on('end', function () {
                _callback(res.statusCode, allData);
            });
        });
        req.end();
    };
    
    firebase.emailLogin = function(cb, cred) {
        var _callback = cb;
        
        if(cred != undefined) {
            firebase.loginReq.headers['Content-Length'] = JSON.stringify(cred).length;
        }
        
        var req = https.request(firebase.loginReq, function(res) {
            var allData = '';
            res.on('data', function(d) {
                allData += d.toString();
            });
            res.on('end', function () {
                if(res.statusCode === 200) saveCurrUser(allData);
                validUserStatus = res.statusCode;
                _callback(res.statusCode, allData, firebase.getCurrUser());
            });
        });
        req.on('error', function(err) {
            var errMsg = 'ERROR - code = ' + err.code + '   message = ' + err.message;
            // mute console.log('problem with request: ' + errMsg);
            _callback(err.code, errMsg);
        });
        if(cred != undefined) {
            req.write(JSON.stringify(cred));
        } else {
            req.write(JSON.stringify(firebase.cfg.CRED));
        }
        req.end();
    };

    firebase.anonyLogin = function(cb) {
        var _callback = cb;
                
        var req = https.request(firebase.loginReqAnony, function(res) {
            var allData = '';
            res.on('data', function(d) {
                allData += d.toString();
            });
            res.on('end', function () {
                // not checking status here, or saving the user data.
                // this is intentional.
                // but for dev&debug....
                if(res.statusCode === 200) {
                    saveCurrUser(allData);
                    validUserStatus = res.statusCode;
                    _callback(res.statusCode, allData, firebase.getCurrUser());
                } else _callback(res.statusCode, allData);
                //
                //_callback(res.statusCode, allData);
            });
        });
        req.on('error', function(err) {
            var errMsg = 'ERROR - code = ' + err.code + '   message = ' + err.message;
            _callback(err.code, errMsg);
        });
        req.end();
    };

    function saveCurrUser(userData) {
        
        validUser = JSON.parse(userData);
        
        // currUser is the object will use through out the 
        // rest of the code.
        // NOTE: A potential future enhancment might allow
        // for multiple & simultaneous logged in users.
        // (see above for the comment with `currUsers[]`)
        currUser.localId      = validUser.localId;
        currUser.email        = validUser.email;
        currUser.displayName  = validUser.displayName;
        currUser.idToken      = validUser.idToken;
        currUser.refreshToken = validUser.refreshToken;
        currUser.expiresIn    = validUser.expiresIn;
        
        // we may/may-not keep track of the time remaining for
        // the current user. this might be a way to monitor 
        // users that may have gone offline unexpectedly.
        currUser.timeRem      = parseInt(validUser.expiresIn);
        
        // This should contain the time/date when the user logged
        // in. Will use epoch.
        currUser.timeIn       = -1;
        
        // current user state, used if the rest of the current
        // user data isn't cleared upon log-off.
        currUser.loggedIn     = true;
        
        // NOTE: investigate factoring the code above with .assign()
        
        // currUsers.push(currUser);
        //   - OR - 
        // currUsers[currUser.email] = currUser;
    };
    
    firebase.getCurrUser = function() {
        return JSON.parse(JSON.stringify(currUser));
    };
    
    firebase.getValidUser = function() {
        return JSON.parse(JSON.stringify(validUser));
    };

    /*
        Update user info, anything but password(?).
    */
    firebase.updateUserInfo = function() {
    };
    
//////////////////////////////////////////////////////////////////////////////

    // NOTE: must check status for errors, and handle things like
    // "Auth token is expired". In that example Firebase will return
    // {"error" : "Auth token is expired"} with a status of 401 Unauthorized.

    firebase.push = function(pushArg) {
        // check for user logged-in?
        //if(isUserLoggedIn(pushArg.user) === true) then continue, else return
        
        var _callback = pushArg.cb;
        
        if(pushArg.payload != undefined) {
            firebase.pushReq.headers['Content-Length'] = JSON.stringify(pushArg.payload).length;
        }
        
        firebase.pushReq.path = pushArg.path;

        var req = https.request(firebase.pushReq, function(res) {
            var allData = '';
            res.on('data', function(d) {
                allData += d.toString();
            });
            res.on('end', function () {
                _callback(res.statusCode, allData, firebase.getCurrUser());

                //if(res.statusCode === 200) _callback(res.statusCode, allData, firebase.getCurrUser());
                //else _callback(res.statusCode, allData);
            });
        });
        
        req.on('error', function(err) {
            var errMsg = 'ERROR - code = ' + err.code + '   message = ' + err.message;
            // mute console.log('problem with request: ' + errMsg);
            _callback(err.code, errMsg);
        });
        
        req.write(JSON.stringify(pushArg.payload));
        req.end();
    };

//////////////////////////////////////////////////////////////////////////////
    firebase.reAuth = function(user, cb) {

        var _callback = cb;

        var payload = {
            grant_type: 'refresh_token',
            refresh_token: user.refreshToken
        };

        firebase.reauthReq.headers['Content-Length'] = JSON.stringify(payload).length;

        var req = https.request(firebase.reauthReq, function(res) {
            var allData = '';
            res.on('data', function(d) {
                allData += d.toString();
            });
            res.on('end', function () {
                if(res.statusCode === 200) saveCurrUser(allData);
// not used anywhere -                validUserStatus = res.statusCode;
                _callback(res.statusCode, allData);
            });
        });
        
        req.on('error', function(err) {
            var errMsg = 'ERROR - code = ' + err.code + '   message = ' + err.message;
            _callback(err.code, errMsg);
        });
        
        req.write(JSON.stringify(payload));
        req.end();
    };
//////////////////////////////////////////////////////////////////////////////
    return firebase;
})();

