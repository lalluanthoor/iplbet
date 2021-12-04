/*jslint node:true*/
'use strict';

var util = require('../core/util');
var router = require('express').Router();

router.get('/', function (request, response) {
    try {
        response.render('pages/admin/index', {
            title: 'BettingBad : Admin Home',
            active: 'home',
            user: {
                name: request.user.name
            }
        });
    } catch(error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/admin/error');
    }
});

router.get('/users', function (request, response) {
    try {
        response.render('pages/admin/user', {
            title: 'BettingBad : User Management',
            active: 'users',
            user: {
                name: request.user.name
            }
        });
    } catch(error) {
        console.log("Error Stack Trace: " + error.stack);
        response.redirect('/admin/error');
    }
});

router.get('/pots', function (request, response) {
	try {
		response.render('pages/admin/pots', {
			title: 'BettingBad : Pot Management',
			active: 'pots',
			user: {
				name: request.user.name
			}
		});
	} catch(error) {
        console.log("Error Stack Trace: " + error.stack);
		response.redirect('/admin/error');
	}
});

router.get('/results', function (request, response) {
	try {
		response.render('pages/admin/result', {
			title: 'BettingBad : Publish Result',
			active: 'results',
			user: {
				name: request.user.name
			}
		});
	} catch(error) {
        console.log("Error Stack Trace: " + error.stack);
		response.redirect('/admin/error');
	}
});

router.get('/stats', function (request, response) {
	try {
		response.render('pages/admin/stats', {
			title: 'BettingBad : Betting Statistics',
			active: 'stats',
			user: {
				name: request.user.name
			}
		});
	} catch(error) {
        console.log("Error Stack Trace: " + error.stack);
		response.redirect('/admin/error');
	}
});

router.get('/transfers', function (request, response) {
	try {
		response.render('pages/admin/transfer', {
			title: 'BettingBad : Transfer Configuration',
			active: 'transfers',
			user: {
				name: request.user.name
			}
		});
	} catch(error) {
        console.log("Error Stack Trace: " + error.stack);
		response.redirect('/admin/error');
	}
});

router.get('/error', function(request, response) {
    try {
        response.render('pages/admin/error', {
            title: 'Error',
            active: '',
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

router.get('/rank', function(request, response) {
    try {
        response.render('pages/admin/rank', {
            title: 'Rank List',
            active: 'rank',
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

module.exports = router;