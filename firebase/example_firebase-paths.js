/*
    Database Path Components

    This file contains the components that are concatenated together
    as needed to create a path to where the records are saved in the
    database. For example, the data tree would appear as - 

    PROJECT_ID -    <-- created by firebase
                |
                +- SENSOR_PARENT - 
                                  |
                                  + - SENSOR_DATA -
                                  |                +- data
                                  |
                                  |
                                  + - SENSOR_STAT -
                                                   +- data

    
    
*/
module.exports = {
    /*
        Path components used in creating full paths to the data
        we want to access. This would be specific to the application
        and would change as needed.
    */
    
    // firebase path components...
    //      Parent 
    SENSOR_PARENT : 'sensorlog',

    //      Children of Parent
    //
    // For example - 
    //
    //      PATH_SEP + SENSOR_PARENT + PATH_SEP + SENSOR_DATA
    //
    //      PATH_SEP + SENSOR_PARENT + PATH_SEP + SENSOR_STAT
    //
    
    //      Children of Parent->Children
    SENSOR_DATA : 'data',
    SENSOR_STAT : 'status',
    
    // Separator for path components
    PATH_SEP  : '/',
};
