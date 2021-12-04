/*jslint node:true*/
'use strict';

var util = require('../core/util');
var mysql = require('../core/mysql');
var router = require('express').Router();

router.get('/', function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function (callback) {
                connection.query("SELECT b.`betAmount`, b.`betOn`, b.`winAmount` FROM `bet` b WHERE b.`user` = ?", [request.user.id], callback);
            },
            function (bets) {
                var callback = arguments[arguments.length - 1];
                var moneyInHand = request.user.balance ? request.user.balance : 0;
                var moneyInBet = 0;
                var moneyWon = 0;
                var moneyLost = 0;

                bets.forEach(bet => {
                    if (bet.winAmount !== null) {
                        if (bet.winAmount > 0) moneyWon += (bet.winAmount - bet.betAmount);
                        else moneyLost += bet.betAmount;
                    } else moneyInBet += bet.betAmount;
                });

                callback(null, request.user.name, moneyInHand, moneyInBet, moneyWon, moneyLost);
            }
        ], connection, function (error, name, moneyInHand, moneyInBet, moneyWon, moneyLost) {
            if (error) return response.status(500).send("Unable to fetch bets.");
            return response.render('pages/users/index', {
                title: "BettingBad : User Home",
                user: {
                    name: name,
                    moneyInHand: moneyInHand,
                    moneyInBet: moneyInBet,
                    moneyWon: moneyWon,
                    moneyLost: moneyLost
                },
                active: "home",
                transfer: request.user.transfer
            });
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/users/error');
    }
});

router.get('/betzone', util.checkActiveUser, function (request, response) {
    try {
        response.render('pages/users/placebet', {
            title: 'BettingBad : Place Bet',
            active: 'bets',
            transfer: request.user.transfer,
            user: {
                name: request.user.name
            }
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/users/error');
    }
});

router.get('/betzone/:match', util.checkActiveUser, function (request, response) {
    try {
        response.render('pages/users/placebet', {
            title: 'BettingBad : Place Bet',
            active: 'bets',
            transfer: request.user.transfer,
            user: {
                name: request.user.name,
                betmatch: request.params.match
            }
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/users/error');
    }
});

router.get('/transfer', util.checkActiveUser, function (request, response) {
    try {
        if (request.user.transfer === 'disabled') {
            response.redirect('/users');
        }
        response.render('pages/users/transfer', {
            title: 'BettingBad : Transfer Money',
            active: 'transfer',
            transfer: request.user.transfer,
            user: {
                name: request.user.name,
                balance: request.user.balance
            }
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/users/error');
    }
});

router.get('/fixtures', function (request, response) {
    try {
        response.render('pages/users/fixtures', {
            title: 'BettingBad : Fixtures',
            active: 'fixtures',
            transfer: request.user.transfer,
            user: {
                name: request.user.name
            }
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/users/error');
    }
});

router.get('/rules', function (request, response) {
    try {
        response.render('pages/users/rules', {
            title: 'BettingBad : Rules',
            active: 'rules',
            transfer: request.user.transfer,
            user: {
                name: request.user.name
            }
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/users/error');
    }
});

router.get('/prizes', function (request, response) {
    try {
        response.render('pages/users/prizes', {
            title: 'BettingBad : Prizes',
            active: 'prizes',
            transfer: request.user.transfer,
            user: {
                name: request.user.name
            }
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/users/error');
    }
});

router.get('/stats', function (request, response) {
    try {
        response.render('pages/users/stats', {
            title: 'BettingBad : Statistics',
            active: 'stats',
            transfer: request.user.transfer,
            user: {
                name: request.user.name
            }
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/users/error');
    }
});

router.get('/error', function(request, response) {
    try {
        response.render('pages/users/error', {
            title: 'Error',
            active: '',
            transfer: request.user.transfer,
			user: {
				name: request.user.name
			}
        });
    } catch(error) {
        console.log("Unknown Error Occurred on error page: " + error);
        console.log("Error Stack Trace: " + error.stack);
        response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

router.get('/leaders', function (request, response) {
    try {
        response.render('pages/users/leader', {
            title: 'Leaderboard',
            active: 'leaders',
            transfer: request.user.transfer,
			user: {
				name: request.user.name
			}
        });
    } catch (error) {
        console.log("Unknown Error Occurred on error page: " + error);
        console.log("Error Stack Trace: " + error.stack);
        response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

module.exports = router;
