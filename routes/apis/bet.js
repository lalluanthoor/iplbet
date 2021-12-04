/*jslint node:true*/
'use strict';

var util = require('../../core/util');
var mysql = require('../../core/mysql');
var router = require('express').Router();

// 1. View all bets [/apis/bet/all]
router.get('/all', util.checkAdmin, function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function (callback) {
                connection.query("SELECT u.`name` AS username, p.`displayName` AS potName, b.`betOn` AS betOn, b.`betTeam` AS betIcon, b.`betAmount` AS betAmount, b.`betTime` AS betDate, (CASE b.`winner` WHEN b.`betOn` THEN CONCAT('Won ', b.`winAmount`) ELSE CONCAT('Lost ', b.`betAmount`) END) AS result, u.`balance` AS balance FROM `bet` b, `user` u, `match` m, `pot` p WHERE b.`user` = u.`id` AND b.`match` = m.`id` AND b.`pot` = p.`id` ORDER BY u.`name`, m.`fixture`, p.`displayName`, b.`betTime`", callback);
            }
        ], connection, function (error, bets) {
            if (error) return response.status(500).send("Unable to fetch bets.");
            return response.status(200).send(JSON.stringify(bets));
        });
    } catch (exception) {
        console.log("Error occurred while fetching all bets: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 2. View all bets for a pot [/apis/bet/pot/:potId]
router.get('/pot/:potId', util.checkAdmin, function (request, response) {
    var message = null;
    try {
        var potId = request.params.potId;
        if (!potId) {
            message = "Please provide Pot ID";
            throw message;
        }

        var connection = mysql.getConnection();
        mysql.transaction([
            function (callback) {
                connection.query("SELECT u.`name` AS username, p.`displayName` AS potName, b.`betOn` AS betOn, b.`betTeam` AS betIcon, b.`betAmount` AS betAmount, b.`betTime` AS betDate, (CASE b.`winner` WHEN b.`betOn` THEN CONCAT('Won ', b.`winAmount`) ELSE CONCAT('Lost ', b.`betAmount`) END) AS result, u.`balance` AS balance FROM `bet` b, `user` u, `match` m, `pot` p WHERE b.`user` = u.`id` AND b.`match` = m.`id` AND b.`pot` = p.`id` AND b.`pot` = ? ORDER BY u.`name`, m.`fixture`, p.`displayName`, b.`betTime`", potId, callback);
            }
        ], connection, function (error, bets) {
            if (error) return response.status(500).send("Unable to fetch bets.");
            return response.status(200).send(JSON.stringify(bets));
        });
    } catch (exception) {
        if (exception !== message) {
            console.log("Error occurred while fetching all bets for a pot: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 3. View all bets for a user [/apis/bet/user]
router.get('/user', util.checkUser, function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function (callback) {
                connection.query("(SELECT p.`displayName` AS potName, b.`betOn` AS betOn, b.`betTeam` AS betIcon, b.`betAmount` AS betAmount, b.`betTime` AS betDate, (CASE WHEN b.`winner` IS NULL THEN 'Not Declared' WHEN b.`winner` = 1 THEN CONCAT('Won ', b.`winAmount`) ELSE CONCAT('Lost ', b.`betAmount`) END) AS result FROM `bet` b, `pot` p WHERE b.`pot` = p.`id` AND b.`user`= ? AND p.`match` IS NULL ORDER BY p.`displayName`, b.`betTime`) UNION (SELECT p.`displayName` AS potName, b.`betOn` AS betOn, b.`betTeam` AS betIcon, b.`betAmount` AS betAmount, b.`betTime` AS betDate, (CASE WHEN b.`winner` IS NULL THEN 'Not Declared' WHEN b.`winner` = 1 THEN CONCAT('Won ', b.`winAmount`) ELSE CONCAT('Lost ', b.`betAmount`) END) AS result FROM `bet` b, `match` m, `pot` p WHERE p.`match` = m.`id` AND b.`pot` = p.`id` AND b.`user`= ? ORDER BY m.`fixture`, p.`displayName`, b.`betTime`)", [request.user.id, request.user.id], callback);
            }
        ], connection, function (error, bets) {
            if (error) return response.status(500).send("Unable to fetch bets.");
            return response.status(200).send(JSON.stringify(bets));
        });
    } catch (exception) {
        console.log("Error occurred while fetching all bets for a user: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 4. Place a new bet [/apis/bet/place]
router.post('/place/:matchId', util.checkActiveUser, function (request, response) {
    var message = null;
    try {
        var matchId = request.params.matchId;
        if (!matchId) {
            message = "Please provide Match ID";
            throw message;
        }

        var data = request.body ? request.body : undefined;
        if (!data) {
            return response.status(500).send("Please provide appropriate data");
        }

        var pots = Object.keys(data);

        if (pots.length === 0) {
            message = "No bets to be placed.";
            throw message;
        }

        var userBalance = util.checkInteger(request.user.balance);
        var totalBetAmount = 0;

        for (var potId in data) {
            if (data[potId].betAmount < 1000) {
                message = "A minimum bet of 1000 is mandatory for each bet.";
                throw message;
            }
            totalBetAmount += data[potId].betAmount;
        }

        if (userBalance < totalBetAmount) {
            message = "Not enough balance to place all bets.";
            throw message;
        }

        var connection = mysql.getConnection();
        var tasks = [];

        for(var potId in data) {
          tasks.push(function() {
            var callback = arguments[arguments.length - 1];
            connection.query("SELECT `id` FROM `bet` WHERE `user`=? AND `pot`=?", [request.user.id, potId], function(error, results) {
              if(error) return callback(error);
              else {
                if(results.length === 0) return callback(null); // Valid. No bets placed.
                else return callback("Bet already placed for the pot [" + potId + "]"); // Bet placed. Validation Error.
              }
            });
          });
        }

        mysql.transaction(tasks, connection, function(error) {
          if (error) return response.status(500).send("Error while placing new bet/s: " + error);
          connection = mysql.getConnection();
          mysql.transaction([
              function (callback) {
                  // Fetch pot and match details
                  connection.query("SELECT p.`id` AS id, p.`displayName` AS name, t1.`name` AS home, t1.`id` AS homeShort, t2.`name` AS away, t2.`id` AS awayShort, p.`match` AS `match`, p.`isTeamLevel` AS isTeamLevel, p.`closeTime` AS closeTime, p.`multiplierHome` AS multiplierHome, p.`multiplierAway` AS multiplierAway FROM `pot` p, `match` m, `team` t1, `team` t2 WHERE p.`match` = m.`id` AND m.`homeTeam` = t1.`id` AND m.`awayTeam` = t2.`id` AND p.`id` IN (" + pots.join(",") + ")", callback);
              },
              function (pots) {
                  var callback = arguments[arguments.length - 1];
                  connection.query("SELECT p.* FROM `player` p, `match` m WHERE (p.`team` = m.`homeTeam` OR p.`team` = m.`awayTeam`) AND m.`id` = ?", matchId, function (error, players) {
                      if (error) return callback(error);
                      var results = {};
                      players.forEach(player => {
                          results[player.name] = player.team;
                      });
                      return callback(null, pots, results);
                  });
              },
              function (pots, players) {
                  var callback = arguments[arguments.length - 1];
                  var balance = util.checkInteger(request.user.balance);
                  var timedOutPots = [];
                  var transactions = {};
                  var values = [];
                  for (var pot of pots) {
                      if (pot.closeTime.getTime() < new Date().getTime()) {
                          timedOutPots.push(pot.name);
                      }

                      if (!data[pot.id].betOn || !data[pot.id].betAmount) continue;

                      var toCompare, compareTo;

                      if (pot.isTeamLevel) {
                          toCompare = data[pot.id].betOn;
                          compareTo = pot.home;
                      } else {
                          toCompare = players[data[pot.id].betOn];
                          compareTo = pot.homeShort;
                      }

                      var betTeam, multiplier;
                      if (toCompare === compareTo) {
                          betTeam = pot.homeShort;
                          multiplier = pot.isTeamLevel ? pot.multiplierHome : 1;
                      } else {
                          betTeam = pot.awayShort;
                          multiplier = pot.isTeamLevel ? pot.multiplierAway : 1;
                      }

                      if (!pot.isTeamLevel) {
                          multiplier = pot.multiplierHome >= 1 ? pot.multiplierHome : 1;
                      }

                      values.push([pot.id, request.user.id, data[pot.id].betOn, betTeam, data[pot.id].betAmount, multiplier]);
                      balance -= data[pot.id].betAmount;
                      transactions[pot.id] = balance;
                  }
                  if (pots.length === timedOutPots.length) {
                      return callback("All pots selected by you have been closed for betting. Be quicker next time.");
                  } else {
                      connection.query("INSERT INTO `bet` (`pot`, `user`, `betOn`, `betTeam`, `betAmount`, `multiplier`) VALUES ?", [values], function (error) {
                          if (error) return callback(error);
                          return callback(null, balance, timedOutPots, transactions);
                      });
                  }
              },
              function (balance, timedOutPots, transactions) {
                  var callback = arguments[arguments.length - 1];
                  connection.query("UPDATE `user` SET `balance` = ? WHERE `id` = ?", [balance, request.user.id], function (error) {
                      if (error) return callback(error);
                      return callback(null, timedOutPots, transactions);
                  });
              },
              function (timedOutPots, transactions) {
                  var callback = arguments[arguments.length - 1];
                  var values = [];
                  for (var pot in data) {
                      if (transactions[pot] >= 0) {
                          values.push([request.user.id, 'IPL', 'BET', data[pot].betAmount, transactions[pot], 0]);
                      }
                  }
                  connection.query("INSERT INTO `transaction` (`from`, `to`, `type`, `amount`, `balanceFrom`, `balanceTo`) VALUES ?", [values], function (error, results) {
                      if (error) return callback(error);
                      return callback(null, timedOutPots, Object.keys(transactions).length);
                  });
              }
          ], connection, function (error, timedOutPots, betCount) {
              if (error) return response.status(500).send("Error while placing new bet/s: " + error);
              else {
                  response.status(200).send("New " + betCount + " Bet/s placed successfully");
              }
          });
        });
    } catch (exception) {
        if (exception !== message) {
            console.log("Error occurred while placing new bet: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 5. Place a new bet on long-term [/apis/bet/place]
router.post('/place', util.checkActiveUser, function (request, response) {
    var message = null;
    try {
        var data = request.body ? request.body : undefined;
        if (!data) {
            return response.status(500).send("Please provide appropriate data");
        }

        var pots = Object.keys(data);

        if (pots.length === 0) {
            message = "No bets to be placed.";
            throw message;
        }

        var userBalance = util.checkInteger(request.user.balance);
        var totalBetAmount = 0;

        for (var potId in data) {
            if (data[potId].betAmount < 1000) {
                message = "A minimum bet of 1000 is mandatory for each bet.";
                throw message;
            }
            totalBetAmount += data[potId].betAmount;
        }

        if (userBalance < totalBetAmount) {
            message = "Not enough balance to place all bets.";
            throw message;
        }

        var connection = mysql.getConnection();
        mysql.transaction([
            function (callback) {
                // Fetch pot and match details
                connection.query("SELECT p.`id` AS id, p.`displayName` AS name, p.`isTeamLevel` AS isTeamLevel, p.`closeTime` AS closeTime, p.`multiplierHome` AS multiplier FROM `pot` p WHERE p.`id` IN (" + pots.join(",") + ")", callback);
            },
            function (pots) {
                var callback = arguments[arguments.length - 1];
                connection.query("SELECT t.`id`, t.`name` FROM `team` t", function (error, teams) {
                    if (error) return callback(error);
                    var results = {};
                    teams.forEach(team => {
                        results[team.name] = team.id;
                    });
                    return callback(null, pots, results);
                });
            },
            function (pots, teams) {
                var callback = arguments[arguments.length - 1];
                connection.query("SELECT p.* FROM `player` p", function (error, players) {
                    if (error) return callback(error);
                    var results = {};
                    players.forEach(player => {
                        results[player.name] = player.team;
                    });
                    return callback(null, pots, teams, results);
                });
            },
            function (pots, teams, players) {
                var callback = arguments[arguments.length - 1];
                var balance = util.checkInteger(request.user.balance);
                var timedOutPots = [];
                var transactions = {};
                var values = [];
                for (var pot of pots) {
                    if (pot.closeTime.getTime() < new Date().getTime()) {
                        timedOutPots.push(pot.name);
                    } else {
                        if (!data[pot.id].betOn || !data[pot.id].betAmount) continue;
                        var betTeam = pot.isTeamLevel ? teams[data[pot.id].betOn] : players[data[pot.id].betOn];
                        values.push([pot.id, request.user.id, data[pot.id].betOn, betTeam, data[pot.id].betAmount, pot.multiplier]);

                        balance -= data[pot.id].betAmount;
                        transactions[pot.id] = balance;
                    }
                }
                if (pots.length === timedOutPots.length) {
                    return callback("All pots selected by you have been closed for betting. Be quicker next time.");
                } else {
                    connection.query("INSERT INTO `bet` (`pot`, `user`, `betOn`, `betTeam`, `betAmount`, `multiplier`) VALUES ?", [values], function (error) {
                        if (error) return callback(error);
                        return callback(null, balance, timedOutPots, transactions);
                    });
                }
            },
            function (balance, timedOutPots, transactions) {
                var callback = arguments[arguments.length - 1];
                connection.query("UPDATE `user` SET `balance` = ? WHERE `id` = ?", [balance, request.user.id], function (error) {
                    if (error) return callback(error);
                    return callback(null, timedOutPots, transactions);
                });
            },
            function (timedOutPots, transactions) {
                var callback = arguments[arguments.length - 1];
                var values = [];
                for (var pot in data) {
                    if (transactions[pot] >= 0) {
                        values.push([request.user.id, 'IPL', 'BET', data[pot].betAmount, transactions[pot], 0]);
                    }
                }
                connection.query("INSERT INTO `transaction` (`from`, `to`, `type`, `amount`, `balanceFrom`, `balanceTo`) VALUES ?", [values], function (error, results) {
                    if (error) return callback(error);
                    return callback(null, timedOutPots, Object.keys(transactions).length);
                });
            }
        ], connection, function (error, timedOutPots, betCount) {
            if (error) return response.status(500).send("Error while placing new bet/s: " + error);
            else {
                var message = "New " + betCount + " Bet/s placed successfully";
                if (timedOutPots.length > 0) {
                    message += "<br>The following pot/s have been closed for betting:";
                    timedOutPots.forEach(pot => {
                        message += "<br>" + pot;
                    });
                }
                response.status(200).send(message);
            }
        });

    } catch (exception) {
        if (exception !== message) {
            console.log("Error occurred while placing new bet: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

module.exports = router;
