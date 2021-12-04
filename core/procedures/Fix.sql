DROP PROCEDURE IF EXISTS Fix;

DELIMITER $$
CREATE PROCEDURE Fix(
    IN potId INTEGER(4),
    IN transactionTime DATETIME)
proc: BEGIN
    
    DECLARE userId VARCHAR(100);
    DECLARE userAmount, userBalance BIGINT;
    DECLARE finished INTEGER DEFAULT 0;
    DECLARE userCursor CURSOR FOR SELECT `to` AS userId, `amount` AS userAmount, `balanceTo` AS userBalance FROM `transaction` WHERE `from` = 'IPL' AND `type` = 'RESULT' AND `time` = transactionTime;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    SET finished = 0;
    
    OPEN userCursor;
        update_user: LOOP
        FETCH userCursor INTO userId, userAmount, userBalance;
        IF finished = 1 THEN
            LEAVE update_user;
        END IF;
        
        UPDATE `user` SET `balance` = userBalance WHERE `id` = userId;
        UPDATE `bet` SET `winAmount` = userAmount, `multiplier` = 1 WHERE `winner` = 1 AND `user` = userId AND `pot` = potId;
        
        END LOOP update_user;
    CLOSE userCursor;

END$$
DELIMITER ;




/*
DROP TABLE `xyz`;
CALL Fix(130, '2018-05-03 02:31:35');
*/