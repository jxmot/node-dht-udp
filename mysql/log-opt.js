/* ************************************************************************ */
/*
    Option Settings

        This file will contain various option related variables.

        At this time this option file only contains settings related to 
        logging.
*/
module.exports = {
    /*
        Logging Options
    */
    log: true,                  // enable logging to a file
    conlog: false,              // enable console logging while
                                // file logging is enabled
    silent: true,               // mutes output when log is false
    trace: false,               // false = quieter log file
    logext: 'log',              // use "log" for the logging file 
                                // extension when logname is not 
                                // present or empty
    logname: '',                // use the file name provided by
                                // the client, then add the extension
                                // found above
    maxsize: 262144             // max log file size
};

