/*jslint node:true*/
'use strict';

var util = require('../../core/util');
var mysql = require('../../core/mysql');
var router = require('express').Router();

// 1. Update Balance [By Specific Amount] of All Users [/apis/balance/update/all]
router.post('/update/all', util.checkAdmin, function (request, response) {
    var data = request.body ? request.body : undefined;
    var message = null;
    try {
        if (!data || !data.amount) {
            message = "Provide Amount";
            throw message;
        }

        message = "Please provide a valid number";
        data.amount = util.checkInteger(data.amount, message);

        if (data.amount <= 0) {
            message = "Please enter a valid non-zero amount.";
            throw message;
        }

        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("CALL BonusToAll(?)", data.amount, callback);
            }
        ], connection, function(error) {
            if(error) return response.status(500).send("Error occurred while giving bonus to all: " + error);
            else return response.status(200).send("BONUS [ " + data.amount + " ] given to all active users.");
        });
    } catch (exception) {
        if(exception !== message) {
            console.log("Error occurred while giving bonus to all users: " + exception);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 2. Update Balance of One User [Only by Admin] [/apis/balance/update/user/:user]
router.post('/update/user', util.checkAdmin, function (request, response) {
    var data = request.body ? request.body : undefined;
    var message = null;
    try {
        if (!data || !data.amount || !data.user) {
            message = "Provide UserId and Amount";
            throw message;
        }

        message = "Please provide a valid number";
        data.amount = util.checkInteger(data.amount, message);

        if (data.amount <= 0) {
            message = "Please enter a valid non-zero amount.";
            throw message;
        }

        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("CALL BonusToUser(?, ?)", [ data.user, data.amount ], function(error, results) {
                    if(error) return callback(error);
                    else if(results[0][0].error) return callback(results[0][0].error);
                    else return callback(null, results[0][0]);
                });
            }
        ], connection, function(error, user) {
            if(error) return response.status(500).send("Error occurred while giving bonus to the user: " + error);
            else return response.status(200).send("BONUS [ " + data.amount + " ] given to user [ " + user.name + " ].");
        });
    } catch (exception) {
        if(exception !== message) {
            console.log("Error occurred while giving bonus to single user: " + exception);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 3. Transfer Funds [/apis/balance/transfer]
router.post('/transfer', util.checkActiveUser, function (request, response) {
    var data = request.body ? request.body : undefined;
    var message = null;
    try {
        if(request.user.transfer !== "enabled") {
            message = "Transfers not allowed.";
            throw message;
        }

        if (!data || !data.to || !data.amount || !Number.isInteger(data.amount)) {
            message = "Please provide appropriate data";
            throw message;
        }

        message = "Please provide a valid number";
        data.amount = util.checkInteger(data.amount, message);

        if (data.amount < 1000) {
            message = "Please enter a valid amount: Non-Zero and Amount should be at least 1000.";
            throw message;
        }

        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("CALL Transfer(?, ?, ?)", [ request.user.id, data.to, data.amount ], function(error, results) {
                    if(error) return callback(error);
                    else {
                      if(results[0][0] && !results[0][0].error) return callback(null, results[0][0]);
                      else {
                        if(results[0][0] && results[0][0].error) return callback(results[0][0].error);
                        else return callback("Unable to make the transfer");
                      }
                    }
                });
            }
        ], connection, function(error, to) {
            if(error) return response.status(500).send("Error while transferring amount: " + error);
            else return response.status(200).send("TRANSFER [ " + data.amount + " ] to user [ " + to.name + " ] successful.");
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while transferring funds: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

module.exports = router;
