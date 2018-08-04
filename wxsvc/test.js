/* ************************************************************************ */
// Events
const EventEmitter = require('events');
const evts = new EventEmitter();

const wsvc = require('./noaa-api-v3.js');
wsvc.init(evts);

// wait for sensor events from the server....
evts.on('WSVC_UPDATE', (m) => {
    //var data = Object.assign({}, m, {tstamp : Date.now()});
    console.log(`WSVC_UPDATE : ${JSON.stringify(m)}`);
});

evts.emit('WSVC_START');

setTimeout(retrieve, 5000);

function retrieve() {
    // var data = Object.assign({}, wsvc.currobsv, {tstamp : Date.now()});
    console.log(`retrieve : ${JSON.stringify(wsvc.currobsv)}`);
};
