/*
    UDP Server Configuration
*/
// when 'true' we won't hear any sensors
const testmode = true;

module.exports = {
    name: 'generic',

    server : {
        host : '0.0.0.0',
        port : (testmode ? 55555 : 48431),
        reply: false
    },

    multi : {
        addr : '224.0.0.1',
        port : (testmode ? 44444 : 54321)
    },

    db : {
        type : 'mysql'
    },

    conlog: true
};
