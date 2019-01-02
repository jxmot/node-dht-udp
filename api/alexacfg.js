/*
    Alexa Data Provider Application Configuration
*/
module.exports = {
    // address + port that we'll listen on for
    // requests from the alexa skill
    host : '192.168.0.7',
    port : 80,
    _port : 8080,
    // devices must match the creator of the
    // data file. 
    devices: {
    //  Device ID    Proper Name      Query Path
        'ESP_39F542':['den',            'den'],
        'ESP_49EB40':['master bedroom', 'mbr'],
        'ESP_49ECCD':['living room',    'lr'],
        'ESP_49EC8B':['office',         'ofc']
    },
    // path relative to application location
    watch: '../datashare/sensorlast.json',
    // this must match the ID provided in the 
    // requests from the alexa skill
    axid: '123456',
    _axid: 'EvW4{.7sgAzf$E!K'
};
