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
    var traceopt = false;

    // the module client chooses the logging destination
    notify.setLog = function(newLog, trace){
        if(newLog !== undefined) log = newLog;
        else log = console.log;

        if(trace !== undefined) traceopt = trace;
        else traceopt = false;
    };

    function logTrace(msgout) {
        if(traceopt === true) log(msgout);
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

    // contains the last status and data for each device
    var sensorlast = {
        purge: [],
        status: [],
        data: [],
        wxobsv: [],
        wxfcst: []
        // To Do: currently not in use, will require some 
        // thought and a decision in regards to just how
        // much awareness the client modules need of 
        // internal errors.
        //error: []
    };

    /*
        Contains sensor statistics:
        data: [
            "devid": {
                oldest: epoch time of oldest record
                total: total number of records at time of update
            }
        ]

        NOTE: data["devid"].oldest does not change except during
        app-start and after a purge has occurred. The same is true
        of data["devid"].total.

    */
    var stats = {
        data: {},
//        status: {}
    };

    var configcurr = {};

    notify.init = function(_getHistory) {

        // A client has connected, 
        io.on('connection', function(socket) {

            socket.on('wxsvcsel', function (data) {
                log(`socket ${socket.id} on wxsvcsel - ${JSON.stringify(data)}`);

                if(sensorlast['wxobsv'][data.wxsvc] !== undefined)
                    resend('wxobsv', socket, sensorlast['wxobsv'], data.wxsvc);

                if(sensorlast['wxfcst'][data.wxsvc] !== undefined)
                    resend('wxfcst', socket, sensorlast['wxfcst'], data.wxsvc);
            });
// NOTE: is not recvd until after the sensorlast resend, needs
// to occur before that... OR hold off resend until this is recvd
//            socket.on('optbits', function (data) {
//                log(`socket ${socket.id} on optbits - ${JSON.stringify(data)}`);
//            });

            var query = {
                from: 0,
                to: 0,
                dev_id: []
            };

            socket.on('senshist', function (data) {
                log(`socket ${socket.id} on senshist - ${JSON.stringify(data)}`);
                // data {
                //      datefrom: an epoch date value, at 00:00 of the selected day
                //      dev_id: ['ESP_XXXX'] <- device IDs
                // }
                query.to = Date.now();
                query.from = data.datefrom;
                query.dev_id = JSON.parse(JSON.stringify(data.dev_id));

                _getHistory(query, sendHistory);
            });

            function sendHistory(table, data, err) {
                var hist = Object.assign({},{query:query},{data:data},{err:err});
                log(`socket ${socket.id} on sendHistory() - ${JSON.stringify(hist).length}`);
                socket.emit('histdata', hist);
            };

            // https://socket.io/docs/emit-cheatsheet/
            // tell the client we're ready for them
            socket.emit('server', {message: 'READY', status: true, id: socket.id, tstamp : Date.now()});
            // send the configuration as it was read during init
            socket.emit('config', configcurr);
            // send the sensor stats
            socket.emit('stats', stats);

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
    log(`listening on port - ${cfg.port}`);

    // resend (or send) payloads to a specified socket.
    function resend(channel, socket, payloads, format = undefined) {
        if(connCount > 0) {
            for(var key of Object.keys(payloads)) {
                if(format === undefined) {
                    socket.emit(channel, {payload: payloads[key]});
                    log(`resend(${channel}) - ${key}: ${JSON.stringify(payloads[key]).length}`);
                } else {
                    if(format === payloads[key].format) {
                        socket.emit(channel, {payload: payloads[key]});
                        log(`resend(${channel}) sel ${format} - ${key}: ${JSON.stringify(payloads[key]).length}`);
                    }
                }
            }
        } else log('resend() - no connections');
    };

    // Broadcast something to all connected clients (a broadcast) the
    // 'channel' will indicate the destination within the client
    // and 'data' becomes the payload. 
    notify.send = function(channel, data) {
        logTrace(`notify - channel = ${channel}  payload = ${JSON.stringify(data)}`);
        // save for new client connections
        notify.updateLast(channel, data);
        // don't bother broadcasting anything if no one is connected.
        if(connCount > 0) io.emit(channel, {payload: data});
        else logTrace('notify.send - no connections');
    };

    notify.updateConfig = function(data) {
        configcurr = JSON.parse(JSON.stringify(data));
    };

    notify.updateStats = function(table, data) {
        if(data !== null) {
            stats[table][data[0].dev_id] = Object.assign({}, stats[table][data[0].dev_id], {oldest:data[0].tstamp});
        }
    };

    notify.updateCounts = function(table, ignore, res) {
        if(res !== -1) {
            var dev_id = res.k.substring(res.k.indexOf('"') + 1, res.k.lastIndexOf('"'));
            stats[table][dev_id] = Object.assign({}, stats[table][dev_id], {total:res.r});
        }
    };

    notify.sendNewStats = function() {
        log(`sendNewStats ${connCount} - ${JSON.stringify(stats)}`);
        // don't bother broadcasting anything if no one is connected.
        if(connCount > 0) io.emit('stats', stats);
        else logTrace('notify.sendNewStats - no connections');
    };

    // add fresh data to the sensorlast container
    notify.updateLast = function(channel, data, error = null) {
        if(data !== null) {
            // save for new client connections
            if(channel === 'purge') { 
                sensorlast[channel][data.dbtable] = data;
            } else {
                if((channel === 'wxobsv') || (channel === 'wxfcst')) {
                    sensorlast[channel][data.format] = data;
                } else {
                    if(data.dev_id !== undefined) {
                        sensorlast[channel][data.dev_id] = data;
                        logTrace(`notify.updateLast - ${channel}  ${data.dev_id}  ${JSON.stringify(sensorlast[channel][data.dev_id])}`);
                    } else {
                        if(data[0].dev_id !== undefined) {
                            sensorlast[channel][data[0].dev_id] = data[0];
                            logTrace(`notify.updateLast array - ${channel}  ${data[0].dev_id}  ${JSON.stringify(sensorlast[channel][data[0].dev_id])}`);
                        }else log(`notify.updateLast - WARNING not updated \"${channel}\" data = ${JSON.stringify(data)}`);
                    }
                }
            }
        } else {
            if((error !== null) && (error.err === true)) {
                err = {table:channel, data:null, err:error};
                log(`notify.updateLast() - err = ${JSON.stringify(err)}`);
            }
        }
    };

    return notify;
})();

