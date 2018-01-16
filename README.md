# node-dht-udp

This is the server component for the SensorNet project. 

# History

After the development on the [esp8266-dht-udp>](<https://github.com/jxmot/esp8266-dht-udp>) project reached the point were a *real* server was necessary the [test code](<https://github.com/jxmot/esp8266-dht-udp/tree/master/src/applib/nodejs>) was used as a starting point for this server.

# Overview

This server has been implemented as a NodeJS application. It is required to listen for UDP packets that contain sensor data from the ESP8266 devices and then forward the data to a database. This particular implementation utilizes Firebase.

It also listens for multi-cast UDP packets. They are used to convey the status of the ESP8266 devices.

# Requirements

This NodeJs application must - 

* Be as *thin* as possible. The intended target platform is the **Tessel 2**. However this application can be run on *any* NodeJS installation.
* Utilize a database where clients can be notified *in real time* when new records are written to the database. At this time Firebase is the only solution that offers that feature.
* Acts only as a means to forward data to the database. The sensor devices define the layout and contents of the data records. The only alteration to the data records is the addition of a timestamp. 

# Details

This application makes use of the *Firebase REST API*. And it does not require any packages other than the native NodeJS packages.

## Running the Application

Run the application with - `node server.js`

### Firebase Requirements

In order to run for more than a relatively short period of time it is necessary to use some means to limit the amount of accumulated sensor data and status records. The method used here are *Firebase Cloud Functions*. For details please review this [README](<https://github.com/jxmot/node-dht-udp/blob/master/firebase/cloudfuncs/README.md>).

## Configuration

### File Naming Convention

Some configuration files may contain *sensitive* information that should not be placed into a public repository. In order to prevent them from getting into the repository their filenames begin with an underscore. This is accomplished with an entry in this repository's `.gitignore` file. However there are example configuration files provided that to not have the underscore in their names.

### Server/Client Configuration

The primary configuration is kept in `servercfg.js` - 

```javascript
module.exports = {

    server : {
        host : '0.0.0.0',
        port : 48431,
        reply: false
    },

    multi : {
        addr : '224.0.0.1',
        port : 54321,
    }
};
```

The `server` object represents the IP address and port on which the server will listen for *sensor data*. The use of `host : '0.0.0.0'` indicates that all network interfaces are to be used. If you need to listen on a specific interface then replace `0.0.0.0` with the IP address of that interface.

The `multi` object represents the address and port that will be used by the multi-cast client when listening for multi-cast UDP packets.

### Firebase Configuration

This application utilizes a total of three configuration files - 

* `firebase-rest-config.js` - 
    * `_firebase-config.js` (*see* `example_firebase-config.js`)
    * `_firebase-paths.js` (*see* `example_firebase-paths.js`)
    





# Future Development

## Databases

In order to avoid the monetary costs of using Firebase alternative solutions are required. I'll need to see if any can fulfill these requriements - 

* Limiting the quantity of records automatically, Firebase accomplishes this with *Firebase Functions*.
* Notifying the clients when a new record has been created (or updated?). On the *client* side this is easily done. 

### MySQL

I will be investigating the use of MySQL and *triggers* to accomplish what's been described above.

However the implementation may require the use of an `npm` package or two. At that point this application may no longer be suitable for *thin clients*.

### MongoDB

Not sure if what I need is possible here. Further investigation is necessary.





