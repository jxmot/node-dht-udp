/*
    Interface to the Open Weather Map API


        https://openweathermap.org/current

        https://openweathermap.org/forecast5


    All APIs : 
        https://openweathermap.org/api

    Icons:
        https://openweathermap.org/weather-conditions
*/
module.exports = (function()  {

    wxsvc = {
        currobsv: {},
        forecast: {}
    };

    const https = require('https');

    let wcfg = require('./data/wxsvc-openwm-cfg.js');

    const UPARTS_PATHBASE = 0;
    const UPARTS_WEATHER  = UPARTS_PATHBASE + 1;
    const UPARTS_FORECAST = UPARTS_WEATHER + 1;
    const UPARTS_LAT      = UPARTS_FORECAST + 1;
    const UPARTS_LON      = UPARTS_LAT + 1;
    const UPARTS_ZIP      = UPARTS_LON + 1;
    const UPARTS_ID       = UPARTS_ZIP + 1;
    const UPARTS_UNITS    = UPARTS_ID + 1;
    const UPARTS_MODE     = UPARTS_UNITS + 1;
    const UPARTS_APPID    = UPARTS_MODE + 1;

    const LOC_LAT         = 0;
    const LOC_LON         = 1;

    let sys_evts = {};

    let log = undefined;

    /*
    */
    wxsvc.init = function(evts, _log = undefined) {
        // will need to send events that will trigger
        // a data transfer to the clients
        sys_evts = evts;

        log = _log;

        sys_evts.on('WSVC_START', () => {
//            getCurrent(wcfg.location);
//            setInterval(getCurrent, wcfg.config.updintvl, wcfg.location);

            getForecast(wcfg.location);
//            setInterval(getForecast, wcfg.config.forintvl, wcfg.location);
        });
    };

    /*
    */
    function getCurrent(location) {

        let path = wcfg.urlparts[UPARTS_PATHBASE] + wcfg.urlparts[UPARTS_WEATHER];
        path = path + wcfg.urlparts[UPARTS_ID] + location.code;
        path = path + wcfg.urlparts[UPARTS_UNITS];
        path = path + wcfg.urlparts[UPARTS_MODE] + wcfg.service.datamode;
        path = path + wcfg.urlparts[UPARTS_APPID];
        path = path + wcfg.service.appid;

        let opt = {
            hostname: wcfg.service.hostname,
            method: 'GET',
            path: path,
            headers: {
                'user-agent':wcfg.useragent
            }
        };

        let req = https.request(opt, res => {
            let data = '';
            let origin = {sta: wcfg.location.zip, plc: wcfg.location.city+', '+wcfg.location.state};

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', function(d) {
                log('getCurrent status code: ' + res.statusCode);
                if(res.statusCode === 200) {
                    parseStationCurrent(data.toString(), origin);
                } else log('getCurrent ERROR from '+wcfg.service.name);
            });
        });

        req.on('error', (err) => {
            log('getCurrent Error: ' + err);
        }); 
    
        // send the request
        req.end();
    };

    /*
    */
    function parseStationCurrent(data, origin) {
        // console.log(data);

        let upd = {};
        let raw = JSON.parse(data);

        upd.svc = wcfg.service.name;
        // url for retrieving icons
        upd.iconurl = wcfg.service.iconurl;

        upd.sta = origin.sta;
        upd.plc = origin.plc;
     
        // date/time of observation
        // NOTE : openwm time in forecast is UTC!
        let d = new Date(0);
        d.setUTCSeconds(raw.dt);
        upd.gmt = d.getTime();

        // date/time of when data was collected
        upd.tstamp = Date.now();

        upd.t    = raw.main.temp;
        upd.h    = raw.main.humidity;
        upd.wd   = raw.wind.deg;
        upd.ws   = raw.wind.speed;
        upd.tmax = raw.main.temp_max;
        upd.tmin = raw.main.temp_min;

        upd.desc = raw.weather[0].description;
        upd.icon = raw.weather[0].icon;
        upd.main = raw.weather[0].main;

        // make a copy without references
        wxsvc.currobsv = JSON.parse(JSON.stringify(upd));

        sys_evts.emit('WSVC_UPDATE', wxsvc.currobsv);
    };

    /*
    */
    function getForecast(loc) {

        let path = wcfg.urlparts[UPARTS_PATHBASE] + wcfg.urlparts[UPARTS_FORECAST];

        path = path + wcfg.urlparts[UPARTS_ID] + wcfg.location.code;
        path = path + wcfg.urlparts[UPARTS_UNITS];
        path = path + wcfg.urlparts[UPARTS_MODE] + wcfg.service.datamode;
        path = path + wcfg.urlparts[UPARTS_APPID];
        path = path + wcfg.service.appid;

        let opt = {
            hostname: wcfg.service.hostname,
            method: 'GET',
            path: path,
            headers: {
                'user-agent':wcfg.useragent
            }
        };

        let req = https.request(opt, res => {
            let data = '';
            let origin = {sta: wcfg.location.zip, plc: wcfg.location.city+', '+wcfg.location.state};

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', function() {
                log('getForecast status code: ' + res.statusCode);
                if(res.statusCode === 200) {
                    parseForecast(data.toString(), origin);
                } else log('getForecast ERROR from OWM');
            });
        });

        req.on('error', (err) => {
            log('getForecast Error: ' + err);
        }); 
    
        // send the request
        req.end();
    };

    /*
    */
    function parseForecast(data, origin) {

        let fcast = {};
        let per = {};

        let raw = JSON.parse(data);

        // the data provider
        fcast.svc = wcfg.service.name;
        // url for retrieving icons
        fcast.iconurl = wcfg.service.iconurl;
        // station code & named location
        fcast.sta = origin.sta;
        fcast.plc = origin.plc;

// forecast timeslots in UTC for a single day are - 
// 00:00 
// 03:00
// 06:00
// 09:00
// 12:00
// 15:00
// 18:00
// 21:00
// 
// first forecast in array should be the next timeslot, for
// example : if the current time is 14:21 the first timeslot
// in the list array will be 16:00
//
// there can be up to 40 timeslots : 
//      5 days(24hr periods) X 8 slots/day(24hr period)
// 
// the number of timeslots can vary, it depends on what the
// current timeslot is when the data was requested
//
// current timeslot index = round((epoch_now - epoch_last_midnght) / (3 * 3600))
//
// stopix = 3(24hr periods) X 8(timeslots)
// for(fcix = 0; fcix < stopix; fcix++)
//
// NOTE : openwm time in forecast is UTC!
// let d = new Date(0);
// d.setUTCSeconds(data.list[fcix].dt);
// fcast.gmt = d.getTime();


        // date/time of forecast
        // NOTE : openwm time in forecast is UTC!
        let d = new Date(0);
        d.setUTCSeconds(raw.list[ix].dt);
        fcast.gmt = d.getTime();

        // date/time of when data was collected
        fcast.tstamp = Date.now();

        let nextslot = 0;
        // end = 3(24hr periods) X 8(timeslots)
        let end = 24;
        fcast.per = [];
        let  cnt = raw.cnt;

// NOTE : JSON wind speed is incorrect, even if the request
// specifies "&units=imperial". XML is also wrong.
//
// If "&units=imperial" in XML - 
//      <windSpeed mps="11.34" name="Strong breeze"></windSpeed>
// then if units is omitted - 
//      <windSpeed mps="5.8" name="Moderate breeze"></windSpeed>
// ERRORS:
//      1) "mps" should become "mph", a better fix is :
//          <wind unit="mps|mph" speed="X.X" name"......"></wind>
//      2) fix documentation
//      3) insure that "name" is identical for all units of measure
//      4) values are not equal for "imperial" vs "default"
//      5) forecast is NOT formatted like current, and it should be
// 

/*
        for(ix = 0;ix <= end; ix++) {
            if(ix === 0) {
                let tmp = raw.properties.periods[ix].name.toLowerCase();
                if(tmp.includes('night')) {
                    nextslot = 1;
                    end -= 1;
                }
                else nextslot = 0;
            }

            per.slot = nextslot;
            per.name = raw.properties.periods[ix].name;
            per.icon = raw.properties.periods[ix].icon;
            per.alt  = raw.properties.periods[ix].shortForecast;
            per.text = raw.properties.periods[ix].detailedForecast;
            fcast.per.push(JSON.parse(JSON.stringify(per)));
            per = {};
            nextslot += 1;
        }
*/
        // break the reference and notify...
        wxsvc.forecast = JSON.parse(JSON.stringify(fcast));
        sys_evts.emit('WSVC_FORCST', wxsvc.forecast);
    };

    return wxsvc;
})();
