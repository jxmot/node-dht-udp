/*
    alexa.js

    An HTTP server that acts as a set of endpoints 
    for an Alexa skill. 

    This application will "watch" a file (specified
    via the config file) for when it is changed. The
    file will be modified by the node-dht-udp 
    application when ever it updates its copies of
    the most recent data or status.

    When the file is updated it will be read and 
    parsed back into an object. Then specific requests 
    can retrieve the saved data.
*/
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

var appdir = path.dirname(require.main.filename);

process.on('SIGINT', () => {
    console.log('\nCaught interrupt signal\n');
    process.exit();
});

const alexacfg = require('./alexacfg.js');
console.log(JSON.stringify(alexacfg));
let alexa  = http.createServer(alexaQuery).listen(alexacfg.port, alexacfg.host);

var sensorlast = {
};

const filein = path.join(appdir, alexacfg.watch);

fs.watch(filein, (eventType, filename) => {
    if(filename) {
        console.log(eventType);
        console.log(filename);
        getFileData(filein);
    }
});

// retrieve current data
getFileData(filein);

console.log('waiting.....');

//////////////////////////////////////////////////////////////////////////////
//
function alexaQuery(req, res) {
    if(req.method === 'GET') {
        const alexaReq = url.parse(req.url,true).query;
        if(verifyReq(alexaReq)) handleReq(alexaReq, res);
        else replyWith400(res, 'Bad Alexa ID: '+alexaReq.axid);
    } else replyWith400(res, 'Method NOT allowed: '+req.method);
};

function getFileData(filein) {
    let bRet = false;
    let jsondata = fs.readFileSync(filein);
    try {
        sensorlast = JSON.parse(jsondata.toString());
        bRet = true;
    } catch(e) {
        console.log(e);
    }
    return bRet;
};

function getId(device) {
    let found = undefined;
    Object.keys(alexacfg.devices).forEach(dev => {
        if(device === alexacfg.devices[dev][1]) {
            found = dev;
            console.log(dev+': '+alexacfg.devices[dev]);
        }
    });
    return found;
};

function getName(id) {
    return alexacfg.devices[id][0];
};

function getPath(id) {
    return alexacfg.devices[id][1];
};

function verifyReq(alexaReq) {
let bRet = false;

    if(alexaReq.axid === alexacfg.axid) bRet = true;
    return bRet;
};

/*
    Request data from a single sensor :
        ?axid=123456&device=mbr
        {axid: '123456', device: 'mbr'}
*/
function handleReq(alexaReq, res) {
    const devid = getId(alexaReq.device);
    if(devid !== undefined) {
        const data = sensorlast['data'][devid];
        if(data !== undefined)
            replyWith200(res, JSON.stringify({sensor: data}));
        else
            replyWith400(res, 'Data NOT found for: '+devid);
    } else replyWith400(res, 'Device NOT found for: '+alexaReq.device);
};

function replyWith400(res, msg) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    res.end(msg);
};

function replyWith200(res, msg) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(msg);
};

