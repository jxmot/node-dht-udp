/*
    Application Specific Socket.io Initialization and Event Handlers

    (c) 2017 Jim Motyl - https://github.com/jxmot/
*/
var socket;
var socketready = false;

function initSocket() {

    if(socketready === true) {
        consolelog('WARNING - socket is already connected');
        return;
    }

    socket = io.connect(socketserver.host+':'+socketserver.port+'/', {
                        'reconnection': true,
                        'reconnectionDelay': 3000,
                        'reconnectionDelayMax' : 5000,
                        // FYI, it's odd... 5=6,4=5,etc. that's because
                        // the 1st attempt is actually a "connect". the
                        // "reconnect" attempts come after it.
                        'reconnectionAttempts': 4});

    socket.on('connect_error', function(error) {
        // it's convenient that the alert halts everything,
        // makes it easier when restarting the server.
        alert('connect_error - '+JSON.stringify(error));
    });

    socket.on('server', function(data) {
        consolelog('server - '+JSON.stringify(data));
        // for future use, a placeholder for reacting
        // to messages from the server itself
        if(data.status === true) socketready = true;
        else socketready = false;
    });

// TODO: pass in an arg that specifies which of the
// following to enable. For charts a post-init enable
// of socket.on('data',...) would be useful for live 
// charting.
// 
//    socket.on('status', showStatus);
//    socket.on('data', showData);
    socket.on('histdata', showHistory);
    socket.on('config', saveConfig);
//    socket.on('purge', showPurge);
//    socket.on('wxobsv', showWXObsv);
//    socket.on('wxfcst', showWXFcast);

    socket.on('disconnect', function(){ 
        socketready = false;
        consolelog('INFO - socket was disconnected');
    });
};
/*
// function showStatus(data) {
//     consolelog('showStatus - '+JSON.stringify(data.payload));
//     $(document).trigger(data.payload.dev_id, data.payload);
// };
// 
// function showData(data) {
//     consolelog('showData - '+JSON.stringify(data.payload));
//     $(document).trigger(data.payload.dev_id, data.payload);
// };
// 
// function showPurge(data) {
//     consolelog('showPurge - '+JSON.stringify(data.payload));
//     $(document).trigger('purge_status', data.payload);
// };
// 
// function showWXObsv(data) {
//     consolelog('showWXObsv - '+JSON.stringify(data.payload));
//     $(document).trigger('wxsvc_obsv', data.payload);
// };
// 
// function showWXFcast(data) {
//     consolelog('showWXFcast - '+JSON.stringify(data.payload));
//     $(document).trigger('wxsvc_fcst', data.payload);
// };
// 
// $(document).on('gauges_ready', function() {
//     // initialize sockets for incoming sensor status and data
//     initSocket();
// });
*/
$(document).on('hist_ready', function() {
    // initialize sockets for incoming sensor status and data
    initSocket();
});

function saveConfig(cfg) {
    $(document).trigger('config', JSON.stringify(cfg));
};

function showHistory(hist) {
    $(document).trigger('hist_show', JSON.stringify(hist));
};

$(document).on('hist_request', function(e, sel) {
    if(socketready === true) {
        //consolelog('hist_request - ' + JSON.stringify(sel));
        socket.emit('senshist', sel);
    }
});

// $(document).on('wxsvc_select', function(e, sel) {
//     if(socketready === true) {
//         consolelog('wxsvc_select - ' + sel);
//         socket.emit('wxsvcsel', {wxsvc: sel});
//     }
// });


