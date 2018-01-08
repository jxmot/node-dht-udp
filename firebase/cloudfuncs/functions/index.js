'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Limit the quantity of records - 
//  5760 = 4 sensors X (24hrs X 60min/hour)
// This should limit the data to the previous 24hrs, if 
// the reporting interval is increased then more time will
// be included in the data.
const MAX_SENSORDATA_COUNT = 5760;
//  Status message do not occur at the same rate as sensor
//  data. And a small number (< 100) should be sufficient
//  for most historic requirements.
const MAX_SENSORSTATUS_COUNT = 50;

// limit sensor data
exports.limitData = functions.database.ref('/sensorlog/data/{pushId}').onWrite(event => {
    const parentRef = event.data.ref.parent;
    return parentRef.once('value').then(snapshot => {
        if(snapshot.numChildren() >= MAX_SENSORDATA_COUNT) {
            let childCount = 0;
            const updates = {};
            snapshot.forEach(function(child) {
                if(++childCount <= snapshot.numChildren() - MAX_SENSORDATA_COUNT) updates[child.key] = null;
            });
            return parentRef.update(updates);
        }
    });
});

// limit sensor statuses
exports.limitStatus = functions.database.ref('/sensorlog/status/{pushId}').onWrite(event => {
    const parentRef = event.data.ref.parent;
    return parentRef.once('value').then(snapshot => {
        if(snapshot.numChildren() >= MAX_SENSORSTATUS_COUNT) {
            let childCount = 0;
            const updates = {};
            snapshot.forEach(function(child) {
                if(++childCount <= snapshot.numChildren() - MAX_SENSORSTATUS_COUNT) updates[child.key] = null;
            });
            return parentRef.update(updates);
        }
    });
});
