/*
    Firebase Configuration Example - 

    This file contains the information required by firebase when you're
    interacting with it. Typically you would make a COPY of this file and
    rename it to `_firebase-config.js`. Then you would fill in the APIKEY,
    SECRET, PROJECT, and HOST to match your firebase settings.

    NOTE: When the filenames (any file in this repo) begin with an `_`
    (underscore) they are set to be ignored by an entry in the `.gitignore` 
    file.

    Since there are no comments in a

*/
module.exports = {
    // database specific settings, change as needed for 
    // your database
    APIKEY : "",
    SECRET : "",
    PROJECT : "",
    HOST : "",

    // these parts are not likely to change much, unless
    // google changes them. but they're kept here because
    // they're tightly coupled to firebase itself.
    RULES_PATH : "/.settings/rules.json?auth=",
    JSON_AUTH : ".json?auth=",
    LOGIN_HOST : "www.googleapis.com",
    EMAIL_LOGIN : "/identitytoolkit/v3/relyingparty/verifyPassword?key=",
    ANONY_LOGIN : "/identitytoolkit/v3/relyingparty/signupNewUser?key="
};

