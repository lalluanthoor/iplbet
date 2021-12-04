DROP PROCEDURE IF EXISTS UpdatePot;

DELIMITER $$
CREATE PROCEDURE UpdatePot(
    IN potId INTEGER(10),
    IN multiplier INTEGER(3),
    IN transactionTime DATETIME)
proc: BEGIN
    
    DECLARE betId INTEGER DEFAULT 0;
    DECLARE userId VARCHAR(100);
    DECLARE finished INTEGER DEFAULT 0;
    DECLARE existingMultiplier INTEGER DEFAULT 1;
    DECLARE userBetAmount, userWinAmount, userNewWinAmount, userBalance BIGINT;
    
    DECLARE userCursor CURSOR FOR SELECT b.`id` AS betId, b.`user` AS userId, b.`betAmount` AS betAmount, b.`winAmount` AS winAmount, b.`multiplier` AS multiplier FROM `bet` b WHERE b.`winner` = 1 AND b.`pot` = potId;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;
    
    SET finished = 0;
    
    OPEN userCursor;
        update_user: LOOP
        FETCH userCursor INTO betId, userId, userBetAmount, userWinAmount, existingMultiplier;
        IF finished = 1 THEN
            LEAVE update_user;
        END IF;
        
        SET userNewWinAmount = (((userWinAmount - userBetAmount)/existingMultiplier*multiplier) + userBetAmount);
        
        UPDATE `bet` SET `multiplier` = multiplier, `winAmount` = userNewWinAmount WHERE `id` = betId;
        
        UPDATE `transaction` SET `balanceTo` = (`balanceTo` - userWinAmount + userNewWinAmount), `amount` = userNewWinAmount WHERE `to` = userId AND `type` = 'RESULT' AND `time` = transactionTime;
        
        UPDATE `user` u SET u.`balance` = u.`balance` - userWinAmount + userNewWinAmount WHERE u.`id` = userId;
        END LOOP update_user;
    CLOSE userCursor;

END$$
DELIMITER ;