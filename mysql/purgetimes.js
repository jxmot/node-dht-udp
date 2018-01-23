/*
         1 day  =   86400000
        
         5 days =  432000000
        
        10 days =  864000000
        
        14 days = 1209600000

        21 days = 1814400000
        
        The intervals/depths below require special handling due to the
        limit of 2147483647ms (24.9 days).

        30 days = 2592000000
        
        60 days = 5184000000
        
        90 days = 7776000000
*/
module.exports = {
    // approximately 24.9 days
    MAX_TIME  : 2147483647,
    
    // a realistic maximum of 21 days can be used for the interval or depth
    MAX_DAYS  : 21,
    
    // can be used as purge interval or depth
    DAY_1_MS  : 86400000,
    DAYS_5_MS : 432000000,
    DAYS_10_MS: 864000000,
    DAYS_14_MS: 1209600000,
    DAYS_21_MS: 1814400000
};

