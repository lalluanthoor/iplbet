DROP PROCEDURE IF EXISTS BetPlace;

DELIMITER $$
CREATE PROCEDURE BetPlace(
    IN userId VARCHAR(100),
    IN potId INTEGER(4),
    IN betOn VARCHAR(100),
    IN betAmount BIGINT)
proc: BEGIN
    
    DECLARE userAmount BIGINT;
    DECLARE matchId INTEGER(3);
    DECLARE isTeamLevel TINYINT;
    DECLARE betTeam VARCHAR(100);
    DECLARE homeTeam VARCHAR(5);
    DECLARE awayTeam VARCHAR(5);
    DECLARE multiplier INTEGER(3);
    DECLARE multiplierHome INTEGER(3);
    DECLARE multiplierAway INTEGER(3);
    DECLARE potCount INTEGER DEFAULT 0;
    
    SELECT COUNT(*) INTO potCount FROM `pot` p WHERE p.`id` = potId;
    
    IF potCount = 0 THEN
        LEAVE proc;
    END IF;
    
    SELECT `isTeamLevel`, `match`, `multiplierHome`, `multiplierAway` INTO isTeamLevel, matchId, multiplierHome, multiplierAway FROM `pot` p WHERE p.`id` = potId;
    
    IF matchId IS NOT NULL THEN
        SELECT m.`homeTeam`, m.`awayTeam` INTO homeTeam, awayTeam FROM `match` m WHERE m.`id` = matchId;
    END IF;
    
    IF isTeamLevel = 0 THEN
        IF matchId IS NOT NULL THEN
            SELECT p.`team` INTO betTeam FROM `player` p WHERE p.`team` IN (homeTeam, awayTeam) AND p.`name` = betOn;
        ELSE
            SELECT p.`team` INTO betTeam FROM `player` p WHERE p.`name` = betOn;
        END IF;
    ELSE
        SELECT t.`id` INTO betTeam FROM `team` t WHERE t.`name` = betOn;
        IF matchId IS NOT NULL THEN
            IF betTeam = homeTeam THEN
                SET multiplier = multiplierHome;
            ELSE
                SET multiplier = multiplierAway;
            END IF;
        ELSE
            SET multiplier = multiplierHome;
        END IF;
    END IF;
    
    SELECT `balance` INTO userAmount FROM `user` WHERE `id` = userId;
    
    IF userAmount < betAmount THEN
        LEAVE proc;
    END IF;
    
    INSERT INTO `bet` (`pot`, `user`, `betOn`, `betTeam`, `betAmount`, `multiplier`) VALUES (potId, userId, betOn, betTeam, betAmount, multiplier);
    
    UPDATE `user` SET `balance` = `balance` - betAmount WHERE `suspended` = 0 AND `id` = userId;
    
    INSERT INTO `transaction` (`from`, `to`, `type`, `amount`, `balanceFrom`, `balanceTo`) VALUES (userId, 'IPL', 'BET', betAmount, userAmount-betAmount, 0);

END$$
DELIMITER ;