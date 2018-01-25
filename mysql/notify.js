/* ************************************************************************ */
/*
    Notify connected clients when chosen events (some with data) occur on 
    the server. The client for this module chooses which events and data
    to send. The client(s) must agree on the channel.
*/
module.exports = (function() {

    notify = {};

    /* ******************************************************************** */
    /*
        Change where log output goes.
    */
    // For logging, defaults to console.log()
    var log = console.log;

    notify.setLog = function(newLog){
        if(newLog !== undefined) log = newLog;
        else log = console.log;
    };

    /* ******************************************************************** */
    // initialize the server
    var http   = require('http');
    var server = http.createServer();

    // Socket.io listens to our server
    var io = require('socket.io').listen(server);

    // Count connections as they occur, decrement when a client disconnects.
    // If the counter is zero then we won't send anything over the socket.
    var connCount = 0;

    // A client has connected, 
    io.on('connection', function(socket) {

        socket.emit('SERVER', {message: 'READY', status: true, id: socket.id});

        // Increment the connection counter
        connCount += 1;
    
        // log the new connection for debugging purposes.
        log('notify on connect - '+socket.id+'   '+connCount);
    
        // The client that initiated the connection has disconnected.
        socket.on('disconnect', function () {
            connCount -= 1;
            log('notify on disconnect - '+socket.id+'   '+connCount);
        });
    });
    
    // Start listening...
    var cfg = require('./socket_cfg.js');
    server.listen(cfg.port);

    // Send something to all connected clients (a broadcast) the
    // 'channel' will indicate the destination within the client
    // and 'data' becomes the payload. 
    notify.send = function(channel, data) {
        log('notify - channel = '+channel+'  payload = '+JSON.stringify(data));
        if(connCount > 0) io.emit(channel, {payload: data});
        else log('notify.send - no connections');
    };

    return notify;
})();

