DROP PROCEDURE IF EXISTS BetReverse;

DELIMITER $$
CREATE PROCEDURE BetReverse(
    IN betId INTEGER(10))
proc: BEGIN
    
    DECLARE userId VARCHAR(100);
    DECLARE betCount INTEGER DEFAULT 0;
    DECLARE betAmount INTEGER DEFAULT 0;
    DECLARE userAmount INTEGER DEFAULT 0;
    
    SELECT COUNT(*) INTO betCount FROM `bet` b WHERE b.`id` = betId;
    IF betCount = 0 THEN
        LEAVE proc;
    END IF;
    
    SELECT b.`user`, b.`betAmount` INTO userId, betAmount FROM `bet` b WHERE b.`id` = betId;
    
    SELECT u.balance INTO userAmount FROM `user` u WHERE u.`id` = userId;
    
    DELETE FROM `bet` WHERE `id` = betId;
    
    INSERT INTO `transaction` (`from`, `to`, `type`, `amount`, `balanceFrom`, `balanceTo`) VALUES ('IPL', userId, 'BET REVERSAL', betAmount, 0, userAmount+betAmount);
    
    UPDATE `user` SET `balance` = `balance` + betAmount;

END$$
DELIMITER ;