/* ************************************************************************ */
/*
    Notify connected clients when chosen events (some with data) occur on 
    the server. The client for this module chooses which events and data
    to send. The client(s) must agree on the channel.

    (c) 2017 Jim Motyl - https://github.com/jxmot/node-dht-udp
*/
module.exports = (function() {

    notify = {};

    /* ******************************************************************** */
    /*
        Change where log output goes.
    */
    // For logging, defaults to console.log()
    var log = console.log;

    // the module client chooses the logging destination
    notify.setLog = function(newLog){
        if(newLog !== undefined) log = newLog;
        else log = console.log;
    };

    /* ******************************************************************** */
    // Initialize the server that web clients will connect to.
    var http   = require('http');
    var server = http.createServer();

    // Socket.io listens to our server
    var io = require('socket.io').listen(server);

    // Count connections as they occur, decrement when a client disconnects.
    // If the counter is zero then we won't send anything over the socket.
    var connCount = 0;

    notify.init = function() {
        // A client has connected, 
        io.on('connection', function(socket) {
            socket.emit('SERVER', {message: 'READY', status: true, id: socket.id, tstamp : Date.now()});
            // Increment the connection counter
            connCount += 1;
            // log the new connection for debugging purposes.
            log(`notify on connect - ${socket.id}  connCount = ${connCount}`);
            log(`notify on connect - ${socket.id}  remote = ${socket.client.conn.remoteAddress}  referer = ${socket.handshake.headers.referer}`);
            // get the last purge, status and data that was saved 
            // and update the new client
            for(var key of Object.keys(sensorlast)) {
                resend(key, socket, sensorlast[key]);
            }
            // The client that initiated the connection has disconnected.
            socket.on('disconnect', function () {
                connCount -= 1;
                log(`notify on disconnect - ${socket.id}   connCount = ${connCount}`);
            });
        });
    };
    
    // Start listening...
    var cfg = require('./socket_cfg.js');
    server.listen(cfg.port);

    // contains the last status and data for each device
    var sensorlast = {
        purge: [],
        status: [],
        data: []
        // To Do: currently not in use, will require some 
        // thought and a decision in regards to just how
        // much awareness the client modules need of 
        // internal errors.
        //error: []
    };

    // resend (or send) payloads to a specified socket.
    function resend(channel, socket, payloads) {
        if(connCount > 0) {
            for(var key of Object.keys(payloads)) {
                log(`resend(${channel}) - ${key}: ${JSON.stringify(payloads[key])}`);
                socket.emit(channel, {payload: payloads[key]});
            }
        } else log('resend() - no connections');
    };

    // Broadcast something to all connected clients (a broadcast) the
    // 'channel' will indicate the destination within the client
    // and 'data' becomes the payload. 
    notify.send = function(channel, data) {
        log(`notify - channel = ${channel}  payload = ${JSON.stringify(data)}`);
        // save for new client connections
        notify.updateLast(channel, data);
        // don't bother broadcasting anything if noone is connected.
        if(connCount > 0) io.emit(channel, {payload: data});
        else log('notify.send - no connections');
    };

    // add fresh data to the sensorlast container
    notify.updateLast = function(channel, data) {
        // save for new client connections
        if(channel === 'purge') sensorlast[channel][data.dbtable] = data;
        else sensorlast[channel][data.dev_id] = data;
    };

    return notify;
})();

