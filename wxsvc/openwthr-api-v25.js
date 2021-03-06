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
            getCurrent(wcfg.location);
            setInterval(getCurrent, wcfg.config.updintvl, wcfg.location);

            getForecast(wcfg.location);
            setInterval(getForecast, wcfg.config.forintvl, wcfg.location);
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

        upd.format = 'owm-v25';

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

        // sunrise & sunset times
        d = new Date(0);
        d.setUTCSeconds(raw.sys.sunrise);
        upd.sr  = d.getTime();
        
        d = new Date(0);
        d.setUTCSeconds(raw.sys.sunset);
        upd.ss  = d.getTime();

        // date/time of when data was collected
        upd.tstamp = Date.now();

        upd.t    = raw.main.temp;
        upd.h    = raw.main.humidity;

// http://math.info/Misc/Heat_Index/
//        upd.hix  = ???;

        upd.wd   = raw.wind.deg;
        upd.ws   = raw.wind.speed;
// Wind Chill = 35.74 + (0.6215 * Temp) – (35.75 * (Speed^0.16)) + (0.4275* Temp * (Speed^0.16))
// Temp - in F
// Speed - wind MPH
//        upd.wch  = ???;
        upd.tmax = raw.main.temp_max;
        upd.tmin = raw.main.temp_min;

        upd.desc = raw.weather[0].description;
        upd.main = raw.weather[0].main;
        upd.icon = wcfg.service.iconurl + raw.weather[0].icon +'.png';

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

        fcast.format = 'owm-v25';

        // the data provider
        fcast.svc = wcfg.service.name;
        // url for retrieving icons
        fcast.iconurl = wcfg.service.iconurl;
        // station code & named location
        fcast.sta = origin.sta;
        fcast.plc = origin.plc;
/*
    forecast timeslots in UTC for a single day are - 
    00:00 
    03:00
    06:00
    09:00
    12:00
    15:00
    18:00
    21:00
    
    first forecast in array should be the next timeslot, for
    example : if the current time is 14:21 the first timeslot
    in the list array will/should be 15:00
    
    there can be up to 40 timeslots : 
         5 days(24hr periods) X 8 slots/day(3hr slots)
    
    the number of timeslots can vary, it depends on what the
    current timeslot is when the data was requested
    
    the virtual index(currently not used) will be a value from
    0 to 7. it indicates where to place the real-index of 0. use 
    it as an offset to the real-index.
    virtual timeslot index = round((epoch_now - epoch_last_midnght) / (3 * 3600))
    
    stopix = 3(24hr periods) X 8(timeslots)
    for(fcix = 0; fcix < stopix; fcix++)
    
    NOTE : openwm time in forecast is UTC!
    let d = new Date(0);
    d.setUTCSeconds(data.list[fcix].dt);
    fcast.gmt = d.getTime();

        fcast = {
            sta: ,
            plc: ,
            svc: ,
            cnt: ,
            per: [],
            tstamp: 
        }

        per = {
            slot: , // currently unused
            dt: ,
            icon: ,
            t: ,
            h: ,
            tmin: ,
            tmax: ,
            ws: ,
            wd: ,
            main: ,
            desc: 
        }
*/
        // date/time of when data was collected
        fcast.gmt = fcast.tstamp = Date.now();

        // qty of time slots  cnt = 3(24hr periods) X 8(timeslots)
        fcast.cnt = 24;

        fcast.per = [];

        for(let ix = 0;ix < fcast.cnt; ix++) {
            // date/time of forecast
            // NOTE : openwm time in forecast is UTC!
            let d = new Date(0);
            d.setUTCSeconds(raw.list[ix].dt);
            per.dt   = d.getTime();
            per.icon = wcfg.service.iconurl + raw.list[ix].weather[0].icon +'.png';
            per.t    = raw.list[ix].main.temp;
            per.h    = raw.list[ix].main.humidity;
            per.tmin = raw.list[ix].main.temp_min;
            per.tmax = raw.list[ix].main.temp_max;
            per.ws   = raw.list[ix].wind.speed;
            per.wd   = raw.list[ix].wind.deg;
            // weather[] can have more than just one 
            // entry. not sure yet how to combine them 
            // into usable data because the docs don't 
            // have enough info and the occurrence is rare.
            per.main = raw.list[ix].weather[0].main;
            per.desc = raw.list[ix].weather[0].description;

            fcast.per.push(JSON.parse(JSON.stringify(per)));
            per = {};
        }
        // break the reference and notify...
        wxsvc.forecast = JSON.parse(JSON.stringify(fcast));
        sys_evts.emit('WSVC_FORCST', wxsvc.forecast);
    };

    return wxsvc;
})();
