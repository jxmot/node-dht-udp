/* ************************************************************************ */
/*
    MySQL Connection Settings & Record Definition

    For information on the contents of 'parms' see - 

        https://www.npmjs.com/package/mysql#connection-options

    To Do: make column names, types, and sizes individual 
    as configuration items.
*/
module.exports = {
    parms: {
        host     : 'localhost',
        database : 'sensornet',
        user     : 'the-user',
        password : 'user-password'
    },
    // the tables we're using
    table: [
        'status',
        'data'
    ],
    // column definitions for the tables
    col:   [
        'dev_id varchar(64) not null, status varchar(16) not null, msg varchar(64), tstamp bigint(16) not null, primary key (tstamp)',
        'dev_id varchar(64) not null, seq int(6) not null, t decimal(5,2) not null, h decimal(5,2) not null, tstamp bigint(16) not null, primary key (tstamp)'
    ]
};

