/*jslint node:true*/
'use strict';

var util = require('../core/util');
var mysql = require('../core/mysql');
var router = require('express').Router();

// User APIs
router.use('/user', require('./apis/user'));

// Team APIs
router.use('/team', require('./apis/team'));

// Player APIs
router.use('/player', require('./apis/player'));

// Match APIs
router.use('/match', require('./apis/match'));

// Pot APIs
router.use('/pot', require('./apis/pot'));

// Bet APIs
router.use('/bet', require('./apis/bet'));

// Balance APIs
router.use('/balance', require('./apis/balance'));

// Admin APIs
router.post('/admin/disable-transfer', util.checkAdmin, function(request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("UPDATE `configuration` SET `value` = 'disabled' WHERE `key` = 'transfers'", callback);
            }
        ], connection, function(error) {
            if(error) return response.status(500).send("Error while disabling transfer.");
            return response.status(200).send("Transfers disabled.");
        });
    } catch(error) {
        console.log("Error while disabling transfer option: " + error);
        console.log("Error Stack Trace: " + error.stack);
        return response.status(500).send("Error while disabling transfer.");
    }
});

router.post('/admin/enable-transfer', util.checkAdmin, function(request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("UPDATE `configuration` SET `value` = 'enabled' WHERE `key` = 'transfers'", callback);
            }
        ], connection, function(error) {
            if(error) return response.status(500).send("Error while enabling transfer.");
            return response.status(200).send("Transfers enabled.");
        });
    } catch(error) {
        console.log("Error while enabling transfer option: " + error);
        console.log("Error Stack Trace: " + error.stack);
        return response.status(500).send("Error while enabling transfer.");
    }
});

router.get('/transfer-allowed', util.checkActiveUser, function(request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT `value` FROM `configuration` WHERE `key` = 'transfers' AND `value` = 'enabled'", callback);
            }
        ], connection, function(error, results) {
            if(error) return response.status(500).send("Error while enabling transfer.");
            return response.status(200).send(results.length > 0);
        });
    } catch(error) {
        console.log("Error while enabling transfer option: " + error);
        console.log("Error Stack Trace: " + error.stack);
        return response.status(500).send("Error while enabling transfer.");
    }
});

module.exports = router;