/*
    Server Configuration
*/
module.exports = {
    host : '192.168.0.7',
    //host : '127.0.0.1',
    //host : '0.0.0.0',
    port : 80,
    devices: {
        'ESP_39F542':['Den', 'den'],
        'ESP_49EB40':['Master Bedroom', 'mbr'],
        'ESP_49ECCD':['Living Room', 'lr'],
        'ESP_49EC8B':['Office', 'ofc']
    },
    watch: '../datashare/sensorlast.json',
    axid: '123456'
};
