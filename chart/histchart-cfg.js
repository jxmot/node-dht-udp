/*
    SensorNet History Chart Configuration

    Requried for use with Apex Charts

    home: https://apexcharts.com/
    docs: https://apexcharts.com/docs/chart-types/line-chart/

    NOTE: Apex(free) is a subsidiary of Fusion Charts($$paid!!), 
    researched a number of other chart packages and either they
    were too expensive or lacked these needed features:
        * Dual and independant Y-axis <-- MUST HAVE!
        * Documented (Apex docs are just "OK", they have a lot
          of info. it's not complete)
        * Can be used a "live" data chart. So far this seems to 
          be the easiest to force new behavior. <-- MUST HAVE!
*/
// https://caniuse.com/es6-module-dynamic-import
//import {sensordata} from './sensornet_data-trim.js';

// collate the data
for(var ix = 0;ix < sensordata.length; ix++) {
    colldata[sensordata[ix].dev_id].push(sensordata[ix]);
}

// proof that it worked
console.log(colldata["ESP_49ECCD"].length);
console.log(colldata["ESP_49F542"].length);
console.log(colldata["ESP_49EC8B"].length);
console.log(colldata["ESP_49EB40"].length);

// contains the data series
var temps = [];
var humid = [];

for(ix = 0; ix < colldata["ESP_49EC8B"].length; ix++) {
    var arr = [colldata["ESP_49EC8B"][ix].tstamp, colldata["ESP_49EC8B"][ix].t];
    temps.push(arr);

    arr = [colldata["ESP_49EC8B"][ix].tstamp, colldata["ESP_49EC8B"][ix].h];
    humid.push(arr);
}

// chart config
var histchart_cfg = {
    series: [
        {name: '°F', data: temps},
        {name: '%RH', data: humid}
    ],
    theme: {
        mode:'dark'
    },
    stroke: {
        width: 3,
        curve: "smooth"
    },
    chart: {
        type: 'line',
        stacked: false,
        height: 350,
        zoom: {
            type: 'x',
            enabled: true,
            autoScaleYaxis: true
        },
        toolbar: {
            autoSelected: 'zoom',
            tools: { 
                download: false 
            }
        }
    },
    dataLabels: {
        enabled: false
    },
    markers: {
        size: 0,
    },
    title: {
        text: 'ESP_49EC8B',
        align: 'left'
    },
    yaxis: [
        {
            title: {
                text: "Temp °F",
                style: {
                    color: '#4ecdc4'
                }
            },
            labels: {
                style: {
                    colors: ['#4ecdc4'],
                },
                formatter: function (val) {
                    return val.toFixed(0)
                }
            }
        },
        {
            opposite: true,
            title: {
                text: "%RH",
                style: {
                    color: '#c7f464'
                }
            },
            labels: {
                style: {
                    colors: ['#c7f464'],
                },
                formatter: function (val) {
                    return val.toFixed(0)
                }
            }
        }
    ],
    xaxis: {
        type: 'datetime',
        labels: {
            datetimeUTC: false
        }
    },
    tooltip: {
        shared: true,
        y: {
            formatter: function (val) {
                return val.toFixed(2)
            }
        },
        x: {
            formatter: function (val) {
                var dt = new Date(val);
                var tod = dt.getFullYear() + "-" + (dt.getMonth()+1) + "-" + dt.getDate();
                var h = dt.getHours();
                var m = dt.getMinutes();
                var s = dt.getSeconds();
                tod = tod + "<br>"+ (h < 10 ? "0"+h : h) +":"+ (m < 10 ? "0"+m : m) +":"+ (s < 10 ? "0"+s : s);
                return tod;
            }
        }
    }
};

var chart = new ApexCharts(document.querySelector("#chart"), histchart_cfg);
chart.render();
