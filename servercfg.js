/*
    UDP Server Configuration
*/
module.exports = {
    server : {
        host : '0.0.0.0',
        port : 48431,
        reply: false
    },

    multi : {
        addr : '224.0.0.1',
        port : 54321,
    },

    db : {
        type : 'mysql'
    },

    conlog: true
};
