/*jslint node:true*/
'use strict';

var moment = require('moment');

module.exports.checkUser = function (request, response, next) {
    if (request.isAuthenticated()) {
        if (request.user.admin) response.redirect('/admin');
        else return next();
    } else {
        response.redirect('/');
    }
};

module.exports.checkActiveUser = function (request, response, next) {
    if (request.isAuthenticated()) {
        if (!request.user.suspended) return next();
        else response.redirect('/users/error');
    } else {
        response.redirect('/');
    }
};

module.exports.checkAdmin = function (request, response, next) {
    if (request.isAuthenticated()) {
        if (request.user.admin) return next();
        else response.redirect('/users');
    } else {
        response.redirect('/');
    }
};

module.exports.checkInteger = function (integer, message) {
    try {
        return parseInt(integer, 10);
    } catch (error) {
        console.log("Check Integer Failed: " + error);
        console.log("Error Stack Trace" + error.stack);
        throw message;
    }
}

module.exports.getReadableFixture = function (date) {
    date = moment(date).utcOffset("+0530");
    return {
        date: date.format("DD-MMM-YYYY"),
        time: date.format("hh:mm:ss A")
    };
};

module.exports.getIPLDate = function (string) {
    var parts = string.toString().split(",");
    var dateParts = parts[0].split("/");
    var dateDD = dateParts[0] < 10 ? "0" + dateParts[0] : dateParts[0];
    var timeHour = parts[1] == 4 ? "16" : "20";
    return "2018-0" + dateParts[1] + "-" + dateDD + " " + timeHour + ":00:00";
};

module.exports.getSQLDate = function (date) {
    date = moment(date).utcOffset("+0530");
    return date.format("YYYY-MM-DD HH:mm:ss");
};


module.exports.istToUtc = function (date) {
    date = moment(date).utcOffset("-0530");
    return new Date(date.format("YYYY-MM-DD HH:mm:ss"));
};

module.exports.gcdArray = function (a) {
    var gcd = a[0];
    for (var i = 1; i < a.length; i++) {
        gcd = this.gcd(gcd, a[i]);
    }
    return gcd;
};

module.exports.gcd = function (a, b) {
    if (a === 0) return b;
    else return gcd(b % a, a);
};

module.exports.subtractDate = function (date, difference) {
    return new Date(date.getTime() - difference);
};
