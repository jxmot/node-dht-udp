/* ************************************************************************ */
/*
    MySQL Module - this module is responsible for :

        * Configure and start logging
        * Connecting to the database
        * Managing data(or status) row purges
        * Notifying connected clients when a new status or data has
          been written to the database.
        * On start collects the most recent status and data and saves
          them for when clients connect.

    (c) 2017 Jim Motyl - https://github.com/jxmot/node-dht-udp
*/
/* ************************************************************************ */
/*
    This code makes the logging possible, it consists
    of reading the module's options first and then a 
    check of the logging option is made. If it's true
    then logging is enabled.

    First, load the option settings...
*/
var logOpt = require('./log-opt.js');
/*
    For containing our constructed Log object
 
    If options.log is true, this will be our logging
    object otherwise it will be undefined.
*/
var fileOut;
/*
    Initialize logging and specify a logfile name
*/
function initLog(logname) {
    /*
        Let's log the output to a file if the
        option is true...
    */
    if(logOpt.log === true) {
        var Log = require('../lib/Log.js');
        if((logOpt.logname === undefined) || (logOpt.logname === '')) {
            fileOut = new Log(logname, logOpt.logext, logOpt.maxsize);
        } else {
            fileOut = new Log(true, logOpt.logname, logOpt.maxsize);
        }
    }
};

/*
    Write to the log file if the option was enabled and
    our Log object is defined, if not then write to the
    console. If the "conlog" option is true then the text
    will be written to the file AND the console.
*/
function log(text) {
    if(fileOut !== undefined) {
        // create log entries with a time stamp
        fileOut.writeTS(text);
        if(logOpt.conlog === true) console.log(text);
    }
    else if(logOpt.silent === false) console.log(text);
};

function logTrace(text) {
    if(logOpt.trace === true) log(text);
};

/* ************************************************************************ */
/*
    Database Interface Configure and other necessary things.
*/
var database = require('./database-mysql.js').database;
// database configuration, we need access to it here because
// we're using the database name to create a logfile name
var dbcfg = require('./_dbcfg.js');
// initialize a logfile for this database
initLog(dbcfg.parms.database);
// set the database module to use the same log file
// as we are
database.setLog(log);
// if not already created, this will cause the logfile to
// be created.
log('LOG START');
/* ************************************************************************ */
/*
    Initialize the client notification module.
*/
var notify = require('./notify.js');
notify.setLog(log);

