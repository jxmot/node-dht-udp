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


    (c) 2018 Jim Motyl - https://github.com/jxmot/node-dht-udp
*/
// a handy string formatter...
var fmt = require('sprintf-js');

// get our configuration
const cfg = require('./mock-devices-cfg.js');

//////////////////////////////////////////////////////////////////////////////
// mock data generator - 
var seq = 0;
var devidx = -1;

function getMockData() {

    // limit the range of the sequence number
    if(seq < 1000) seq += 1;
    else seq = 1;

    // two modes, sequential device ID, or random device ID
    if(cfg.mode === 'seq') {
        if((devidx += 1) === cfg.devlist.length) devidx = 0;
    } else devidx = randomVal(0, cfg.devlist.length - 1);

    // dividing the random value will provide fractional values
    var t = randomVal(cfg.t_min, cfg.t_max) / cfg.divisor;
    var h = randomVal(cfg.h_min, cfg.h_max) / cfg.divisor;

    // create the data packet
    var data = fmt.sprintf('{"dev_id":"%s","seq":%d,"t":%f,"h":%f}',
                           cfg.devlist[devidx], seq, t, h);

    return data;
};

// generates a random value between a "min" and a "max" value
function randomVal(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
};

//////////////////////////////////////////////////////////////////////////////
// create a socket
const dgram = require('dgram');
const client = dgram.createSocket('udp4');
// keep going until the count down reaches 0
var countdown = cfg.repeat;
// start sending...
sendUDP();
// then wait for a while and continue...
var timeout = setInterval( () => {
                sendUDP();
            }, cfg.interval);

// Send a UDP packet to the server
function sendUDP() {
    if(countdown > 0) {
        countdown -= 1;
        // create the data that will be sent...
        var data = getMockData();
        console.log(`sending - ${data}`);
        // send it
        client.send(data, 0, data.length, cfg.port, cfg.host, (err, bytes) => {
            if(err) throw err;
        });
    }else  process.exit();
};

