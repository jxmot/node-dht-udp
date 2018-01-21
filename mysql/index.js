/* ************************************************** */
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

function initLog(logname) {
    /*
        Let's log the output to a file if the
        option is true...
    */
    if(logOpt.log === true) {
        //var Log = require('./Log.js');
        var Log = require('../lib/Log.js');
        if((logOpt.logname === undefined) || (logOpt.logname === '')) {
            //fileOut = new Log('sensornet', logOpt.logext);
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

/* ************************************************** */
/*
    Database API Abstraction
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

module.exports = function init(evts) {
    // When the database is opened continue with
    // the rest of the application
    database.openDB(dbcfg, openDone);

    function openDone(dbopen, err) {
        // did we have success?
        if(dbopen === false) {
            // no, log errors and end the transaction
            log('ERROR - openDone() err = ');
            log(err);
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
        }
    };

    function writeDone(result, target, data) {
        log('writeDone() - result = '+result);
        log('writeDone() - target = '+target);
        log('writeDone() - data   = '+JSON.stringify(data));
        if(result) {
            // notify all connected clients...
            //clientNotify(target, data);
        }
    };
};

