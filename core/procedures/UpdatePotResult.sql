DROP PROCEDURE IF EXISTS UpdatePotResult;

DELIMITER $$
CREATE PROCEDURE UpdatePotResult(
    IN potId INTEGER(4),
    IN results VARCHAR(20000))
proc: BEGIN
    
    DECLARE potCount INTEGER DEFAULT 0;
    DECLARE betCount INTEGER DEFAULT 0;
    DECLARE winAmount, loseAmount BIGINT DEFAULT 0;
    DECLARE winRatio DOUBLE DEFAULT 0;
    DECLARE userId VARCHAR(100);
    DECLARE teamShortName VARCHAR(5);
    DECLARE userWinAmount, userBalance BIGINT;
    DECLARE finished INTEGER DEFAULT 0;
    
    DECLARE userCursor CURSOR FOR SELECT u.`id` AS id, x.`win` AS winAmount, u.`balance` AS balance FROM `user` u, (SELECT b.`user` AS user, SUM(b.`winAmount`) AS win FROM `bet` b WHERE b.`winner` = 1 AND b.`pot` = potId GROUP BY b.`user`) x WHERE u.`id` = x.`user`;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;
    
    SELECT COUNT(*) INTO potCount FROM `pot` p WHERE p.`id` = potId AND p.`displayName` LIKE '%Winning Team%';
    
    IF potCount > 0 THEN
        SELECT t.`id` INTO teamShortName FROM `team` t WHERE t.`name` = SUBSTRING(results, 2, LENGTH(results)-2);
        UPDATE `match` m, `pot` p SET m.`winner` = teamShortName, m.`wonBy` = '' WHERE m.`id` = p.`match` AND p.`id` = potId;
    END IF;
    
    SELECT COUNT(*) INTO betCount FROM `bet` b WHERE b.`winner` IS NULL AND b.`pot` = potId;
    
    IF betCount = 0 THEN
        LEAVE proc;
    END IF;
    
    IF results = 'NO RESULT' THEN
        SET @query = CONCAT("UPDATE `bet` b SET b.`winner` = 1 WHERE b.`pot` = ", potId);
        PREPARE stmt FROM @query;
        EXECUTE stmt;
        
        SET winRatio = 0;
    ELSE
        SET @query = CONCAT("UPDATE `bet` b SET b.`winner` = 1 WHERE b.`betOn` IN (", results , ") AND b.`pot` = ", potId);
        PREPARE stmt FROM @query;
        EXECUTE stmt;

        SET @query = CONCAT("UPDATE `bet` b SET b.`winner` = 0 WHERE b.`betOn` NOT IN (", results , ") AND b.`pot` = ", potId);
        PREPARE stmt FROM @query;
        EXECUTE stmt;

        SELECT SUM(b.`betAmount`) INTO winAmount FROM `bet` b WHERE b.`winner` = 1 AND b.`pot` = potId;
        SELECT SUM(b.`betAmount`) INTO loseAmount FROM `bet` b WHERE b.`winner` = 0 AND b.`pot` = potId;

        IF loseAmount IS NULL THEN
            SET loseAmount = 0;
        END IF;

        IF winAmount IS NULL OR winAmount = 0 THEN
            SET winRatio = 0;
        ELSE
            SET winRatio = CAST(loseAmount AS DECIMAL(65,2)) / CAST(winAmount AS DECIMAL(65,2));
        END IF;
    END IF;

    UPDATE `bet` b SET b.`winAmount` = ROUND(b.`betAmount` + (winRatio * b.`multiplier` * b.`betAmount`)) WHERE b.`winner` = 1 AND b.`pot` = potId;
    UPDATE `bet` b SET b.`winAmount` = 0 WHERE b.`winner` = 0 AND b.`pot` = potId;

    SET finished = 0;
    
    OPEN userCursor;
        update_user: LOOP
        FETCH userCursor INTO userId, userWinAmount, userBalance;
        IF finished = 1 THEN
            LEAVE update_user;
        END IF;

        UPDATE `user` u SET u.`balance` = u.`balance` + userWinAmount WHERE u.`id` = userId;
        INSERT INTO `transaction` (`from`, `to`, `type`, `amount`, `balanceFrom`, `balanceTo`)
            VALUES ('IPL', userId, 'RESULT', userWinAmount, 0, userBalance + userWinAmount);
        END LOOP update_user;
    CLOSE userCursor;

END$$
DELIMITER ;
