/*jslint node:true*/
'use strict';

var util = require('../../core/util');
var mysql = require('../../core/mysql');
var router = require('express').Router();

// 1. List of all the pots [/apis/pot/all]
router.get('/all', function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT * FROM `pot`", callback);
            }
        ], connection, function(error, pots) {
            if(error) return response.status(500).send("Unable to fetch pots.");
            return response.status(200).send(JSON.stringify(pots));
        });
    } catch(exception) {
        console.log("Error occurred while fetching all pots: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 2. List of all the pots open for betting [/apis/pot/open]
router.get('/open', function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT * FROM `pot` WHERE `openTime` <= CONVERT_TZ(CURRENT_TIMESTAMP,'+00:00','+05:30') AND `closeTime` >= CONVERT_TZ(CURRENT_TIMESTAMP,'+00:00','+05:30')", callback);
            }
        ], connection, function(error, pots) {
            if(error) return response.status(500).send("Unable to fetch pots.");
            return response.status(200).send(JSON.stringify(pots));
        });
    } catch(exception) {
        console.log("Error occurred while fetching open pots: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 3. List of all the pots closed for betting [/apis/pot/closed]
router.get('/closed', function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT * FROM `pot` WHERE `closeTime` < CONVERT_TZ(CURRENT_TIMESTAMP,'+00:00','+05:30')", callback);
            }
        ], connection, function(error, pots) {
            if(error) return response.status(500).send("Unable to fetch pots.");
            return response.status(200).send(JSON.stringify(pots));
        });
    } catch(exception) {
        console.log("Error occurred while fetching closed pots: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 4. List of all the long-term pots [/apis/pot/long-term]
router.get('/long-term', function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                if(request.isAuthenticated() && request.user.admin) {
                    connection.query("SELECT * FROM `pot` WHERE `match` IS NULL", callback);
                } else if(request.isAuthenticated() && !request.user.suspended) {
                    connection.query("SELECT * FROM `pot` WHERE `match` IS NULL AND `closeTime` >= CONVERT_TZ(CURRENT_TIMESTAMP,'+00:00','+05:30')", callback);
                } else {
                    return callback("Unauthenticated/Unauthorized User.");
                }
            },
            function(pots) {
                var callback = arguments[arguments.length-1];
                connection.query("SELECT t.`name` FROM `team` t", function(error, teams) {
                    if(error) return callback(error);
                    return callback(null, pots, teams);
                });
            },
            function(pots, teams) {
                var callback = arguments[arguments.length-1];
                connection.query("SELECT p.`name` FROM `player` p", function(error, players) {
                    if(error) return callback(error);
                    else return callback(null, pots, teams, players);
                });
            },
            function(pots, teams, players) {
                var callback = arguments[arguments.length-1];
                pots.forEach(pot => {
                    if(request.isAuthenticated() && request.user.admin) {
                        pot.options = [{
                            key: "NO RESULT",
                            value: "NO RESULT"
                        }];
                    } else {
                        pot.options = [];
                    }
                    if(pot.isTeamLevel) {
                        teams.forEach(team => {
                            pot.options.push({
                                key: team.name,
                                value: team.name
                            });
                        });
                    } else {
                        players.forEach(player => {
                            pot.options.push({
                                key: player.name,
                                value: player.name
                            });
                        });
                    }
                });
                callback(null, pots);
            }
        ], connection, function(error, pots) {
            if(error) return response.status(500).send("Unable to fetch pots.");
            return response.status(200).send(JSON.stringify(pots));
        });
    } catch(exception) {
        console.log("Error occurred while fetching all pots for a match: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 5. List of all the pots for a match with options [/apis/pot/match/:matchId]
router.get('/match/:matchId', function (request, response) {
    var message = null;
    try {
        var matchId = request.params.matchId;
        if(!matchId) {
            message = "Please provide Match ID";
            throw message;
        }
        
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT * FROM `pot` WHERE `match` = ?", matchId, callback);
            },
            function(pots) {
                var callback = arguments[arguments.length-1];
                connection.query("SELECT m.`homeTeam` AS htsn, t1.`name` AS htn, m.`awayTeam` AS atsn, t2.`name` AS atn FROM `match` m, `team` t1, `team` t2 WHERE m.`homeTeam` = t1.`id` AND m.`awayTeam` = t2.`id` AND m.`id` = ?", matchId, function(error, teams) {
                    if(error) return callback(error);
                    else return callback(null, pots, teams[0]);
                });
            },
            function(pots, teams) {
                var callback = arguments[arguments.length-1];
                connection.query("SELECT p.* FROM `player` p, `match` m WHERE (p.`team` = m.`homeTeam` OR p.`team` = m.`awayTeam`) AND m.`id` = ?", matchId, function(error, players) {
                    if(error) return callback(error);
                    else return callback(null, pots, teams, players);
                });
            },
            function(pots, teams, players) {
                var callback = arguments[arguments.length-1];
                pots.forEach(pot => {
                    if(request.isAuthenticated() && request.user.admin) {
                        pot.options = [{
                            key: "NO RESULT",
                            value: "NO RESULT"
                        }];
                    } else {
                        pot.options = [];
                    }
                    if(pot.isTeamLevel) {
                        pot.options.push({ key: teams.htn, value: teams.htn });
                        pot.options.push({ key: teams.atn, value: teams.atn });
                    } else {
                        players.forEach(player => {
                            pot.options.push({
                                key: player.name,
                                value: player.name
                            });
                        });
                    }
                });
                callback(null, pots);
            }
        ], connection, function(error, pots) {
            if(error) return response.status(500).send("Unable to fetch pots.");
            return response.status(200).send(JSON.stringify(pots));
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while fetching all pots for a match: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 6. List of all static pots for a match [/apis/pot/static/:matchId]
router.get('/static/:matchId', util.checkAdmin, function(request, response) {
    var message = null;
    try {
        var matchId = request.params.matchId;
        if(!matchId) {
            message = "Please provide Match ID";
            throw message;
        }
        
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT s.`displayName` AS sPot, px.`displayName` AS pPot FROM `staticPot` s LEFT OUTER JOIN (SELECT p.`displayName` FROM `pot` p WHERE p.`match` = ?) px ON s.`displayName` = px.`displayName`", matchId, callback);
            },
            function(pots) {
                var callback = arguments[arguments.length-1];
                var staticPots = { active : [], inactive : [] };

                pots.forEach(pot => {
                    if(pot.sPot === pot.pPot) staticPots.active.push(pot.sPot);
                    else staticPots.inactive.push(pot.sPot);
                });

                callback(null, staticPots);
            }
        ], connection, function(error, pots) {
            if(error) return response.status(500).send("Unable to fetch pots.");
            return response.status(200).send(JSON.stringify(pots));
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while fetching static pots for a match: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

function _getResult(pots, callback) {
    var inPots = [];
    var result = {};
    pots.forEach(pot => {
        inPots.push(pot.pot);
        result[pot.pot] = {
            potId : pot.pot,
            potName : pot.potName,
            home : pot.home,
            homeShort : pot.homeShort,
            away : pot.away,
            awayShort : pot.awayShort,
            matchId : pot.match
        };
    });
    return callback(null, inPots, result);
}

// 7. List of all open pots for a team with total amount on either side
router.get('/stats/open/teams', util.checkActiveUser, function(request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT p.`id` AS `pot`, m.`id` AS `match`, p.`displayName` AS potName, t1.`name` AS home, t1.`id` AS homeShort, t2.`name` AS away, t2.`id` AS awayShort, p.`closeTime` AS closeTime FROM `pot` p, `match` m, `team` t1, `team` t2 WHERE p.`match` = m.`id` AND m.`homeTeam` = t1.`id` AND m.`awayTeam` = t2.`id` AND p.`isTeamLevel` = 1", callback);
            },
            function(pots) {
                var callback = arguments[arguments.length-1];
                return _getResult(pots, callback);
            },
            function(inPots, result) {
                var callback = arguments[arguments.length-1];
                connection.query("SELECT b.`pot` AS `pot`, b.`betTeam` AS team, SUM(b.`betAmount`) AS amount FROM `bet` b WHERE b.`pot` IN (" + inPots.join(",") + ") AND b.`winner` IS NULL GROUP BY b.`pot`, b.`betTeam` ORDER BY b.`pot`", function(error, betGroups) {
                    if(error) return callback(error);
                    else return callback(null, result, betGroups);
                });
            },
            function(result, betGroups) {
                var callback = arguments[arguments.length-1];
                var output = {};
                betGroups.forEach(betGroup => {
                    output[betGroup.pot] = result[betGroup.pot];
                    if(output[betGroup.pot].gcd === undefined) output[betGroup.pot].gcd = [];
                    output[betGroup.pot].teams = typeof output[betGroup.pot].teams !== 'undefined' ? output[betGroup.pot].teams : {};
                    output[betGroup.pot].teams[betGroup.team] = betGroup.amount;
                    output[betGroup.pot].gcd.push(betGroup.amount);
                });
                
                for(var pot in output) {
                    var gcd = util.gcdArray(output[pot].gcd);
                    for(var team in output[pot].teams) {
                        output[pot].teams[team] = output[pot].teams[team]/gcd;
                    }
                }
                callback(null, output);
            }
        ], connection, function(error, pots) {
            if(error) return response.status(500).send("Unable to fetch pots.");
            return response.status(200).send(JSON.stringify(pots));
        });
    } catch(exception) {
        console.log("Error occurred while fetching open pots for teams: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 8. List of all open pots for players with total amount on all players
router.get('/stats/open/players', util.checkActiveUser, function(request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT p.`id` AS `pot`, m.`id` AS match, p.`displayName` AS potName, t1.`name` AS home, t1.`id` AS homeShort, t2.`name` AS away, t2.`id` AS awayShort, p.`closeTime` AS closeTime FROM `pot` p, `match` m, `team` t1, `team` t2 WHERE p.`match` = m.`id` AND m.`homeTeam` = t1.`id` AND m.`awayTeam` = t2.`id` AND p.`isTeamLevel` = 1", callback);
            },
            function(pots) {
                var callback = arguments[arguments.length-1];
                return _getResult(pots, callback);
            },
            function(inPots, result) {
                var callback = arguments[arguments.length-1];
                connection.query("SELECT b.`pot` AS `pot`, b.`betOn` AS player, SUM(b.`betAmount`) AS amount FROM `bet` b WHERE b.`pot` IN (" + inPots.join(",") + ") AND b.`winner` IS NULL GROUP BY b.`pot`, b.`betOn` ORDER BY b.`pot`", function(error, betGroups) {
                    if(error) return callback(error);
                    else return callback(null, result, betGroups);
                });
            },
            function(result, betGroups) {
                var callback = arguments[arguments.length-1];
                var output = {};
                betGroups.forEach(betGroup => {
                    output[betGroup.pot] = result[betGroup.pot];
                    if(output[betGroup.pot].gcd === undefined) output[betGroup.pot].gcd = [];
                    output[betGroup.pot].players = typeof output[betGroup.pot].players !== 'undefined' ? output[betGroup.pot].players : {};
                    output[betGroup.pot].players[betGroup.player] = betGroup.amount;
                    output[betGroup.pot].gcd.push(betGroup.amount);
                });
                for(var pot in output) {
                    var gcd = util.gcdArray(output[pot].gcd);
                    for(var player in output[pot].players) {
                        output[pot].players[player] = output[pot].players[player]/gcd;
                    }
                }
                callback(null, output);
            }
        ], connection, function(error, pots) {
            if(error) return response.status(500).send("Unable to fetch pots.");
            return response.status(200).send(JSON.stringify(pots));
        });
    } catch(exception) {
        console.log("Error occurred while fetching open pots for player: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 7. List of all open pots for a team with total amount on either side
router.get('/open/teams', util.checkAdmin, function(request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT p.`id` AS `pot`, m.`id` AS `match`, p.`displayName` AS potName, t1.`name` AS home, t1.`id` AS homeShort, t2.`name` AS away, t2.`id` AS awayShort, p.`closeTime` AS closeTime FROM `pot` p, `match` m, `team` t1, `team` t2 WHERE p.`match` = m.`id` AND m.`homeTeam` = t1.`id` AND m.`awayTeam` = t2.`id` AND p.`isTeamLevel` = 1", callback);
            },
            function(pots) {
                var callback = arguments[arguments.length-1];
                return _getResult(pots, callback);
            },
            function(inPots, result) {
                var callback = arguments[arguments.length-1];
                connection.query("SELECT b.`pot` AS `pot`, b.`betTeam` AS team, SUM(b.`betAmount`) AS amount FROM `bet` b WHERE b.`pot` IN (" + inPots.join(",") + ") AND b.`winner` IS NULL GROUP BY b.`pot`, b.`betTeam` ORDER BY b.`pot`", function(error, betGroups) {                    if(error) return callback(error);
                    else return callback(null, result, betGroups);
                });
            },
            function(result, betGroups) {
                var callback = arguments[arguments.length-1];
                var output = {};
                betGroups.forEach(betGroup => {
                    output[betGroup.pot] = result[betGroup.pot];
                    output[betGroup.pot].teams = typeof output[betGroup.pot].teams !== 'undefined' ? output[betGroup.pot].teams : {};
                    output[betGroup.pot].teams[betGroup.team] = betGroup.amount;
                });
                console.log(output);
                callback(null, output);
            }
        ], connection, function(error, pots) {
            if(error) return response.status(500).send("Unable to fetch pots.");
            return response.status(200).send(JSON.stringify(pots));
        });
    } catch(exception) {
        console.log("Error occurred while fetching open pots for teams: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 8. List of all open pots for players with total amount on all players
router.get('/open/players', util.checkAdmin, function(request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT p.`id` AS `pot`, m.`id` AS match, p.`displayName` AS potName, t1.`name` AS home, t1.`id` AS homeShort, t2.`name` AS away, t2.`id` AS awayShort, p.`closeTime` AS closeTime FROM `pot` p, `match` m, `team` t1, `team` t2 WHERE p.`match` = m.`id` AND m.`homeTeam` = t1.`id` AND m.`awayTeam` = t2.`id` AND p.`isTeamLevel` = 1", callback);
            },
            function(pots) {
                var callback = arguments[arguments.length-1];
                return _getResult(pots, callback);
            },
            function(inPots, result) {
                var callback = arguments[arguments.length-1];
                connection.query("SELECT b.`pot` AS `pot`, b.`betOn` AS player, SUM(b.`betAmount`) AS amount FROM `bet` b WHERE b.`pot` IN (" + inPots.join(",") + ") AND b.`winner` IS NULL GROUP BY b.`pot`, b.`betOn` ORDER BY b.`pot`", function(error, betGroups) {
                    if(error) return callback(error);
                    else return callback(null, result, betGroups);
                });
            },
            function(result, betGroups) {
                var callback = arguments[arguments.length-1];
                var output = {};
                betGroups.forEach(betGroup => {
                    output[betGroup.pot] = result[betGroup.pot];
                    output[betGroup.pot].players = typeof output[betGroup.pot].players !== 'undefined' ? output[betGroup.pot].players : {};
                    output[betGroup.pot].players[betGroup.player] = betGroup.amount;
                });
                callback(null, output);
            }
        ], connection, function(error, pots) {
            if(error) return response.status(500).send("Unable to fetch pots.");
            return response.status(200).send(JSON.stringify(pots));
        });
    } catch(exception) {
        console.log("Error occurred while fetching open pots for player: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 9. Add new pot [/apis/pot/add]
router.post('/add/short-term', util.checkAdmin, function (request, response) {
    var message = null;
    try {
        var data = request.body ? request.body : undefined;
        if (!data) {
            message = "Please provide appropriate data";
            throw message;
        }
        
        message = "Please enter a valid matchId";
        data.match = util.checkInteger(data.match, message);
        
        message = "Please enter a valid openTime";
        data.openTime = util.getSQLDate(new Date(data.openTime));

        message = "Please enter a valid closeTime";
        data.closeTime = util.getSQLDate(new Date(data.closeTime));
        
        if(!data.pots) {
            message = "Please specify pots to be updated";
            throw message;
        }
        
        var tasks = [];
        var pots = Object.keys(data.pots);
        
        for(var potId in data.pots) {
            message = "Please enter a valid multiplier for home team";
            data.pots[potId].home = util.checkInteger(data.pots[potId].home, message);

            message = "Please enter a valid multiplier for away team";
            data.pots[potId].away = util.checkInteger(data.pots[potId].away, message);

            if(data.pots[potId].home < 1 || data.pots[potId].away < 1) {
                message = "Multiplier value cannot be less than 1.";
                throw message;
            }
        }
        
        var connection = mysql.getConnection();
        pots.forEach(potId => {
            tasks.push(
                function() {
                    var callback = arguments[arguments.length-1];
                    connection.query("UPDATE `pot` SET `multiplierHome` = ?, `multiplierAway` = ? WHERE `match` = ? AND `id` = ?", [ data.pots[potId].home, data.pots[potId].away, data.match, potId ], callback);
                }
            );
        });
        
        tasks.push(
            function() {
                // Update Multipliers of all users' bets
                var callback = arguments[arguments.length-1];
                connection.query("UPDATE `bet` b INNER JOIN `pot` p ON b.`pot` = p.`id` INNER JOIN `match` m ON p.`match` = m.`id` SET b.`multiplier` = CASE WHEN b.`betTeam` = m.`homeTeam` THEN p.`multiplierHome` ELSE p.`multiplierAway` END WHERE p.`match` = ? AND p.`isTeamLevel` = 1", data.match, callback);
            },
            function(matches) {
                // Insert Static Pots
                var callback = arguments[arguments.length-1];
                var values = [];
                if(data.static.length > 0) {
                    data.static.forEach(pot => {
                        values.push([ pot, data.openTime, data.closeTime, data.match ]);
                    });
                    connection.query("INSERT INTO `pot` (`displayName`, `openTime`, `closeTime`, `match`) VALUES ?", [values], function(error, results) {
                        if(error) return callback(error);
                        else return callback(null, data.static.length);
                    });
                } else return callback(null, data.static.length);
            }
        );
        
        var connection = mysql.getConnection();
        mysql.transaction(tasks, connection, function(error, potCount) {
            if(error) return response.status(500).send("Error while adding new pot: " + error);
            return response.status(200).send("New " + potCount + " Pot/s added successfully");
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while adding new pot: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 10. Update Pot Winner [/apis/pot/update-winner]
router.post('/update-winner', util.checkAdmin, function(request, response) {
    var message = null;
    try {
        var data = request.body ? request.body : undefined;
        if (!data) {
            message = "Please provide appropriate data";
            throw message;
        }
        
        var tasks = [];
        var resultValues = [];
        var pots = Object.keys(data);
        
        var connection = mysql.getConnection();
        pots.forEach(potId => {
            tasks.push(
                function() {
                    var callback = arguments[arguments.length-1];
                    if(data[potId] && data[potId].length > 0) {
                        var res;
                        if(data[potId][0] === "NO RESULT") {
                            res = data[potId][0];
                        } else {
                            res = "'" + data[potId].join("','") + "'";
                        }
                        connection.query("CALL UpdatePotResult(?, ?)", [ potId, res ], callback);
                    } else {
                        callback(null);
                    }
                }
            );
            data[potId].forEach(result => {
                resultValues.push([ result, potId ]);
            });
        });
        
        tasks.push(
            function() {
                var callback = arguments[arguments.length-1];
                connection.query("INSERT INTO `result` (`result`, `pot`) VALUES ?", [ resultValues ], callback);
            }
        );
        
        mysql.transaction(tasks, connection, function(error) {
            if(error) return response.status(500).send("Error while updating pot winner: " + error);
            return response.status(200).send("Pot results updated successfully.");
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while adding new pot: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return status(500).send(exception);
    }
});

// 11. Update long-term pot [/apis/pot/update/long-term]
router.post('/update/long-term', util.checkAdmin, function (request, response) {
    var message = null;
    try {
        var data = request.body ? request.body : undefined;
        if (!data) {
            message = "Please provide appropriate data";
            throw message;
        }
        
        var tasks = [];
        var pots = Object.keys(data);
        
        // Validations
        for(var potId of pots) {
            message = "Please enter a valid openTime";
            var current = new Date();
            var date = new Date(data[potId].openTime);
            if(isNaN(date.getTime())) throw message;
            data[potId].openTime = util.getSQLDate(date);

            message = "Please enter a valid closeTime";
            date = new Date(data[potId].closeTime);
            if(isNaN(date.getTime()) || date.getTime() <= current.getTime() ) throw message;
            data[potId].closeTime = util.getSQLDate(date);

            message = "Please enter a valid multiplier for the pot";
            data[potId].multiplier = util.checkInteger(data[potId].multiplier, message);

            if(data[potId].multiplier < 1) {
                message = "Multiplier value cannot be less than 1.";
                throw message;
            }
        }
        
        
        var connection = mysql.getConnection();
        pots.forEach(potId => {
            tasks.push(
                function() {
                    var callback = arguments[arguments.length-1];
                    connection.query("UPDATE `pot` SET `openTime` = ?, `closeTime` = ?, `multiplierHome` = ? WHERE `id` = ? AND `match` IS NULL", [ data[potId].openTime, data[potId].closeTime, data[potId].multiplier, potId ], callback);
                }
            );
        });
        
        var connection = mysql.getConnection();
        mysql.transaction(tasks, connection, function(error) {
            if(error) return response.status(500).send("Error while adding new pot: " + error);
            return response.status(200).send("Long-Term Pots updated successfully");
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while adding new pot: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

module.exports = router;