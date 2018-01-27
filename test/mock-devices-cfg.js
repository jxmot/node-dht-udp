/*
    Mock Devices Configuration
*/
module.exports = {
    // the server that receives our data
    host : '192.168.0.7',
    port : 48431,
    // fake sensor device IDs
    devlist: ['ESP_000001','ESP_000002','ESP_000003','ESP_000004','ESP_000005'],
    // for generating random data values
    t_min: 4500,
    t_max: 9500,
    h_min: 1000,
    h_max: 3000,
    // dividing the random value will provide fractional values
    divisor: 100,
    // works best if 'repeat' is a multiple of the 
    // length of 'devlist' when the 'mode' is 'rand'.
    repeat: 15,
    interval: 3000,
    // choices are - 
    //      'seq'  = each mock device in sequence
    //      'rand' = mock devices are chosen randomly
    mode: 'seq'
};
