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

/*
    Watch the configured file for changes, when a 
    change occurs read the file save it into an
    object.
*/
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
/*
    A query has arrived, check the method, verify 
    the requestor and respond appropriately (data -OR- error)
*/
function alexaQuery(req, res) {
    if(req.method === 'GET') {
        const alexaReq = url.parse(req.url,true).query;
        if(verifyReq(alexaReq)) handleReq(alexaReq, res);
        else replyWith400(res, 'Bad Alexa ID: '+alexaReq.axid);
    } else replyWith400(res, 'Method NOT allowed: '+req.method);
};

/*
    Read a file (assume it's JSON formatted), return
    true if the data is valid. Otherwise return false.
*/
function getFileData(filein) {
    let bRet = false;
    let stat = fs.statSync(filein);

    if(stat.size > 0) {
        let jsondata = fs.readFileSync(filein);
        try {
            sensorlast = JSON.parse(jsondata.toString());
            console.log(stat.size);
            bRet = true;
        } catch(e) {
            console.log(e);
        }
    }
    return bRet;
};

/*
    Get an ID for the device, return it if found
    otherwise return undefined.
*/
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

/*
    Get the human-friendly name using the
    device ID (as returned by getId()) to 
    find it.
*/
function getName(id) {
    return alexacfg.devices[id][0];
};

/*
    Get the Alexa-friendly device path
*/
function getPath(id) {
    return alexacfg.devices[id][1];
};

/*
    Verify the requestor's identity by comparing
    the URL supplied ID (axid) against what has
    been stored in the configuration. Return true
    if there's a match otherwise return false.
*/
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
            replyWith200(res, '{"axid":"'+alexaReq.axid+'","name":"'+getName(devid)+'","sensor":'+JSON.stringify(data)+'}');
        else
            replyWith400(res, 'Data NOT found for: '+devid);
    } else replyWith400(res, 'Device NOT found for: '+alexaReq.device);
};

/*
    Simple replies, send a status of 400 or 200 with
    a text response.
*/
function replyWith400(res, msg) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    res.end(msg);
};

function replyWith200(res, msg) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(msg);
};
