/* ************************************************************************ */
/*
    server.js - Used in the ESP8266-dht-udp project to provide a server that
    listens for UDP packets from sensor devices. And listens on a muti-cast
    address for status updates from the sensor devices.

    (c) 2017 Jim Motyl - https://github.com/jxmot/node-dht-udp
*/
// an option argument can specify and alternative server configuration file. 
// this will allow the port number(s), IP address(es), and if a reply is
// required.
var serverCfgFile = process.argv[2];

// we're assuming that if there's an argument present then it's going to be
// "path + filename.ext". It's not checked for validity.
if((serverCfgFile === undefined) || (serverCfgFile === ''))
    serverCfgFile = './servercfg.js';

// read the IP address and port # that we'll be using
const cfg = require(serverCfgFile);

// separate the configurations
const srvcfg = {
    host : cfg.server.host,
    port : cfg.server.port,
//    reply : cfg.server.reply
};

const mulcfg = {
    addr : cfg.multi.addr,
    port : cfg.multi.port
};

const dbcfg = {
    type : cfg.db.type
};

/* ************************************************************************ */
/*
    A single place to control if calls to console.log() will
    produce any output.
*/
function consolelog(text) {
    if(cfg.conlog) {
        console.log(text);
    }
};

/*

    Obtain our IP address(IPv4) associated with the Ethernet
    interface. Typically this code will be ran on a platform
    that uses a wired network connnection. The array below
    represents the object that is returned by accessing
    os.networkInterfaces().Ethernet.

    Ethernet: 
        [ 
            { 
                address: 'fe80::e5a8:81ea:b43f:459',
                netmask: 'ffff:ffff:ffff:ffff::',
                family: 'IPv6',
                mac: '30:5a:3a:e1:30:3c',
                scopeid: 3,
                internal: false 
            },
            { 
                address: '192.168.0.7',
                netmask: '255.255.255.0',
                family: 'IPv4',
                mac: '30:5a:3a:e1:30:3c',
                internal: false 
            } 
        ]
*/
var os = require( 'os' );
var nifs = os.networkInterfaces();
for(var ix = 0;ix < nifs.Ethernet.length;ix++){
    if(nifs.Ethernet[ix].family === 'IPv4') {
        // overwrite the IP address retrieved from
        // the configuration settng.
        srvcfg.host = nifs.Ethernet[ix].address;
        break;
    }
}

/* ************************************************************************ */
// Events
const EventEmitter = require('events');
const srvmsg_events = new EventEmitter();

/* ************************************************************************ */
// create a socket to listen on...
const server = require('dgram').createSocket('udp4');
// a running count of packets received
var count = 0;

/*
    If an error occurs announce it and close the server.
*/
server.on('error', (err) => {
    console.error(err.stack);
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
    if(!srvmsg_events.emit('MSG_RCVD', temp, rinfo)) console.error('MSG_RCVD no listeners!!!');
    else consolelog(`udp received : [${temp}] from ${rinfo.address}:${rinfo.port}`);
});

/*
    if(srvcfg.reply === true) {
        // put a reply together...
        const reply = new Buffer(temp);
        consolelog(`UDP Server reply: ${reply.toString()}`);
        // send it back to the sender of the message...
        server.send(reply, 0, reply.length, rinfo.port, rinfo.address, (err, bytes) => {
            if(err) console.error(err.stack);
        });
    } else consolelog(temp);
});
*/

/*
    Server Listening has begun
*/
server.on('listening', () => {
    const address = server.address();
    consolelog(`UDP server listening on - ${address.address}:${address.port}`);
});

// must tell the server to listen on the port and address
server.bind(srvcfg.port, srvcfg.host);

/* ************************************************************************ */
// create a socket to listen on for multi-cast packets...
const client = require('dgram').createSocket('udp4');

client.on('listening', () => {
    client.setBroadcast(true)
    client.setMulticastTTL(128); 
    client.addMembership(mulcfg.addr);
    consolelog(`UDP Multi-Cast Client listening on - ${mulcfg.addr}:${mulcfg.port}`);
});

/*
    Broadcast Received Event Handler
*/
client.on('message', (payload, remote) => {
    // the correct way to extract a string from the payload is this - 
    var message = payload.filter(letter => letter !== 0);
    
    if(!srvmsg_events.emit('STATUS_RCVD', message.toString(), remote)) console.error('STATUS_RCVD no listeners!!!');
    consolelog(`multicast received : [${message.toString()}] from ${remote.address}:${remote.port}`);

    var msg = JSON.parse(message.toString());
    if(msg.status === 'REQ_IP') {
        // reply with our IP, return the sequence number 
        // back to the caller.
        var temp = JSON.stringify({reply: 'IP_ADDR', hostip: srvcfg.host, seq: msg.seq});
        consolelog(`REQ_IP reply - ${temp}`);
        var reply = new Buffer(temp);
        client.send(reply, 0, reply.length, remote.port, remote.address, (err, bytes) => {
            if(err) consolelog(err.stack);
        });
    }
});

client.bind(mulcfg.port);


var db;

// Firebase
if(dbcfg.type === 'firebase') db = require(__dirname + '/firebase');

// MySQL
if(dbcfg.type === 'mysql') db = require(__dirname + '/mysql');

// initialize the chosen database connection 
db(srvmsg_events);



