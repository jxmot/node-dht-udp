create database sensornet;

create table sensornet.status (
    dev_id varchar(64) not null,
    status varchar(16) not null,
    msg varchar(64),
    tstamp bigint(16) not null
);

create table sensornet.data (
    dev_id varchar(64) not null,
    seq int(6) not null,
    t decimal(5,2) not null,
    h decimal(5,2) not null,
    tstamp bigint(16) not null
);

insert into sensornet.status 
(dev_id,status,tstamp)
values ("ESP_49EB40", "APP_READY", 1516391157307);

insert into sensornet.status 
(dev_id,status,tstamp)
values ("ESP_49EC8B", "APP_READY", 1516401587046);

insert into sensornet.data 
(dev_id,seq,t,h,tstamp)
values ("ESP_49EB40", 1, 65.4, 16.8, 1516391347307);

insert into sensornet.data 
(dev_id,seq,t,h,tstamp)
values ("ESP_49EB40", 2, 65.4, 16.8, 1516394542293);

insert into sensornet.data 
(dev_id,seq,t,h,tstamp)
values ("ESP_49EB40", 2, 65.4, 16.8, now());