/* ************************************************************************ */
/*
    Initialize the database connection and prepare for incoming
    data/status events.

    The server will forward incoming status and data via events. It is the
    owner of the EventEmitter, and passes a reference to this module.
*/
module.exports = function init(evts) {
    // When the database is opened continue with
    // the rest of the application
    database.openDB(dbcfg, openDone);

    // "database is open" handler,  if no errors have occurred
    // it will set up the data and status events that we'll get
    // from the server.
    function openDone(dbopen, err) {
        // did we have success?
        if(dbopen === false) {
            // no, log errors and end the transaction
            log('ERROR : openDone() err = ');
            log(err);
            // notify all connected clients of the error...
            // To Do: see notify.send()
            //notify.send('error', err);
        } else {
            // get the last status and data rows for all sensors
            sensorLast();

            // wait for sensor events from the server....
            evts.on('MSG_RCVD', (m, r) => {
                log(`MSG_RCVD : ${m}`);
                var data = Object.assign({}, JSON.parse(m), {tstamp : Date.now()});
                if(data.last !== undefined) delete data.last;
                database.writeRow(dbcfg.table[dbcfg.TABLE_DATA_IDX], data, writeDone);
            });
        
            evts.on('STATUS_RCVD', (m, r) => {
                log(`STATUS_RCVD : ${m}`);
                var status = Object.assign({}, JSON.parse(m), {tstamp : Date.now()});
                if(dbcfg.options.savehbeat === false) {
                    if(status.status === 'TICK' || status.status === 'TOCK') return;
                }
                database.writeRow(dbcfg.table[dbcfg.TABLE_STATUS_IDX], status, writeDone);
            });

            // if enabled set up a recurring data purge...
            if(dbcfg.purge.enabled === true) {
                // sensor data
                enablePurge(dbcfg.TABLE_DATA_IDX);
                // sensor status
                enablePurge(dbcfg.TABLE_STATUS_IDX);
            }

            // initialize the client notification module
            notify.init(getHistory);
        }
    };

    function getHistory(histreq, callback) {

    };

    //////////////////////////////////////////////////////////////////////////
    /*
        Handle all post row-saves, and notify a client
        that there's some "fresh" data to be displayed.
    */
    function writeDone(result, target, data) {
        logTrace(`writeDone() - result = ${result}   target = ${target}   payload = ${JSON.stringify(data)}`);

        if(result) {
            // notify all connected clients...
            notify.send(target, data);
        }
    };

    /*
        Obtain and save the last sensor status and data that was written to
        the database.

        This compliments the client status & data update, which occurs when 
        a client is connected. In situations where the parent application 
        has been started there is no accumulated status & data. This function
        reads the database for the most recent status & data and then saves
        for when the clients recconnect.
    */
    function sensorLast() {
        database.readRows('config', (table, rows) => {
            if(rows !== null) {
                rows.forEach(row => {
                    database.readRow('status', `dev_id = "${row.dev_id}" order by tstamp desc limit 1`, notify.updateLast);
                    database.readRow('data', `dev_id = "${row.dev_id}" order by tstamp desc limit 1`, notify.updateLast);
                });
            }
        });
    };

    function sensorHistory(dur = {f: 0, t:0}) {
    };

    //////////////////////////////////////////////////////////////////////////
    /*
        Data Purge - Remove rows specified by the key column 'tstamp'. This
        is done on an interval specified in 'example_dbcfg.js' (or _dbcfg.js
        for the file with the login and password).

        It is also possible to enable a purge-on-init so that the old data is
        removed when this application is started. This is configurable for
        each table.
    */
    // constant values representing time in milliseconds
    purgetimes = require('./purgetimes.js');

    /*
        Enable a Purge Timer - enables a purge timer for a specified table
    */
    function enablePurge(idx) {
        log(`enabling purge - table = ${dbcfg.table[idx]}   purge = ${JSON.stringify(dbcfg.purge.config[idx])}`);
        // start a purge timer
        startPurgeTimer(idx, purgetimerexpired);
        // is the immediate purge set to occur?
        if(dbcfg.purge.config[idx].oninit === true) {
            purgedata(dbcfg.table[idx], dbcfg.purge.config[idx]);
        }
    };

    /*
        Purge Timer Expired Handler - runs when the purge interval
        timer expires.
    */
    function purgetimerexpired(idx) {
        log(`purge interval timer expired - idx = ${idx}`);
        purgedata(dbcfg.table[idx], dbcfg.purge.config[idx]);
    }

    /*
        Purge Data - this gets called by purgetimerexpired() when
        purge interval timer expires. It takes a table name and purge 
        configuration object as arguments. See example_dbcfg.js(_dbcfg.js) 
        for details on how to specify the interval and depth.

        NOTE: This function can be called directly as needed. The interval
        timer is not required, but useful.
    */
    function purgedata(table, purge) {
        // specify rows that are older than today minus the depth in days
        var keyfield = `${purge.col} < (${Date.now()} - ${(purge.depth * purgetimes.DAY_1_MS)})`;
        log(`Attempting to purge rows in ${table} - that match - ${keyfield}`);
        database.deleteRow(table, keyfield, purgedone)
    };

    /*
        Purge Complete Handler - when the specified rows are purged this
        function is called by database.deleteRow()
    */
    function purgedone(table, result, rows) {
        log(`Purge complete on table ${table} - ${result}   ${rows}`);
        // notify all connected clients of the purge...
        notify.send('purge', {dbtable: table, dbresult: result, dbrows: rows, tstamp: Date.now()});
    };

    /*
        Start a Purge Timer - This will start an interval timer for a 
        specified table in the database.

        It will return 'true' on success, otherwise it returns 'false'.
    */
    function startPurgeTimer(idx, callme) {
        // Check the purge interval and depth, if both are valid then
        // initialize an interval timer.
        if(dbcfg.purge.config[idx].interval <= purgetimes.MAX_DAYS) {
            if(dbcfg.purge.config[idx].depth <= purgetimes.MAX_DAYS) {
                setInterval(callme, (dbcfg.purge.config[idx].interval * purgetimes.DAY_1_MS), idx);
                // some purge info...
                log(`Purge Timer started - ${JSON.stringify(dbcfg.purge.config[idx])}`);
                // success!
                return true;
            } else log(`ERROR - depth too large - ${dbcfg.purge.config[idx].depth}`);
        } else log(`ERROR - interval too large - ${dbcfg.purge.config[idx].interval}`);
        // oops! something has failed.
        return false;
    };

    //////////////////////////////////////////////////////////////////////////
    /*
    */
    const wsvc_noaa = require('../wxsvc/noaa-api-v3.js');
    wsvc_noaa.init(evts, log);

    /*
    */
    const wsvc_owm = require('../wxsvc/openwthr-api-v25.js');
    wsvc_owm.init(evts, log);

    // wait for a weather service condition update
    evts.on('WSVC_UPDATE', (wxupdate) => {
        //log(`WSVC_UPDATE : ${JSON.stringify(wxupdate)}`);
        log('WSVC_UPDATE : recvd');
        notify.send('wxobsv', wxupdate);
    });

    // wait for a weather service forecast update
    evts.on('WSVC_FORCST', (wxforcst) => {
        //log(`WSVC_FORCST : ${JSON.stringify(wxforcst)}`);
        log('WSVC_FORCST : recvd');
        notify.send('wxfcst', wxforcst);
    });

    evts.emit('WSVC_START');
};


