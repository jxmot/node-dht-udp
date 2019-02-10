# Alexa Skill API

This application will respond to HTTP requests from an Alexa Skill. 

## Overview



## Endpoints

## Modify for Use

## Notes

### Node.JS File System

### 

## Application Requirements

* Must obtain necessary data with very little impact on the `node-dht-udp` application
* Must verify that requestor is valid. The requestor must supply a valid ID within the query that it sends.
* Will not access the MySQL database to obtain the necessary data. Instead it will "watch" a JSON formatted text file for changes. The `node-dht-udp` application will write to the file when ever data is updated. This is the same data block used in resending to new clients when they connect.
* Most aspects of this application will be configurable:
    * Address & port to listen on
    * Device<->Path table
    * Data file : path + name + extension
    * Unique requestor ID(s)
* Data request paths handled:
    * Request all sensors
    * Request a specific sensor
    * Request weather data (if stored in JSON file), must consider: 
        * Service format
        * Forecast data period for a format
        * Observation data for a format
* Will not handle any "commands", this application will only provide data
* 