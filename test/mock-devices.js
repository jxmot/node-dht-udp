/*
    Mock Devices -

        This application will simulate the sensor
        devices. Its purpose is to aid in testing
        functionality on the server.

    This application uses - 

    sprintf-js :
        npm : https://www.npmjs.com/package/ssprintf-j
        github : https://github.com/alexei/sprintf.js

    RunKit Test :
        https://runkit.com/embed/or2oiue1mtig
*/
// a handy string formatter...
var fmt = require('sprintf-js');

// get our configuration
const cfg = require('./mock-devices-cfg.js');

// generates a random value between a "min" and a "max" value
function randomVal(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
};

// mock data generator - 
var seq = 0;
var devidx = -1;

function getMockData() {

    if(seq < 1000) seq += 1;
    else seq = 1;

    if(cfg.mode === 'seq') {
        if((devidx += 1) === cfg.devlist.length) devidx = 0;
    } else devidx = randomVal(0, cfg.devlist.length - 1);

    var data = fmt.sprintf('{"dev_id":"%s","seq":%d,"t":%f,"h":%f}',
                           cfg.devlist[devidx],
                           seq,
                           randomVal(4500,9500)/100,
                           randomVal(1000,3000)/100);
    return data;
};

/*
    here are some mock data messages -

for(var ix = 1;ix <= cfg.repeat;ix++) {
    console.log(getMockData());
}
*/ 

//////////////////////////////////////////////////////////////////////////////
// create a socket to listen on...
const dgram = require('dgram');
const client = dgram.createSocket('udp4');
// keep going until 0
var countdown = cfg.repeat;
// start sending...
sendUDP();
// then wait for a while and continue...
var timeout = setInterval( () => {
                sendUDP();
            }, cfg.interval);

/*
    Send a UDP packet to the server
*/
function sendUDP() {

    if(countdown > 0) {
        countdown -= 1;
        // send some data...
        var data = getMockData();
        console.log(data);
  
        client.send(data, 0, data.length, cfg.port, cfg.host, (err, bytes) => {
            if(err) throw err;
        });

    }else  process.exit();
};





