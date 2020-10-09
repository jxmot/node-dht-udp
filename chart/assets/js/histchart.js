

// collate the data
for(var ix = 0;ix < sensordata.length; ix++) {
    colldata[sensordata[ix].dev_id].push(sensordata[ix]);
}

// proof that it worked
console.log(colldata["ESP_49ECCD"].length);
console.log(colldata["ESP_49F542"].length);
console.log(colldata["ESP_49EC8B"].length);
console.log(colldata["ESP_49EB40"].length);

// transfer some data from the collation into the 
// chart series data
for(ix = 0; ix < colldata["ESP_49EC8B"].length; ix++) {
    var arr = [colldata["ESP_49EC8B"][ix].tstamp, colldata["ESP_49EC8B"][ix].t];
    temps.push(arr);

    arr = [colldata["ESP_49EC8B"][ix].tstamp, colldata["ESP_49EC8B"][ix].h];
    humid.push(arr);
}

var chart = new ApexCharts(document.querySelector("#chart"), histchart_cfg);
chart.render();

$(document).on('hist_show', function(data) {
    consolelog('hist_show - '+JSON.stringify(data));
});

// let the app know we're ready for incoming sensor 
// status and data
$(document).trigger('hist_ready', true);

$(document).ready(function() {

   $('#gethist').on('click', function() {
        consolelog('#gethist');
    });

    var sensors = document.getElementsByName('histsel_ctrl')
    
    sensors.forEach(function(sens) {
        consolelog(sens);
        sens.onclick = function() {
            consolelog(this.value+'  '+this.checked);
            if(this.checked === true) this.parentElement.classList = 'use-pointer sensor-selected';
            else this.parentElement.classList = 'use-pointer';
        };
    });

    var durats = document.getElementsByName('dursel_ctrl');
    durats.forEach(function(durs) {
        consolelog(durs);
        durs.onclick = function() {
            consolelog(this.value+'  '+this.checked);

            document.getElementsByName('dursel_ctrl').forEach(function(d){d.parentElement.classList = 'use-pointer';});


            if(this.checked === true) this.parentElement.classList = 'use-pointer time-selected';
            else this.parentElement.classList = 'use-pointer';
        };
    });
  


});

