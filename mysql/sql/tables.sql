/*
    A collection of convienient SQL statements :

        * database create
        * table creation
        * test data insertions & deletions
*/

create database sensornet;

/*
    The 'tstamp' column is used as the primary key. This means that it
    can be used for - 

        * Selecting a range of rows from the table
        * Deleting(purge) a range of rows from the table

    For example, 'tstamp' contents could appear as - 

        1484956740000 = Friday, January 20, 2017 5:59:00 PM GMT-06:00
        
        1516492740000 = Saturday, January 20, 2018 5:59:00 PM GMT-06:00

    Examples of time durations (in millseconds) -

         1 day  =   86400000
        
         5 days =  432000000
        
        10 days =  864000000
        
        14 days = 1209600000
        
        30 days = 2592000000
        
        60 days = 5184000000
        
        90 days = 7776000000
*/

/*
    Sensor Status Table
*/
create table sensornet.status (
    dev_id varchar(64) not null,
    status varchar(16) not null,
    msg varchar(64),
    tstamp bigint(16) not null, primary key (tstamp) 
);

/*
    Using a timestamp as the primary key...

    To see how this works, experiment with the following SQL statements :

        SELECT FLOOR(RAND()*(1516492740000-1484956740000)+1484956740000);
        SELECT FLOOR(RAND()*(1516492740-1484956740)+1484956740);

    Where a is the smallest number and b is the largest number - 

        SELECT RAND()*(b-a)+a;


    Here's a MySQL example that creates a random value that is between
    today's epoch and an epoch one year ago.

    The value 31471200000 represents one year (364.25 days) in milliseconds.

*/
select FLOOR(RAND()*((unix_timestamp(now()) * 1000)-((unix_timestamp(now()) * 1000) - 31471200000))+((unix_timestamp(now()) * 1000) - 31471200000));

/*
    Sensor Status Table
*/
insert into sensornet.status 
(dev_id,status,tstamp)
values ("ESP_49EB40", "APP_READY", FLOOR(RAND()*(1516492740000-1484956740000)+1484956740000));

/*
    this will delete a range of rows where their timestamp is less than a
    start date/time minus a duration of time
*/
DELETE FROM sensornet.status where tstamp < (1516492740000 - 7776000000);

/*
    Sensor Data Table
*/
create table sensornet.data (
    dev_id varchar(64) not null,
    seq int(6) not null,
    t decimal(5,2) not null,
    h decimal(5,2) not null,
    tstamp bigint(16) not null, primary key (tstamp) 
);

insert into sensornet.data 
(dev_id,seq,t,h,tstamp)
values ("ESP_49EB40", 1, 65.4, 16.8, FLOOR(RAND()*(1516492740000-1484956740000)+1484956740000));

DELETE FROM sensornet.data where tstamp < (1516492740000 - 7776000000);

/*
    Sensor configuration table - the primary use is to provide
    high/low limits. When a limit is met or exceeded a configured
    notification will be generated.

    This would also be the table where other sensor coniguration
    items are stored. This table will "evolve" over time and is
    likely to change.

    To Do: 

        #1 - 
            * Sensor Config Items :
                * Physical sensor read interval
                * Error reporting interval
                * Scale (F or C)
                    * at this time it indicates the scale of the
                    limit values.
                * Report type (CHG or ALL)
                * Temperature change threshhold (delta_t)
                * Humidity change threshhold (delta_h)
    
            Those changes would also require the implementation of 
            methods for sending config data to the sensors.

        #2 - 
            * Use the `loc` column to label gauges in the client

*/
create table sensornet.config (
    dev_id varchar(64) not null, primary key (dev_id),
    loc varchar(64) not null,
    t_scale varchar(2) not null,
    t_high decimal(5,2) not null,
    t_low decimal(5,2) not null,
    h_high decimal(5,2) not null,
    h_low decimal(5,2) not null
);

insert into sensornet.config 
(dev_id,loc,t_scale,t_high,t_low,h_high,h_low)
values 
("ESP_49EC8B", "Office", "F", 95, 40, 50, 10),
("ESP_49F542", "Den", "F", 95, 40, 50, 10),
("ESP_49EB40", "MBR", "F", 95, 40, 50, 10),
("ESP_49ECCD", "LR", "F", 95, 40, 50, 10);


/*
    store a handful of test records with random timestamps

    see - storedproc-sensordata_fill.sql
*/
call sensordata_fill;

/*
    either one of these will delete the test records
*/
DELETE FROM sensornet.data where t = 99.40;
DELETE FROM sensornet.data where seq = 0;


