/*jslint node:true*/
'use strict';

var util = require('../../core/util');
var mysql = require('../../core/mysql');
var router = require('express').Router();

// 1. List of All Users [/apis/user/all]
router.get('/all', util.checkAdmin, function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT * FROM `user` ORDER BY `name`", callback);
            }
        ], connection, function(error, users) {
            if(error) return response.status(500).send("Unable to fetch users.");
            return response.status(200).send(JSON.stringify(users));
        });
    } catch(exception) {
        console.log("Error occurred while fetching all users: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 2. List of Active Users [/apis/user/active]
router.get('/active', util.checkActiveUser, function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT * FROM `user` WHERE `suspended` = 0 AND `admin` = 0", callback);
            }
        ], connection, function(error, users) {
            if(error) return response.status(500).send("Unable to fetch users.");
            return response.status(200).send(JSON.stringify(users));
        });
    } catch(exception) {
        console.log("Error occurred while fetching all active users: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

router.get('/activeadm', util.checkAdmin, function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT * FROM `user` WHERE `suspended` = 0 AND `admin` = 0 ORDER BY `balance` DESC, `name` ASC", callback);
            }
        ], connection, function(error, users) {
            if(error) return response.status(500).send("Unable to fetch users.");
            return response.status(200).send(JSON.stringify(users));
        });
    } catch(exception) {
        console.log("Error occurred while fetching all active users: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 3. Activate User with Activation Code [Directly from mail] [/apis/user/activate/:user/:code]
router.get('/activate/:user/:code', function (request, response) {
    var message = null;
    try {
        var userId = request.params.user ? request.params.user : '';
        var code = request.params.code ? request.params.code : '';
        
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("UPDATE `user` SET `suspended` = 0 WHERE `id` = ? AND `activateCode` = ?", [userId, code], callback);
            }
        ], connection, function(error) {
            if(error) return response.status(500).send("Activation Failed.");
            return response.status(200).send("User Activated");
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while activating user via GET request: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 4. Activate User via Admin Login [/apis/user/activate]
router.post('/activate', util.checkAdmin, function (request, response) {
    var message = null;
    try {
        var data = request.body ? request.body : undefined;
        if (!data || !data.userId) {
            message = "Provide UserId";
            throw message;
        }
        
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("UPDATE `user` SET `suspended` = 0 WHERE `id` = ?", data.userId, callback);
            }
        ], connection, function(error) {
            if(error) return response.status(500).send("Activation Failed.");
            return response.status(200).send("User Activated");
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while activating user: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 5. Deactivate User via Admin Login [/apis/user/deactivate]
router.post('/deactivate', util.checkAdmin, function (request, response) {
    var message = null;
    try {
        var data = request.body ? request.body : undefined;
        if (!data || !data.userId) {
            message = "Provide UserId";
            throw message;
        }
        
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("UPDATE `user` SET `suspended` = 1 WHERE `id` = ?", data.userId, callback);
            }
        ], connection, function(error) {
            if(error) return response.status(500).send("Deactivation Failed.");
            return response.status(200).send("User Deactivated");
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while deactivating user: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 6. User Balance Over period of 'x' days
router.get('/balance/:days', util.checkUser, function (request, response) {
    var message = null;
    try {
        message = "Invalid Number of Days";
        var days = util.checkInteger(request.params.days, message);

        var date = new Date();
        var startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate() - days, 5, 30, 0);
        var endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 5, 29, 59);
        var oneDayInMs = 1 * 24 * 60 * 60 * 1000;

        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT * FROM `transaction` WHERE (`from` = ? OR `to` = ?) AND `time` >= ? AND `time` <= ? ORDER BY `time` DESC, `balanceFrom` ASC, `balanceTo` DESC", [request.user.id, request.user.id, util.getSQLDate(startTime), util.getSQLDate(endTime)], callback);
            },
            function(transactions) {
                var callback = arguments[arguments.length-1];
                var result = { x: [], y: [] };
                var x = endTime.getTime();
                transactions.forEach(transaction => {
                    if (x >= transaction.time.getTime()) {
                        var readableDate = util.getReadableFixture(new Date(x)).date;
                        result.x.push(readableDate.slice(0, readableDate.lastIndexOf('-')));
                        if (transaction.from && transaction.from === request.user.id) result.y.push(transaction.balanceFrom);
                        else result.y.push(transaction.balanceTo);
                        x -= oneDayInMs;
                    }
                });

                result.x.reverse();
                result.y.reverse();

                callback(null, result);
            }
        ], connection, function(error, result) {
            if(error) return response.status(500).send("Unable to fetch transaction history");
            return response.status(200).send(JSON.stringify(result));
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while fetching history of balance over a period: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 7. Leading Players
router.get('/leaderboard', function(request, response) {
    try {
        var top = 3;
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT u.`name` FROM `user` u WHERE u.`suspended` = 0 AND u.`admin` = 0 ORDER BY u.`balance` DESC LIMIT ?", top, callback);
            }
        ], connection, function(error, users) {
            if(error) return response.status(500).send("Error while fetching leaderboard: " + error);
            return response.status(200).send(JSON.stringify(users));
        });
    } catch(exception) {
        console.log("Error occurred while fetching the leaderboard: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send(exception);
    }
});

module.exports = router;