/* ********************************************** */
// Load canned data
//
// collate the data
for(var ix = 0;ix < sensordata.length; ix++) {
    colldata[sensordata[ix].dev_id].push(sensordata[ix]);
}

// proof that it worked
console.log(colldata['ESP_49ECCD'].length);
console.log(colldata['ESP_49F542'].length);
console.log(colldata['ESP_49EC8B'].length);
console.log(colldata['ESP_49EB40'].length);

// transfer some data from the collation into the 
// chart series data
var device = histchart_cfg.title.text = 'ESP_49ECCD';

for(ix = 0; ix < colldata[device].length; ix++) {
    var arr = [colldata[device][ix].tstamp, colldata[device][ix].t];
    temps.push(arr);

    arr = [colldata[device][ix].tstamp, colldata[device][ix].h];
    humid.push(arr);
}
/* ********************************************** */
/* ********************************************** */

// create & render the chart using the data series
var chart = new ApexCharts(document.querySelector('#chart'), histchart_cfg);
chart.render();

// incoming history data...
$(document).on('hist_show', function(e, data) {
    var tmp = JSON.parse(data);
    consolelog('hist_show - records = '+tmp.length);
    // 
    // hide chart 
    // "please wait..." ?
    // 
    // erase current series
    // 
    // 
    // if data is a SINGLE sensor then
    //      load T and H into series
    //      show T and H 
    // else 
    //      collate new t & h data
    //      load all sensor T only into series
    // 
    // update all chart labels and axis config (single vs mult sensors)
    // render chart
    // show chart
});

var choices = {
    dursel: '',
    dev_id: []
};

$(document).ready(function() {

    // adjust the text color
    adaptColor('#titlehist', '.panel-success>.panel-heading');
    // adjust the text color
    adaptColor('#gethist');
    // disable the button because no sensors have been selected yet
    $('#gethist').prop("disabled",true);

   // set up the button handler
   $('#gethist').on('click', function() {
        consolelog('#gethist - '+JSON.stringify(choices));
        // {dursel: '24', dev_id:['ESP_49EC8B','ESP_AAAAAA',ESP_BBBBBB'}
        $(document).trigger('hist_request', choices);
    });

    // iterate through all of the sensor selection checkboxes
    // and add an onclick handler to each of them.
    var sensors = document.getElementsByName('histsel_ctrl')
    var senscount = 0;
    sensors.forEach(function(sens) {
//        consolelog(sens);
        sens.onclick = function() {
            consolelog(this.value+'  '+this.checked);
            // manage the color with a css class when the checkbox 
            // has changed to either state
            if(this.checked === true) {
                this.parentElement.classList = 'use-pointer sensor-selected';
                senscount += 1;
                // ADD this sensor to the choices.dev_id[] array
                choices.dev_id.push(this.value);
            } else {
                this.parentElement.classList = 'use-pointer';
                senscount -= 1;
                // REMOVE this sensor from the choices.dev_id[] array
                sensrmv = this.value;
                choices.dev_id = choices.dev_id.filter(function(sens) {
                    var ret = (sens !== sensrmv);
                    return ret;
                });

            }
            // a count of selected sensors determines if the 
            // "get history" button is enabled or not
            if(senscount === 0) $('#gethist').prop('disabled',true);
            else {
                $('#gethist').prop('disabled',false);
                adaptColor('#gethist');
            }
        };
    });
    // iterate through the duration selections and set 
    // one as "picked" if it has been set as the default
    var durats = document.getElementsByName('dursel_ctrl');
    durats.forEach(function(durs) {
//        consolelog(durs);
        // if this is the default choice then pre-select it
        if(durs.dataset.default === 'true') {
            durs.checked = true;
            durs.parentElement.classList = 'use-pointer time-selected';
            choices.dursel = durs.value;
        }
        durs.onclick = function() {
            consolelog(this.value+'  '+this.checked);
            // remove color class
            document.getElementsByName('dursel_ctrl').forEach(function(d){d.parentElement.classList = 'use-pointer';});
            // add the color class. 
            this.parentElement.classList = 'use-pointer time-selected';
            // save the selection
            choices.dursel = this.value;
        };
    });
    // let the app know we're ready for incoming sensor data
    $(document).trigger('hist_ready', true);
    $('#history-panel').show();
});

