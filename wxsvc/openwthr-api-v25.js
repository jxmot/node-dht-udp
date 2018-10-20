/*
    Open Weather Map Configuration & Helper Functions

    An API for the NOAA's Weather API. See 
        https://openweathermap.org/current
    and
        https://openweathermap.org/forecast5
    for additional information.

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

    // Events
//    const EventEmitter = require('events');
//    const wxsvc_events = new EventEmitter();

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

//    const HEADER_ACCJSON      = 0;
//    const HEADER_ACCXML       = 1;

    const LOC_LAT             = 0;
    const LOC_LON             = 1;

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
            getCurrent(wcfg.location);
//            setInterval(getCurrent, wcfg.config.updintvl, wcfg.location);

//            getForecast(wcfg.location);
//            setInterval(getForecast, wcfg.config.forintvl, wcfg.location);
        });
    };

    /*
    */
    function getCurrent(location) {

        let path = wcfg.urlparts[UPARTS_PATHBASE] + wcfg.urlparts[UPARTS_WEATHER];
//        path = path + wcfg.urlparts[UPARTS_LAT] + location.loc[LOC_LAT];
//        path = path + wcfg.urlparts[UPARTS_LON] + location.loc[LOC_LON];
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

        upd.sta = origin.sta;
        upd.plc = origin.plc;
     
        // date/time of observation
        // NOTE : openwm time in forecast is UTC!
        let d = new Date(0);
        d.setUTCSeconds(raw.dt);
        upd.gmt = d.getTime();

        // date/time of when data was collected
        upd.tstamp = Date.now();

        upd.t   = raw.main.temp;
        upd.h   = raw.main.humidity;
        upd.wd  = raw.wind.deg;
        upd.ws  = raw.wind.speed;
        //upd.wg  = metsToMPH(raw.properties.windGust);
        //upd.wch = centToFar(raw.properties.windChill);
        //upd.txt = raw.properties.textDescription;
        //upd.dew = centToFar(raw.properties.dewpoint);
        //upd.hix = centToFar(raw.properties.heatIndex);

        //upd.bar = paToInchesMerc(raw.main.pressure);

        // make a copy without references
        wxsvc.currobsv = JSON.parse(JSON.stringify(upd));

        sys_evts.emit('WSVC_UPDATE', wxsvc.currobsv);
    };

    /*
    */
    function getForecast(loc) {

        let path = wcfg.urlparts[UPARTS_PATHBASE] + wcfg.urlparts[UPARTS_FORECAST];
//        path = path + wcfg.urlparts[UPARTS_LAT] + loc[LOC_LAT];
//        path = path + wcfg.urlparts[UPARTS_LON] + loc[LOC_LON];
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

            res.on('end', function() {
                log('getForecast status code: ' + res.statusCode);
                if(res.statusCode === 200) {
                    parseForecast(data.toString(), origin);
                } else log('getForecast ERROR from NOAA');
            });
        });

        req.on('error', (err) => {
            log('getForecast Error: ' + err);
        }); 
    
        // send the request
        req.end();
    };

    /*

        | DAY 1 | DAY 2 | DAY 3 |       <- "slots" 0,2,4
        +-------+-------+-------+
        |NIGHT 1|NIGHT 2|NIGHT 3|       <- "slots" 1,3,5


        |       | DAY 2 | DAY 3 |
        +-------+-------+-------+
        |NIGHT 1|NIGHT 2|NIGHT 3|       <- if first period is "night"
                                           then put it in slot 1

        fcast = {
            sta: ,
            plc: ,
            svc: ,
            per: [],
            gmt: ,
            tstamp: 
        }

        per = {
            slot: ,
            name: ,
            icon: ,
            alt: ,
            text: 
        }

    */
    function parseForecast(data, origin) {

        let fcast = {};
        let per = {};

        let raw = JSON.parse(data);

        // the data provider
        fcast.svc = wcfg.service.name;
        // station code & named location
        fcast.sta = origin.sta;
        fcast.plc = origin.plc;


// forecast timeslots  are - 
// 01:00 (22:00 to 01:00)
// 04:00
// 07:00
// 10:00
// 13:00
// 16:00
// 19:00
// 22:00
// 
// first forecast in array will be the next timeslot, for
// example : if the current time is 14:21 the first timeslot
// in the list array will be 16:00
//
// there will be 40 timeslots : 
//      5 days(24hr periods) X 8 slots/day(24hr period)
// 
// current timeslot index = round-up((epoch_now - epoch_last_midnght) / (3 * 3600))
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
        let end = 5;
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

    /*
    function centToFar(rawtemp) {
        var tempRet = -999.999;

        if(rawtemp.value !== null) {
            // http://codes.wmo.int/common/unit
            if(rawtemp.unitCode === 'unit:degC') 
                tempRet = Math.round(rawtemp.value * 9 / 5 + 32);
            else 
                tempRet = Math.round(rawtemp.value);
        }
        return tempRet;
    }
    */

    /*
    function metsToMPH(rawwind) {
        var windRet = -999.999;

        if(rawwind.value !== null) {
            if(rawwind.unitCode === 'unit:m_s-1')
                windRet = Math.round(rawwind.value / 0.44704);
            else
                windRet = Math.round(rawwind.value);
        }
        return windRet;
    };
    */

    /*
    */
    function paToInchesMerc(rawpa) {
        let mercRet = -999.999

        if(rawpa !== null) {
            mercRet = Math.round(rawpa * 0.02952998);
        }
        return mercRet;
    };

    return wxsvc;
})();
