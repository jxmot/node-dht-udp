/*
    Server Configuration
*/
module.exports = {
    host : '192.168.0.7',
    //host : '127.0.0.1',
    //host : '0.0.0.0',
    port : 80,
    names: {
        'ESP_39F542':'Den', 
        'ESP_49EB40':'Master Bedroom', 
        'ESP_49ECCD':'Living Room', 
        'ESP_49EC8B':'Office'
    },
    watch: '../datashare/sensorlast.json'
};

/*
    names: [
        ['ESP_39F542','Den'], 
        ['ESP_49EB40','Master Bedroom'], 
        ['ESP_49ECCD','Living Room'], 
        ['ESP_49EC8B','Office']
    ],
*/