//////////////////////////////////////////////////////////////////////////////
require(__dirname + '/firebase-rest.js');

module.exports = function init(evts) {
    // wait for events....
    evts.on('MSG_RCVD', (m, r) => {
        console.log(m);
        pushPayload(JSON.parse(m), firebase.cfg.PATHS.SENSOR_DATA);
    });

    evts.on('STATUS_RCVD', (m, r) => {
        console.log(m);
        pushPayload(JSON.parse(m), firebase.cfg.PATHS.SENSOR_STAT);
    });
};

//////////////////////////////////////////////////////////////////////////////
function pushPayload(payload, child)
{
    var _payload = Object.assign({}, payload, {tstamp : Date.now()});

    var pushArg = {
        path: createPushPath(firebase.cfg, firebase.cfg.PATHS.SENSOR_PARENT, child),
        payload: _payload,
        cb: pushCallBack
    };
    firebase.push(pushArg);
}

function createPushPath(cfg, parent, child) {
    var pushPath = cfg.PATHS.PATH_SEP + parent + cfg.PATHS.PATH_SEP + child + cfg.CONFIG.JSON_AUTH + cfg.CONFIG.SECRET;
    console.log('pushPath = ' + pushPath);
    return pushPath;
};

function pushCallBack(status, resp) {
    console.log('pushCallBack');
    console.log('status = ' + status);
    console.log('resp = ' + resp);
};
