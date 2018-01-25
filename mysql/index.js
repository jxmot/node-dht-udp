/* ************************************************************************ */
/*
    MySQL Module - this module is responsible for :

        * Configure and start logging
        * Connecting to the database
        * Managing data(or status) row purges
        * Notifying connected clients when a new status or data has
          been written to the database.
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
            fileOut = new Log(logname, logOpt.logext);
        } else {
            fileOut = new Log(true, logOpt.logname);
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
    Initialize the notification module.
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
            log('ERROR - openDone() err = ');
            log(err);
            // notify all connected clients of the error...
            notify.send('ERROR', err);
        } else {
            // wait for events....
            evts.on('MSG_RCVD', (m, r) => {
                log(m);
                var data = Object.assign({}, JSON.parse(m), {tstamp : Date.now()});
                database.writeRow(dbcfg.table[dbcfg.TABLE_DATA_IDX], data, writeDone);
            });
        
            evts.on('STATUS_RCVD', (m, r) => {
                log(m);
                var status = Object.assign({}, JSON.parse(m), {tstamp : Date.now()});
                database.writeRow(dbcfg.table[dbcfg.TABLE_STATUS_IDX], status, writeDone);
            });

            // if enabled set up a data purge...
            //if(dbcfg.purge.enabled === true) {
            //    enablePurge(dbcfg.table[dbcfg.TABLE_DATA_IDX], dbcfg.purge.table[dbcfg.TABLE_DATA_IDX]);
            //    enablePurge(dbcfg.table[dbcfg.TABLE_STATUS_IDX], dbcfg.purge.table[dbcfg.TABLE_STATUS_IDX]);
            //}
        }
    };

    /*
        Handle all post row-saves, and notify a client
        that there's some "fresh" data to be displayed.
    */
    function writeDone(result, target, data) {
        log('writeDone() - result = '+result);
        log('writeDone() - target = '+target);
        log('writeDone() - data   = '+JSON.stringify(data));
        if(result) {
            // notify all connected clients...
            notify.send(target, data);
        }
    };

    //////////////////////////////////////////////////////////////////////////
    /*
        Data Purge - Remove rows specified by the key column 'tstamp'. This
        is done on an interval specified in 'example_dbcfg.js' (or _dbcfg.js
        for the file with the login and password).

        It is also possible to enable a purge-on-init so that the old data is
        removed when this application is started.
    */
    // constant values representing time in milliseconds
    purgetimes = require('./purgetimes.js');
    // When a purge timer is created and started this object is 
    // filled in. And then this object is pushed into purgetimeouts[].
    var purgetimer = {
        timeout: {},
        table: '',
        // purge info
        col: '',
        // these values will be represented in milliseconds
        interval: 0,
        depth: 0,
        // addtional purge info
        callback: undefined,
        purgecount: 0
    };
    // contains the active purge timers.
    var purgetimeouts = [];

    /*
        Enable a Purge Timer - enables a purge timer for a specified table
    */
    function enablePurge(table, purge) {
        log('enabling purge - ' + table + '   ' + JSON.stringify(purge));
        console.log('enabling purge - ' + table + '   ' + JSON.stringify(purge));
        // start a purge timer
        startPurgeTimer(table, purge, purgedata);
        // is an immediate purge set?
        if(purge.oninit === true) 
            purgedata(table, purge);
    };

    /*
        Purge Timer Expired Handler - this gets called by the expired
        purge interval timer. It takes a table name and purge configuration
        object. See example_dbcfg.js(_dbcfg.js) for details on how to 
        specify the interval and depth.

        NOTE: This function can be called directly as needed. The interval
        timer is not required.
    */
    function purgedata(table, purge) {
        var keyfield = purge.col + ' < (' + Date.now() + ' - ' + (purge.depth * purgetimes.DAY_1_MS) + ')';
        database.deleteRow(table, keyfield, purgedone)
    };

    /*
        Purge Complete Handler - when the specified rows are purged this
        function is called by database.deleteRow()
    */
    function purgedone(table, result, rows) {
        log('Purge complete on table '+table+' - '+result+'   '+rows);
        // notify all connected clients of the purge...
        notify.send('PURGE', {dbtable: table, dbresult: result, dbrows: rows});
    };

    /*
        Start a Purge Timer - This will start an interval timer for a 
        specified table in the database.

        It will return 'true' on success, otherwise it returns 'false'.
    */
    function startPurgeTimer(table, purge, callme) {
        // save the purge callback and specs...
        purgetimer.callback = callme;
        purgetimer.table = table;
        purgetimer.purgecount = 0;
        purgetimer.col = purge.col;
        // Check the purge interval and depth, if both are valid then
        // initialize an interval timer and save the purge object in
        // an array.
        if(purge.interval <= purgetimes.MAX_DAYS) {
            purgetimer.interval = (purge.interval * purgetimes.DAY_1_MS);
            if(purge.depth <= purgetimes.MAX_DAYS) {
                purgetimer.depth = (purge.depth * purgetimes.DAY_1_MS);
                // The purge interval and depth have been calculated and
                // now it's time to save the purge timer so we can have
                // the ability to cancel it(if necessary).
                var purgeidx = (purgetimeouts.push(JSON.parse(JSON.stringify(purgetimer))) - 1);
                // set the interval timer...
                purgetimeouts[purgeidx].timeout = setInterval(purgetimer.callback, purgetimer.interval, purgeidx);
                // some purge info...
                log('Purge Timer started - '+JSON.stringify(purgetimer));
                // success!
                return true;
            } else log('ERROR - purge.depth too large - '+purge.depth);
        } else log('ERROR - purge.depth too interval - '+purge.depth);
        // oops! something has failed.
        return false;
    };
};


