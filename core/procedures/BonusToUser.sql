DROP PROCEDURE IF EXISTS BonusToUser;

DELIMITER $$
CREATE PROCEDURE BonusToUser(
    IN userId VARCHAR(100),
    IN bonusAmt BIGINT
)
proc: BEGIN
    
    DECLARE userBalance BIGINT;
    
    UPDATE `user` u SET u.`balance` = u.`balance` + bonusAmt WHERE u.`suspended` = 0 AND u.`id` = userId;
    
    SELECT u.`balance` INTO userBalance FROM `user` u WHERE u.`id` = userId;
    
    INSERT INTO `transaction` (`from`, `to`, `type`, `amount`, `balanceFrom`, `balanceTo`) VALUES ('IPL', userId, 'BONUS', bonusAmt, 0, userBalance);

    SELECT u.`name` FROM `user` u WHERE u.`id` = userId;

END$$
DELIMITER ;