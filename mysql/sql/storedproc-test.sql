CREATE DEFINER=`root`@`localhost` PROCEDURE `proc_loop_test`()
BEGIN
  DECLARE int_val INT DEFAULT 0;
  test_loop : LOOP
    IF (int_val = 50) THEN
      LEAVE test_loop;
    END IF;

	insert into sensornet.data 
	(dev_id,seq,t,h,tstamp)
	values ("ESP_49EB40", 0, 99.9, 99.9, FLOOR(RAND()*(1516492740000-1484956740000)+1484956740000));

    SET int_val = int_val +1;
  END LOOP; 
END

