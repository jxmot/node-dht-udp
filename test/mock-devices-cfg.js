/*
    Mock Devices Configuration
*/
module.exports = {
    host : '192.168.0.7',
    port : 48431,
    devlist: ['ESP_000001','ESP_000002','ESP_000003','ESP_000004','ESP_000005'],
    // works best if `repeat` is a multiple of the length of `devlist`
    repeat: 15,
    interval: 3000,
    // choices are - 
    //      'seq'  = each mock device in sequence
    //      'rand' = mock devices are chosen randomly
    mode: 'seq'
};
