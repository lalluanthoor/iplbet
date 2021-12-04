/*jslint node:true*/
'use strict';

var util = require('../core/util');
var router = require('express').Router();

// Various Routes
var iplRoutes = require('./ipl');
var apiRoutes = require('./apis');
var userRoutes = require('./user');
var adminRoutes = require('./admin');

router.get('/', function (request, response) {
    try {
        if (request.isAuthenticated()) response.redirect('/users');
        else {
            response.render('pages/index', {
                title: 'BettingBad : Home',
                active: 'home'
            });
        }
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/error');
    }
});

router.get('/privacy', function (request, response) {
    response.status(200).send("Privacy Policy");
});

router.get('/terms', function (request, response) {
    response.status(200).send("Terms and Conditions");
});

router.get('/fixtures', function (request, response) {
    try {
        response.render('pages/fixtures', {
            title: 'BettingBad : Fixtures',
            active: 'fixtures'
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/error');
    }
});

router.get('/rules', function (request, response) {
    try {
        response.render('pages/rules', {
            title: 'BettingBad : Rules',
            active: 'rules'
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/error');
    }
});

router.get('/prizes', function (request, response) {
    try {
        response.render('pages/prizes', {
            title: 'BettingBad : Prizes',
            active: 'prizes'
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/error');
    }
});

router.get('/stats', function (request, response) {
    try {
        response.render('pages/stats', {
            title: 'BettingBad : Statistics',
            active: 'stats'
        });
    } catch (error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/error');
    }
});

router.get('/error', function (request, response) {
    try {
        response.render('pages/error', {
            title: 'Error',
            active: ''
        });
    } catch (error) {
        console.log("Unknown Error Occurred on error page: " + error);
        console.log("Error Stack Trace: " + error.stack);
        response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

router.get('/leaders', function (request, response) {
    try {
        response.render('pages/leader', {
            title: 'Leaderboard',
            active: 'leaders'
        });
    } catch (error) {
        console.log("Unknown Error Occurred on error page: " + error);
        console.log("Error Stack Trace: " + error.stack);
        response.status(500).send("Unknown Error Occurred. Contact Technical Administrator.");
    }
});

router.use('/ipl', iplRoutes);

router.use('/apis', apiRoutes);

router.use('/users', util.checkUser, userRoutes);

router.use('/admin', util.checkAdmin, adminRoutes);

module.exports = router;
