/* ************************************************************************ */
/*
    server.js - Used in the ESP8266-dht-udp project to provide a server that
    listens for UDP packets from sensor devices. And listens on a muti-cast
    address for status updates from the sensor devices.

    This server will also - 

        * forward sensor data and statuses to a database
        * NICE TO HAVE: Listen for external connections to a socket and then
          forward sensor data and statuses to a client.

DONE    PHASE 1 : Listen for sensor data and statuses, display on console.

WIP     PHASE 2 : Forward the incoming data to a database. Options are - 
        * Firebase <--
        * mLab/mongodb
        * MySQL

    
*/
// an option argument can specify and alternative server configuration file. 
var serverCfgFile = process.argv[2];

// we're assuming that if there's an argument present then it's going to be
// "path + filename.ext". It's not checked for validity.
if((serverCfgFile === undefined) || (serverCfgFile === ''))
    serverCfgFile = './servercfg.js';

// read the IP address and port # that we'll be using
const cfg = require(serverCfgFile);

const srvcfg = {
    host : cfg.server.host,
    port : cfg.server.port,
    reply : cfg.server.reply
};

const mulcfg = {
    addr : cfg.multi.addr,
    port : cfg.multi.port
};

/* ************************************************************************ */
// Events
const EventEmitter = require('events');
const srvmsg_events = new EventEmitter();

// wait "on"...
//      data push status
//

/* ************************************************************************ */
const sensorlist = require('./sensorlist.js');

for(var ix = 0; sensorlist.list[ix].name !== 'END'; ix++) {
    console.log(`sensor #${ix} - name: ${sensorlist.list[ix].name}  loc: ${sensorlist.list[ix].loc}`);
}
console.log('\n');

/* ************************************************************************ */
// create a socket to listen on...
const server = require('dgram').createSocket('udp4');
// a running count of packets received
var count = 0;

/*
    If an error occurs announce it and close the server.
*/
server.on('error', (err) => {
    console.log(err.stack);
    server.close();
});

/*
    Message Received Event Handler
*/
server.on('message', (msg, rinfo) => {
    // got one, bump the counter!
    count += 1;

    var temp = '';
    
    // Strings arrive as a "string of character codes". They
    // have to be converted to ASCII strings.
    msg.filter(charcode => {
        if(charcode !== 0 && charcode !== undefined) {
            temp = temp + String.fromCharCode(charcode);
            return true;
        }
    });

    // trigger an event....
    // consider passing srvcfg.reply so that the
    // event handler knows if it should reply. the
    // content of the reply is determined by the
    // handler. and it can decide to not reply as 
    // needed.
    if(!srvmsg_events.emit('MSG_RCVD', temp, rinfo)) console.log('MSG_RCVD no listeners!!!');
});

/*
    if(srvcfg.reply === true) {
        // put a reply together...
        const reply = new Buffer(temp);
        console.log(`UDP Server reply: ${reply.toString()}`);
        // send it back to the sender of the message...
        server.send(reply, 0, reply.length, rinfo.port, rinfo.address, (err, bytes) => {
            if(err) console.log(err.stack);
        });
    } else console.log(temp);
});
*/

/*
    Server Listening has begun
*/
server.on('listening', () => {
    const address = server.address();
    console.log(`UDP server listening on - ${address.address}:${address.port}`);
});

// must tell the server to listen on the port and address
server.bind(srvcfg.port, srvcfg.host);

/* ************************************************************************ */
// create a socket to listen on...
const client = require('dgram').createSocket('udp4');

client.on('listening', () => {
    client.setBroadcast(true)
    client.setMulticastTTL(128); 
    client.addMembership(mulcfg.addr);
    console.log(`UDP Multi-Cast Client listening on - ${mulcfg.addr}:${mulcfg.port}`);
});

/*
    Reply Received Event Handler
*/
client.on('message', (payload, remote) => {
    // the correct way to extract a string from the payload is this - 
    var message = payload.filter(letter => letter !== 0);

    var temp = '';
    
    // Strings arrive as a "string of character codes". They
    // have to be converted to ASCII strings.
    payload.filter(charcode => {
        if(charcode !== 0 && charcode !== undefined) {
            temp = temp + String.fromCharCode(charcode);
            return true;
        }
    });

    // trigger an event....
    if(!srvmsg_events.emit('STATUS_RCVD', temp, remote)) console.log('STATUS_RCVD no listeners!!!');

    console.log(`multicast received : [${temp}] from ${remote.address}:${remote.port}`);
});

client.bind(mulcfg.port);

var fb = require(__dirname + '/firebase');
fb(srvmsg_events);

