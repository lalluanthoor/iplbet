DROP PROCEDURE IF EXISTS Transfer;

DELIMITER $$
CREATE PROCEDURE Transfer(
    IN fromUser VARCHAR(100),
    IN toUser VARCHAR(100),
    IN amount BIGINT
)
proc: BEGIN
    
    DECLARE valid TINYINT;
    DECLARE fromBalance, toBalance BIGINT;
    
    SELECT u.`id` = fromUser INTO valid FROM `user` u WHERE u.`id` = fromUser;
    
    IF valid = 0 THEN
        SELECT 'Invalid From User.' AS `error`;
        LEAVE proc;
    END IF;
    
    SELECT u.`id` = toUser INTO valid FROM `user` u WHERE u.`id` = toUser;
    
    IF valid = 0 THEN
        SELECT 'Invalid To User.' AS `error`;
        LEAVE proc;
    END IF;
    
    SELECT amount < u.`balance`, u.`balance` INTO valid, fromBalance FROM `user` u WHERE u.`id` = fromUser;
    
    IF valid = 0 THEN
        SELECT 'User balance is less than transfer amount.' AS `error`;
        LEAVE proc;
    END IF;

    SELECT u.`suspended` = 0, u.`balance` INTO valid, toBalance FROM `user` u WHERE u.`id` = toUser;
    
    IF valid = 0 THEN
        SELECT 'Transfer user cannot be inactive.' AS `error`;
        LEAVE proc;
    END IF;

    UPDATE `user` u SET u.`balance` = u.`balance` - amount WHERE u.`id` = fromUser;
    UPDATE `user` u SET u.`balance` = u.`balance` + amount WHERE u.`id` = toUser;
    INSERT INTO `transaction` (`from`, `to`, `type`, `amount`, `balanceFrom`, `balanceTo`) VALUES (fromUser, toUser, 'TRANSFER', amount, fromBalance - amount, toBalance + amount);

    SELECT u.`name` FROM `user` u WHERE u.`id` = toUser;

END$$
DELIMITER ;