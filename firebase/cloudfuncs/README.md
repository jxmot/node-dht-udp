# Firebase Cloud Functions

This portion of the repository contains *Firebase Cloud Functions* that are used for limiting the amount of data kept in the sensor data and status tables.

This limiting is necessary because of the amount of data that can be written. If the amount of data wasn't limited it could quickly become unmanageable and would require period *manual* removal of old data. Since the NodeJS portion of the project uses the *Firebase REST API* it doesn't have the capabilities it would otherwise have to limit the amount of stored data. Refer to the README in the repository's folder for additional information regarding its use of the *Firebase REST API*.

## Requirements

Before *Firebase Cloud Functions* can be used you have to configure your project - 

* Enable billing.
* Change the pricing plan. If you were on the free *Spark* plan you will need to change it. The *Blaze* plan is a "pay as you go" plan. And at the time this project was created Google offered a $300usd credit. I have not tried the *Flame* plan and I do not know if one or the other is more economical *at this time*.
* Install the *Firebase CLI*. See [Get Started: Write and Deploy Your First Functions](<https://firebase.google.com/docs/functions/get-started>) for instructions.

## Deployment

Use the following steps with the code provided here - 

* Edit `.firebaserc` to reflect your project ID.
* From within the `functions` folder run `npm install`.
* Go to your database and **remove** all current data. If any data is left behind errors will occur and the functions will not run.
* Run this command - `firebase deploy --only functions`, you should see the following output - 

```
=== Deploying to 'PROJECT_ID_GOES_HERE'...

i  deploying functions
i  functions: ensuring necessary APIs are enabled...
+  functions: all necessary APIs are enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (1.39 KB) for uploading
+  functions: functions folder uploaded successfully
i  functions: creating function limitStatus...
i  functions: updating function limitData...
+  functions[limitData]: Successful update operation.
+  functions[limitStatus]: Successful create operation.

+  Deploy complete!
```

## Additional Notes

The current limited counts are configred in `index.js` - 

```javascript
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
```

In order to see the code operate you can temporarily reduce those limits. A value of **5** is a good place to start.

**NOTE**: Occasionally the deployment may fail. If this occurs check your code and support files to insure that they are correct. Then try the deployment again. I've seen occurrences where a deployment will fail, and an subsequent attempt is successful.

### Removing All Records

As the database increases in size the Firebase Console will prohibit any attempts to remove or even add records. The easiest solution to remove all records is to import the `erase_all.json` file. The file's only contents are `{}`.


