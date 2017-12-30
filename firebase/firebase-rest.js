exports.firebase = (function() { 

    var https = require('https');

    firebase = {
        cfg : require(__dirname + '/firebase-rest-config.js'),
    };

//////////////////////////////////////////////////////////////////////////////

    firebase.pushReq = {
        port: firebase.cfg.HTTPS_PORT,
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
    firebase.push = function(pushArg) {

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
                _callback(res.statusCode, allData);
            });
        });
        
        req.on('error', function(err) {
            var errMsg = 'ERROR - code = ' + err.code + '   message = ' + err.message;
            _callback(err.code, errMsg);
        });
        
        req.write(JSON.stringify(pushArg.payload));
        req.end();
    };

    return firebase;
})();

