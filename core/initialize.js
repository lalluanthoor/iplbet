/*jslint node:true*/

var util = require('./util');
var mysql = require('./mysql');

var _tables = {
    user:
        "CREATE TABLE IF NOT EXISTS `user` ( `id` VARCHAR(100) PRIMARY KEY, `name` VARCHAR(200), `email` VARCHAR(100), `photoURL` VARCHAR(1000), `admin` TINYINT DEFAULT 0, `suspended` TINYINT DEFAULT 1, `activateCode` VARCHAR(100), `balance` BIGINT DEFAULT 25000 ) ENGINE=InnoDB;",
    team:
        "CREATE TABLE IF NOT EXISTS `team` ( `id` VARCHAR(5) PRIMARY KEY, `name` VARCHAR(100), `positionLastYear` INTEGER(1), `titles` INTEGER(2) DEFAULT 0) ENGINE=InnoDB;",
    player:
        "CREATE TABLE IF NOT EXISTS `player` ( `id` INTEGER(3) PRIMARY KEY AUTO_INCREMENT, `name` VARCHAR(100), `team` VARCHAR(5) REFERENCES `team`(`id`)) ENGINE=InnoDB;",
    match:
        "CREATE TABLE IF NOT EXISTS `match` ( `id` INTEGER(3) PRIMARY KEY AUTO_INCREMENT, `homeTeam` VARCHAR(5) REFERENCES `team`(`id`), `awayTeam` VARCHAR(5) REFERENCES `team`(`id`), `fixture` DATETIME, `winner` VARCHAR(5) REFERENCES `team`(`id`), `wonBy` VARCHAR(15) ) ENGINE=InnoDB;",
    result:
        "CREATE TABLE IF NOT EXISTS `result` ( `id` INTEGER(7) PRIMARY KEY AUTO_INCREMENT, `result` VARCHAR(100), `pot` INTEGER(4) REFERENCES `pot` (`id`) )",
    pot:
        "CREATE TABLE IF NOT EXISTS `pot` ( `id` INTEGER(4) PRIMARY KEY AUTO_INCREMENT, `displayName` VARCHAR(200) NOT NULL, `openTime` DATETIME, `closeTime` DATETIME, `isTeamLevel` TINYINT DEFAULT 0, `multiplierHome` INTEGER(3) DEFAULT 1, `multiplierAway` INTEGER(3) DEFAULT 1, `match` INTEGER(3) DEFAULT NULL REFERENCES `match`(`id`) ) ENGINE=InnoDB;",
    staticPot:
        "CREATE TABLE IF NOT EXISTS `staticPot` ( `id` INTEGER(1) PRIMARY KEY AUTO_INCREMENT, `displayName` VARCHAR(200) NOT NULL ) ENGINE=InnoDB;",
    bet:
        "CREATE TABLE IF NOT EXISTS `bet` ( `id` INTEGER(10) PRIMARY KEY AUTO_INCREMENT, `pot` INTEGER(4) REFERENCES `pot`(`id`), `user` VARCHAR(100) REFERENCES `user`(`id`), `betOn` VARCHAR(100) NOT NULL, `betTeam` VARCHAR(100) NOT NULL, `betTime` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, `betAmount` BIGINT NOT NULL, `winner` TINYINT DEFAULT NULL, `multiplier` INTEGER(3) DEFAULT 1, `winAmount` BIGINT DEFAULT NULL ) ENGINE=InnoDB;",
    transaction:
        "CREATE TABLE IF NOT EXISTS `transaction` ( `id` INTEGER(10) PRIMARY KEY AUTO_INCREMENT, `from` VARCHAR(100), `to` VARCHAR(100), `type` VARCHAR(10), `time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, `amount` BIGINT, `balanceFrom` BIGINT, `balanceTo` BIGINT ) ENGINE=InnoDB;",
    configuration:
        "CREATE TABLE IF NOT EXISTS `configuration` ( `key` VARCHAR(100) PRIMARY KEY, `value` VARCHAR(100) ) ENGINE=InnoDB;"
};

module.exports = function () {
    try {
        var connection = mysql.getConnection();
        var tables = [ "user", "team", "player", "match", "result", "pot", "staticPot", "bet", "transaction", "configuration" ];
        var tasks = [];
        tables.forEach(table => {
            tasks.push(function() {
                var callback = arguments[arguments.length-1];
                connection.query(_tables[table], callback);
            });
        });
        mysql.transaction(tasks, connection, function(error, results) {
            if(error) return console.log("Error while creating tables: " + error);
            else {
                if(results.warningCount === 1) console.log("Tables already created.");
                else console.log("Tables created successfully.");
                return _initializeData();
            }
        });
    } catch(error) {
        console.log("Unknown Error while creating tables: " + error);
        console.log("Error Stack Trace: " + error.stack);
    }
};

