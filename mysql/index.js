/* ************************************************** */
/*
    This code makes the logging possible, it consists
    of reading the module's options first and then a 
    check of the logging option is made. If it's true
    then logging is enabled.

    First, load the option settings...
*/
var appOpt = require('./sensornet-opt.js');
/*
    For containing our constructed Log object
 
    If options.log is true, this will be our logging
    object otherwise it will be undefined.
*/
var fileOut;
/*
    Let's log the output to a file if the
    option is true...
*/
if(appOpt.log === true) {
    var Log = require('./Log.js');
    if((appOpt.logname === undefined) || (appOpt.logname === '')) {
        fileOut = new Log('sensornet', appOpt.logext);
    } else {
        fileOut = new Log(true, appOpt.logname);
    }
}

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
        if(appOpt.conlog === true) console.log(text);
    }
    else if(appOpt.silent === false) console.log(text);
};

/* ************************************************** */
/*
    Database API Abstraction
*/
var database = require('./database-mysql.js').database;

// set the database module to use the same log file
// as we are
database.setLog(log);

module.exports = function init(evts) {

    // When the database is opened continue with
    // the rest of the application
    database.openDB('./_dbcfg.js', openDone);

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
                database.writeRow('data', data, writeDone);
            });
        
            evts.on('STATUS_RCVD', (m, r) => {
                log(m);
                var status = Object.assign({}, JSON.parse(m), {tstamp : Date.now()});
                database.writeRow('status', status, writeDone);
            });
        }
    };

    function writeDone(newID) {
        log('writeDone() - newID = '+newID);
    };
};

