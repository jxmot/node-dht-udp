//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
require(__dirname + '/firebase-rest.js');

module.exports = function init(evts) {

    // login using an email and password
    firebase.emailLogin(emailLoginCallback);

    // wait for events....
    evts.on('MSG_RCVD', (m, r) => {
        console.log(m);
        pushPayload(emailLoginUser, JSON.parse(m), firebase.cfg.PATHS.SENSOR_DATA);
    });

    evts.on('STATUS_RCVD', (m, r) => {
        console.log(m);
        pushPayload(emailLoginUser, JSON.parse(m), firebase.cfg.PATHS.SENSOR_STAT);
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

function pushPayload(user, _payload, child)
{
    // Now we can do something...
    var pushArg = {
        path: createPushPath(firebase.cfg, user, firebase.cfg.PATHS.SENSOR_PARENT, child),
        payload: _payload,
        cb: pushCallBack,
        user: user
    };
    firebase.push(pushArg);
}

//////////////////////////////////////////////////////////////////////////////
var os = require('os');

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

function pushCallBack(status, resp, user) {
    console.log('pushCallBack');
    console.log('status = ' + status);
    console.log('resp = ' + resp);
};

