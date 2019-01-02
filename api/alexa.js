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

function alexaQuery(req, res) {
    console.log('alexaQuery');
    console.log(req.url);
    console.log(url.parse(req.url,true).query);

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(JSON.stringify({sensor: {t: 90.0, h: 75}})+'\n');
};

var sensorlast = {
};

const filein = path.join(appdir, alexacfg.watch);

fs.watch(filein, (eventType, filename) => {
    if(filename) {
        console.log(eventType);
        console.log(filename);
        getFileData();
    }
});

function getFileData() {
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

console.log('waiting.....');


//////////////////////////////////////////////////////////////////////////////
//
function getName(id) {
    return alexacfg.names[id];
};

