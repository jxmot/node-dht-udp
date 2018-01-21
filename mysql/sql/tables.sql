create database sensornet;

/*
1484956740000 = Friday, January 20, 2017 5:59:00 PM GMT-06:00

1516492740000 = Saturday, January 20, 2018 5:59:00 PM GMT-06:00

Where a is the smallest number and b is the largest number
SELECT RAND()*(b-a)+a;


SELECT FLOOR(RAND()*(1516492740000-1484956740000)+1484956740000);

SELECT FLOOR(RAND()*(1516492740-1484956740)+1484956740);

 1 day  =   86400000

 5 days =  432000000

10 days =  864000000

14 days = 1209600000

30 days = 2592000000

60 days = 5184000000

90 days = 7776000000

*/

create table sensornet.status (
    dev_id varchar(64) not null,
    status varchar(16) not null,
    msg varchar(64),
    tstamp bigint(16) not null, primary key (tstamp) 
);

insert into sensornet.status 
(dev_id,status,tstamp)
values ("ESP_49EB40", "APP_READY", FLOOR(RAND()*(1516492740000-1484956740000)+1484956740000));

DELETE FROM sensornet.status where tstamp < (1516492740000 - 7776000000);



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


