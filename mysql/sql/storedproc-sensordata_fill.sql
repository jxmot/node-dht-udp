/*
    This is a "stored procedure". It is used for creating test data
    in the `sensornet.data` table. Which allows for testing of the
    purge functions and any other functionality that depends upon
    a reasonably broad range of data.

    NOTE: To create random values that fall between to specific
          dates use the following :

        FLOOR(RAND()*(1516492740000-1484956740000)+1484956740000)

        Where :
                1516492740000 = GMT: Saturday, January 20, 2018 11:59:00 PM
                1484956740000 = GMT: Friday, January 20, 2017 11:59:00 PM

        A good place to work with dates and epoch values is - 

            https://www.epochconverter.com/

        IMPORTANT! : The epoch timestamp values MUST be in milliseconds!


    The prodcure below will create timestamp values that fall between
    today (when the procedure is run) and one year ago. 

        31471200000 = 1 year in milliseconds
*/
CREATE DEFINER=`root`@`localhost` PROCEDURE `sensordata_fill`()
BEGIN
  DECLARE int_val INT DEFAULT 0;
  data_loop : LOOP
    IF (int_val = 50) THEN
      LEAVE data_loop;
    END IF;

	insert into sensornet.data 
	(dev_id,seq,t,h,tstamp)
	values (
        "ESP_49EB40", 0, 99.9, 99.9, 
        FLOOR(RAND()*((unix_timestamp(now()) * 1000)-((unix_timestamp(now()) * 1000) - 31471200000))+((unix_timestamp(now()) * 1000) - 31471200000))
    );

    SET int_val = int_val +1;
  END LOOP; 
END

