module.exports = {
    // components for building firebase API calls - 
    CONFIG : require(__dirname + '/_firebase-config.js'),

    /*
        Path components used in creating full paths to the data
        we want to access. This would be specific to the application
        and would change as needed.
    */
    PATHS : require(__dirname + '/_firebase-paths.js'),

    HTTPS_PORT : 443,
    HTTP_PORT : 80,
    USER_AGENT : 'SensorNet/0.0.2'
};

