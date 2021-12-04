/*jslint node:true*/
'use strict';

var util = require('../../core/util');
var mysql = require('../../core/mysql');
var router = require('express').Router();

// 1. List of all the players [/apis/player/all]
router.get('/all', function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT * FROM `player`", callback);
            }
        ], connection, function(error, players) {
            if(error) return response.status(500).send("Unable to fetch players.");
            return response.status(200).send(JSON.stringify(players));
        });
    } catch(exception) {
        console.log("Error occurred while fetching all players: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 2. List of all the players in a team [/apis/player/team/:team]
router.get('/team/:team', function (request, response) {
    var message = null;
    try {
        var team = request.params.team;
        if (!team) {
            message = "Provide Team Short Name";
            throw message;
        }
        
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT * FROM `player` WHERE `team` = ?", team, callback);
            }
        ], connection, function(error, players) {
            if(error) return response.status(500).send("Unable to fetch players.");
            return response.status(200).send(JSON.stringify(players));
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while fetching all players in a team: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

// 3. List of all the players in a match [/apis/player/match/:matchId]
router.get('/match/:matchId', function (request, response) {
    var message = null;
    try {
        var matchId = request.params.matchId;
        if (!matchId) {
            message = "Please provide Match ID";
            throw message;
        }
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT p.* FROM `player` p, `match` m WHERE (p.`team` = m.`homeTeam` OR p.`team` = m.`awayTeam`) AND m.`id` = ?", matchId, callback);
            }
        ], connection, function(error, players) {
            if(error) return response.status(500).send("Unable to fetch players.");
            return response.status(200).send(JSON.stringify(players));
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while fetching all players from a match: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

module.exports = router;