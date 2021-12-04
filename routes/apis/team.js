/*jslint node:true*/
'use strict';

var util = require('../../core/util');
var mysql = require('../../core/mysql');
var router = require('express').Router();

// 1. List of All Teams [/apis/team/all]
router.get('/all', function (request, response) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT t.`id`, t.`name`, t.`positionLastYear`, t.`titles`, t.`id` AS shortName, p.`name` AS captain FROM `team` t, `player` p WHERE p.`id` IN ( SELECT MIN(pl.`id`) FROM `player` pl WHERE pl.`team` = t.`id` )", callback);
            }
        ], connection, function(error, teams) {
            if(error) return response.status(500).send("Unable to get teams.");
            return response.status(200).send(JSON.stringify(teams));
        });
    } catch(exception) {
        console.log("Error occurred while fetching all teams: " + exception);
        console.log("Error Stack Trace: " + exception.stack);
        return response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

// 2. List of Teams involved in a match [/apis/team/match/:matchId]
router.get('/match/:matchId', function(request, response) {
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
                connection.query("SELECT m.`homeTeam` AS htsn, t1.`name` AS htn, m.`awayTeam` AS atsn, t2.`name` AS atn FROM `match` m, `team` t1, `team` t2 WHERE m.`homeTeam` = t1.`id` AND m.`awayTeam` = t2.`id` AND m.`id` = ?", matchId, callback);
            },
            function(matches) {
                var callback = arguments[arguments.length-1];
                callback(null, [
                    { id: matches[0].htsn, name: matches[0].htn },
                    { id: matches[0].atsn, name: matches[0].atn }
                ]);
            }
        ], connection, function(error, teams) {
            if(error) return response.status(500).send("Unable to get teams.");
            return response.status(200).send(JSON.stringify(teams));
        });
    } catch(exception) {
        if(exception !== message) {
            console.log("Error occurred while fetching teams involved in a match: " + exception);
            console.log("Error Stack Trace: " + exception.stack);
            exception = "Unknown Error Occurred. Contact Technical Administrator.";
        }
        return response.status(500).send(exception);
    }
});

module.exports = router;