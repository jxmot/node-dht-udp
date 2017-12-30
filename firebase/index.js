//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
require(__dirname + '/firebase-rest.js');

module.exports = function init(evts) {

    // login using an email and password
//    firebase.emailLogin(emailLoginCallback);

    // wait for events....
    evts.on('MSG_RCVD', (m, r) => {
        console.log(m);
        //pushPayload(emailLoginUser, JSON.parse(m), firebase.cfg.PATHS.SENSOR_DATA);
        pushPayload(JSON.parse(m), firebase.cfg.PATHS.SENSOR_DATA);
    });

    evts.on('STATUS_RCVD', (m, r) => {
        console.log(m);
        //pushPayload(emailLoginUser, JSON.parse(m), firebase.cfg.PATHS.SENSOR_STAT);
        pushPayload(JSON.parse(m), firebase.cfg.PATHS.SENSOR_STAT);
    });
};

//////////////////////////////////////////////////////////////////////////////
var emailLoginUser = {};

function emailLoginCallback(status, resp, user) {
    emailLoginUser = JSON.parse(JSON.stringify(user));
    
    console.log('emailLoginCallback');
    console.log('status = ' + status);
    if(user != undefined) console.log('user = ' + JSON.stringify(user));
    else console.log('resp = ' + resp);
}

//function pushPayload(user, _payload, child)
function pushPayload(_payload, child)
{
    // Now we can do something...
    var pushArg = {
        //path: createPushPath(firebase.cfg, user, firebase.cfg.PATHS.SENSOR_PARENT, child),
        path: createPushPath(firebase.cfg, firebase.cfg.PATHS.SENSOR_PARENT, child),
        payload: _payload,
        cb: pushCallBack
//        user: user
    };
    firebase.push(pushArg);
}

//////////////////////////////////////////////////////////////////////////////
var os = require('os');

// HOST + PATH_SEP + SENSOR_PARENT + PATH_SEP + SENSOR_DATA + JSON_AUTH + SECRET
//      OR                                      
// HOST + PATH_SEP + SENSOR_PARENT + PATH_SEP + SENSOR_STAT + JSON_AUTH + SECRET

function createPushPath(cfg, parent, child) {
    var pushPath = cfg.PATHS.PATH_SEP + parent + cfg.PATHS.PATH_SEP + child + cfg.CONFIG.JSON_AUTH + cfg.CONFIG.SECRET;
    console.log('pushPath = ' + pushPath);
    return pushPath;
};

/*
function createPushPath(cfg, user, parent, child, gchild) {

    var pushPath = cfg.PATHS.PATH_SEP + parent + cfg.PATHS.PATH_SEP;
    
    // NOTE: Will need to rethink how this is implemented. may need to
    // create more than one path creator. 
    
    if((child === undefined) || (child === null) || (child === '')) {
        if((user.displayName === undefined) || (user.displayName === ''))
            pushPath = pushPath + os.hostname() + cfg.PATHS.PATH_SEP;
        else pushPath = pushPath + user.displayName + cfg.PATHS.PATH_SEP;
    }
    else pushPath = pushPath + child + cfg.PATHS.PATH_SEP;
    
    if((gchild != undefined) && (gchild != null) && (gchild != '')){
        pushPath = pushPath + gchild;
    }
        
    pushPath = pushPath + cfg.CONFIG.JSON_AUTH + user.idToken;
                
    return pushPath;
};
*/

// queue up messages until false again???
var reauthInProgress = false;
var reauthComplete = false;
var reauthCount = 0;

//function pushCallBack(status, resp, user) {
function pushCallBack(status, resp) {
    console.log('pushCallBack');
    console.log('status = ' + status);
    console.log('resp = ' + resp);
/*
// https://stackoverflow.com/questions/40520696/how-do-i-access-my-firebase-database-via-http-rest-api

    // handle expired auth tokens here...
    if(status === 401) {
        if(reauthInProgress === false) {
            reauthCount += 1;
            console.log('reauth!!! reauthCount = ' + reauthCount);
            // handle it! BUT lose the last data written :(
            reauthComplete = false;
            reauthInProgress = true;
            firebase.reAuth(user, reauthCallBack);
        }
    }
*/
};

function reauthCallBack(status, resp) {
    if(status === 200) {
        reauthInProgress = false;
        reauthComplete = true;
    }
    console.log('reauth cb resp = ' + resp);
};