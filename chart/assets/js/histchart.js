

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
    $('#gethist').prop("disabled",true);


    var sensors = document.getElementsByName('histsel_ctrl')
    var senscount = 0;
    sensors.forEach(function(sens) {
        consolelog(sens);
        sens.onclick = function() {
            consolelog(this.value+'  '+this.checked);
            if(this.checked === true) {
                this.parentElement.classList = 'use-pointer sensor-selected';
                senscount += 1;
            } else {
                this.parentElement.classList = 'use-pointer';
                senscount -= 1;
            }
            if(senscount === 0) $('#gethist').prop("disabled",true);
            else $('#gethist').prop("disabled",false);
        };
    });

    var durats = document.getElementsByName('dursel_ctrl');
    durats.forEach(function(durs) {
        consolelog(durs);
        if(durs.dataset.default === 'true') {
            durs.checked = true;
            durs.parentElement.classList = 'use-pointer time-selected';
        }
        durs.onclick = function() {
            consolelog(this.value+'  '+this.checked);
            // remove color class
            document.getElementsByName('dursel_ctrl').forEach(function(d){d.parentElement.classList = 'use-pointer';});
            // add the color class. 
            this.parentElement.classList = 'use-pointer time-selected';
        };
    });
});

