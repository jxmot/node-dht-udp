# node-dht-udp

This is the server component for the SensorNet project. 

# History

After the development on the [esp8266-dht-udp>](<https://github.com/jxmot/esp8266-dht-udp>) reached the point were a *real* server was necesary the [test code](<https://github.com/jxmot/esp8266-dht-udp/tree/master/src/applib/nodejs>) was used as a starting point for this server.

# Overview

This server has been implemented as a NodeJS application. It is required to listen for UDP packets that contain sensor data from the ESP8266 devices and then forward the data to a database. This particular implementation utilizes Firebase.

It also listens for multi-cast UDP packets. They are used to convey the status of the ESP8266 devices.

# Requirements

This NodeJs application must - 

* Be as *thin* as possible. The intended target platform is the **Tessel 2**. However this application can be run on *any* NodeJS installation.
* Utilize a database where clients can be notified *in real time* when new records are written to the database. At this time Firebase is the only solution that offers that feature.
* Acts only as a means to forward data to the database. The sensor devices define the layout and contents of the data records.

