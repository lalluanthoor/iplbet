DROP PROCEDURE IF EXISTS BonusToAll;

DELIMITER $$
CREATE PROCEDURE BonusToAll(
    IN bonusAmt BIGINT
)
proc: BEGIN
    
    DECLARE userId VARCHAR(100);
    DECLARE userBalance BIGINT;
    DECLARE finished INTEGER DEFAULT 0;
    
    DECLARE userCursor CURSOR FOR SELECT u.`id` AS id, u.`balance` AS balance FROM `user` u;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;
    
    OPEN userCursor;
        update_user: LOOP
        FETCH userCursor INTO userId, userBalance;
        IF finished = 1 THEN
        LEAVE update_user;
        END IF;
        
        UPDATE `user` u SET u.`balance` = u.`balance` + bonusAmt WHERE u.`id` = userId AND u.`admin` = 0;
        INSERT INTO `transaction` (`from`, `to`, `type`, `amount`, `balanceFrom`, `balanceTo`)
            VALUES ('IPL', userId, 'BONUS', bonusAmt, 0, userBalance + bonusAmt);
        END LOOP update_user;
    CLOSE userCursor;

END$$
DELIMITER ;