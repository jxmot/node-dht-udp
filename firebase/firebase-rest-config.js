module.exports = {
    // components for building firebase API calls - 
    CONFIG : require(__dirname + '/_firebase-config.js'),

    // credentials for email login to firebase - 
    CRED : require(__dirname + '/_firebase-cred.json'),
    
    /*
        Path components used in creating full paths to the data
        we want to access. This would be specific to the application
        and would change as needed.
    */
    PATHS : require(__dirname + '/_firebase-paths.js'),

    USER_AGENT : 'nodejs-app'
};

