/* ************************************************************************ */
/*
    MySQL Connection Settings & Record Definition

    For information on the contents of 'parms' see - 

        https://www.npmjs.com/package/mysql#connection-options

    To Do: make column names, types, and sizes individual 
    as configuration items.

    (c) 2017 Jim Motyl - https://github.com/jxmot/node-dht-udp
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
    ],
    // indices to access table names, allows for some abstraction
    TABLE_STATUS_IDX: 0,
    TABLE_DATA_IDX: 1,

    // data purge configuration
    purge: {
        enabled: true,
        table: [
            {
                oninit: false,
                // the column used for compaison, this
                // is also this table's primary key
                col: 'tstamp',
                // the number of days between purges
                interval: 5,
                // how deep (in days) is the purge?
                // example: 7 would result in purging
                // anything older than 7 days ago from
                // the time the purge is run.
                depth: 7
            },
            {
                oninit: true,
                col: 'tstamp',
                interval: 5,
                depth: 21
            }
        ]
    }
};