function _initializeData() {
    try {
        var teams = require('../core/team');
        var fixtures = require('../core/fixtures');

        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                // Verify if data is already initialized
                connection.query("SELECT `id` FROM `team`", function(error, results) {
                    if(error) return callback(error);
                    else if(results.length > 0) return callback("Data Already Initialized");
                    else return callback(null, results);
                });
            },
            function(results) {
                // Initialize Team Data
                var callback = arguments[arguments.length-1];
                var values = [];
                for(var key in teams) {
                    values.push([ key, teams[key].name, teams[key].positionLastYear, teams[key].titles ]);
                }
                connection.query("INSERT INTO `team` VALUES ?", [values], callback);
            },
            function(results) {
                // Initialize Player Data
                var callback = arguments[arguments.length-1];
                var values = [];
                for(var key in teams) {
                    for(var player of teams[key].players) {
                        values.push([ player, key ]);
                    }
                }
                connection.query("INSERT INTO `player` (`name`, `team`) VALUES ?", [values], callback);
            },
            function(results) {
                // Initialize Matches
                var callback = arguments[arguments.length-1];
                var values = [];
                fixtures.forEach(match => {
                    values.push([ match.home, match.away, util.getIPLDate(match.fixture) ]);
                });
                connection.query("INSERT INTO `match` (`homeTeam`, `awayTeam`, `fixture`) VALUES ?", [values], callback);
            },
            function(results) {
                // Initialize Static Pots
                var callback = arguments[arguments.length-1];
                var values = [
                    ['Man of the Match'],
                    ['Highest Run Scorer'],
                    ['Highest Wicket Taker'],
                    ['Player who hit most 6s'],
                    ['Player who hit most 4s'],
                    ['Best Strike Rate Batsman'],
                    ['Best Economy Bowler'],
                    ['Least Dot-balls by Batsman'],
                    ['Most Dot-balls by Bowler']
                ];
                connection.query("INSERT INTO `staticPot` (`displayName`) VALUES ?", [values], callback);
            },
            function(results) {
                // Initialize Long-Term Pots
                var callback = arguments[arguments.length-1];
                var values = [];
                values.push([ 'Team - 1st Position', util.getSQLDate(new Date()), '2018-04-07 15:00:00', 1 ]);
                values.push([ 'Team - 2nd Position', util.getSQLDate(new Date()), '2018-04-07 15:00:00', 1 ]);
                values.push([ 'Team - 3rd Position', util.getSQLDate(new Date()), '2018-04-07 15:00:00', 1 ]);
                values.push([ 'Fairplay Team', util.getSQLDate(new Date()), '2018-04-07 15:00:00', 1 ]);
                values.push([ 'Highest Run Scorer', util.getSQLDate(new Date()), '2018-04-07 15:00:00', 0 ]);
                values.push([ 'Highest Wicket Taker', util.getSQLDate(new Date()), '2018-04-07 15:00:00', 0 ]);
                values.push([ 'Emerging Player', util.getSQLDate(new Date()), '2018-04-07 15:00:00', 0 ]);
                values.push([ 'Player who hit most 6s', util.getSQLDate(new Date()), '2018-04-07 15:00:00', 0 ]);
                values.push([ 'Player who hit most 4s', util.getSQLDate(new Date()), '2018-04-07 15:00:00', 0 ]);
                values.push([ 'Best Catch', util.getSQLDate(new Date()), '2018-04-07 15:00:00', 0 ]);
                connection.query("INSERT INTO `pot` (`displayName`, `openTime`, `closeTime`, `isTeamLevel`) VALUES ?", [values], callback);
            },
            function(results) {
                // Fetch Match Details for the Next Step
                var callback = arguments[arguments.length-1];
                connection.query("SELECT `id`, `fixture`, `homeTeam`, `awayTeam` FROM `match`", callback);
            },
            function(results) {
                // Initialize Default Pots [Team-Level Pots]
                var callback = arguments[arguments.length-1];
                var values = [];
                results.forEach(match => {
                    var date = new Date(match.fixture);
                    var fix = util.getReadableFixture(date);
                    values.push([ 'Toss Winner: ' + match.homeTeam + " vs " + match.awayTeam + " ( " + fix.date.slice(0, 6) + ", " + fix.time + " )", util.getSQLDate(new Date()), util.getSQLDate(util.subtractDate(date, 3600000)), 1, match.id ]);
                    values.push([ 'Who will bat first: ' + match.homeTeam + " vs " + match.awayTeam + " ( " + fix.date.slice(0, 6) + ", " + fix.time + " )", util.getSQLDate(new Date()), util.getSQLDate(util.subtractDate(date, 3600000)), 1, match.id ]);
                    values.push([ 'Winning Team: ' + match.homeTeam + " vs " + match.awayTeam + " ( " + fix.date.slice(0, 6) + ", " + fix.time + " )", util.getSQLDate(new Date()), util.getSQLDate(util.subtractDate(date, 3600000)), 1, match.id ]);
                });
                connection.query("INSERT INTO `pot` (`displayName`, `openTime`, `closeTime`, `isTeamLevel`, `match`) VALUES ?", [values], callback);
            },
            function() {
                // Transfers disabled by default
                var callback = arguments[arguments.length-1];
                connection.query("INSERT INTO `configuration` VALUES ('transfers', 'disabled')", callback);
            }
        ], connection, function(error) {
            if(error) {
                if(error === "Data Already Initialized") return console.log(error);
                else return console.log("Error while initializing data: " + error);
            }
            else return console.log("Data Initialized Successfully.");
        });
    } catch(error) {
        console.log("Unknown Error while initializing data: " + error);
        console.log("Error Stack Trace: " + error.stack);
    }
    
}

// Drop All Tables Query: drop table bet; drop table player; drop table `match`; drop table pot; drop table team; drop table transaction; drop table user; drop table staticPot; drop table sessions; drop table result; drop table configuration;