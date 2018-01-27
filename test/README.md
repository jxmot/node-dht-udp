# Mock Device Testing Tool

This is a small NodeJS application for testing the operation of the server. It transmits *fake* sensor data over UDP just like a real sensor device.

## External Dependencies

This application depends on the `sprintf-js` package. 

* npm : [https://www.npmjs.com/package/ssprintf-j](<https://www.npmjs.com/package/ssprintf-j>)
* github : [https://github.com/alexei/sprintf.js](<https://github.com/alexei/sprintf.js>)

## Features

* Temperature values are random, and range from 45.00 to 95.00 (*degrees Fahrenheit*)
* Humidity values are random, and range from 10.00 to 30.00
* Device IDs are fixed, but editable
    * They are chosen from a list, either in sequence or randomly
* Sends a specified number of data packets and then the application will exit
* A time delay occurs between each transmission

### Configuration

The application is very configurable, and the behavior can be altered by editing the `mock-devices-cfg.js` file. Here's an example of the configuration - 

```javascript
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
```

## Mock Data Creation

The mock data packet is created just prior to sending it. This accomplished with the following code -

```javascript
// mock data generator - 
var seq = 0;
var devidx = -1;

function getMockData() {

    // limit the range of the sequence number
    if(seq < 1000) seq += 1;
    else seq = 1;

    // two modes, sequential device ID, or random device ID
    if(cfg.mode === 'seq') {
        if((devidx += 1) === cfg.devlist.length) devidx = 0;
    } else devidx = randomVal(0, cfg.devlist.length - 1);

    // dividing the random value will provide fractional values
    var t = randomVal(cfg.t_min, cfg.t_max) / cfg.divisor;
    var h = randomVal(cfg.h_min, cfg.h_max) / cfg.divisor;

    // create the data packet
    var data = fmt.sprintf('{"dev_id":"%s","seq":%d,"t":%f,"h":%f}',
                           cfg.devlist[devidx], seq, t, h);

    return data;
};

// generates a random value between a "min" and a "max" value
function randomVal(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
};
```
## Sending Data

In order mimic a [sensor device](https://github.com/jxmot/esp8266-dht-udp) the application sends the data over UDP - 

```javascript
// create a socket
const dgram = require('dgram');
const client = dgram.createSocket('udp4');
// keep going until the count down reaches 0
var countdown = cfg.repeat;
// start sending...
sendUDP();
// then wait for a while and continue...
var timeout = setInterval( () => {
                sendUDP();
            }, cfg.interval);

// Send a UDP packet to the server
function sendUDP() {
    if(countdown > 0) {
        countdown -= 1;
        // send some data...
        var data = getMockData();
        console.log(`sending - ${data}`);
  
        client.send(data, 0, data.length, cfg.port, cfg.host, (err, bytes) => {
            if(err) throw err;
        });
    }else  process.exit();
};
```

## Output Example

While the application is running it will send output to the console as it transmits over UDP - 

```
sending - {"dev_id":"ESP_000001","seq":1,"t":85.87,"h":10.74}
sending - {"dev_id":"ESP_000002","seq":2,"t":78.6,"h":24.38}
sending - {"dev_id":"ESP_000003","seq":3,"t":91.66,"h":10.96}
sending - {"dev_id":"ESP_000004","seq":4,"t":51.3,"h":11.01}
sending - {"dev_id":"ESP_000005","seq":5,"t":62.42,"h":20.9}
sending - {"dev_id":"ESP_000001","seq":6,"t":61.92,"h":22.97}
sending - {"dev_id":"ESP_000002","seq":7,"t":45.73,"h":12.31}
sending - {"dev_id":"ESP_000003","seq":8,"t":88.68,"h":19.72}
sending - {"dev_id":"ESP_000004","seq":9,"t":79.83,"h":28.17}
sending - {"dev_id":"ESP_000005","seq":10,"t":56.1,"h":26.2}
sending - {"dev_id":"ESP_000001","seq":11,"t":67.08,"h":29.59}
sending - {"dev_id":"ESP_000002","seq":12,"t":79.86,"h":26.9}
sending - {"dev_id":"ESP_000003","seq":13,"t":45.68,"h":16.78}
sending - {"dev_id":"ESP_000004","seq":14,"t":57.7,"h":23.22}
sending - {"dev_id":"ESP_000005","seq":15,"t":70.68,"h":25.76}
```

