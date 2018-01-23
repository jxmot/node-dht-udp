# node-dht-udp

This is the server component for the SensorNet project. 

# History

After the development on the [esp8266-dht-udp](<https://github.com/jxmot/esp8266-dht-udp>) project reached the point were a *real* server was necessary the [test code](<https://github.com/jxmot/esp8266-dht-udp/tree/master/src/applib/nodejs>) was used as a starting point for this server.

# Overview

This server has been implemented as a NodeJS application. It is required to listen for UDP packets that contain sensor data from the ESP8266 devices and then forward the data to a database. This particular implementation utilizes Firebase.

It also listens for multi-cast UDP packets. They are used to convey the status of the ESP8266 devices.

# Application Requirements

This NodeJs application must - 

* Be as *thin* as possible. The intended target platform is the **Tessel 2**. However this application can be run on *any* NodeJS installation.
* Utilize a database where clients can be notified *in real time* when new records are written to the database. At this time Firebase is the only solution that offers that feature.
* Acts only as a means to forward data to the database. The sensor devices define the layout and contents of the data records. The only alteration to the data records is the addition of a timestamp.

## Updated Requirements

As detailed below I decided to store the data in an SQL database. This may unfortunately prohibit the application from running on a thin platform. In order to accomplish this - 

* The application may require some extra configuration to run on the thin platform. However it might encounter restrictions that are yet to be determined.
* The SQL database would have to reside on a separate server. The thin platform does not have the resources to run an SQL database.

# Details

This application makes use of the *Firebase REST API*. And it does not require any packages other than the native NodeJS packages.

## Database Candidates

Initially I decided to use one of two potential candidates for a database to store sensor data and status. My first choice was Firebase due to a number of its features - 

* JSON data can used directly when writing data to a node.
* The client side can receive notifications when new data has been saved.

### Firebase Requirements

In order to run for more than a relatively short period of time it is necessary to use some means to limit the amount of accumulated sensor data and status records. The method used here are *Firebase Cloud Functions*. For details please review this [README](<https://github.com/jxmot/node-dht-udp/blob/master/firebase/cloudfuncs/README.md>).

### MySQL Requirements

The same requirement exists for MySQL. A way to limit the quantity of data is required. Initially I had investigated the use of *trigger functions* as a way to run some SQL to delete specific rows. However trigger functions are not allowed to alter the contents of a table.

The solution I used was to - 

* Utilize a *timestamp* as the primary key.
* Implement a *long interval* timer under NodeJS
    * When the timer expires it will delete a *range* of rows specified in a `where` clause by a timestamp value.
    
Details regarding this can be found in the [MySQL README]() in this repository.

## Running the Application

Depending upon which database type (*Firebase or MySQL*) is used determines a few things - 

**Firebase**
    * It is not necessary to install any NodeJS packages.
    * In order to limit the quantity of saved data *Firebase Cloud Functions* are required.
        * This requires a billing account and will incur some monetary costs.
    
**MySQL**
    * It will be necessary to install some external NodeJS packages : `npm install`
    * The current web client will require some modifications.
    
To choose between Firebase and MySQL open the `/servercfg.js` file and edit it to read as - 

```javascript
    db : {
        type : 'mysql'
    }
```

Or -

```javascript
    db : {
        type : 'firebase'
    }
```

Run the application with - `node server.js`.

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
    },
    
    db : {
        type : 'mysql'
    }
};
```

The `server` object represents the IP address and port on which the server will listen for *sensor data*. The use of `host : '0.0.0.0'` indicates that all network interfaces are to be used. If you need to listen on a specific interface then replace `0.0.0.0` with the IP address of that interface.

The `multi` object represents the address and port that will be used by the multi-cast client when listening for multi-cast UDP packets.

The `db` object is described above.

### Firebase Configuration

This application utilizes a total of three configuration files - 

* `firebase-rest-config.js` - 
    * `_firebase-config.js` (*see* `example_firebase-config.js`)
    * `_firebase-paths.js` (*see* `example_firebase-paths.js`)
    
### MySQL Configuration

For use of MySQL a single configuration file is used. The file is `_dbcfg.js` (*see* `example_dbcfg.js`) and it contains - 

* A `parms` object used by the `mysql` package.
* Table names and column definitions.
* Data purge (*row deletion*) configuration object.

Details regarding this can be found in the [MySQL README]() in this repository.

# Future Development

## Databases

In order to avoid the monetary costs of using Firebase alternative solutions are required. I'll need to see if any can fulfill these requirements - 

* Limiting the quantity of records automatically, Firebase accomplishes this with *Firebase Functions*.
* Notifying the clients when a new record has been created (or updated?). On the *client* side this is easily done. 

### MySQL

A method utilizing *websockets* will be investigated for communicating current updates to sensor data.

### MongoDB

Not sure if what I need is possible with a Mongo database. Further investigation is necessary, but is not likely to proceed at this time.





