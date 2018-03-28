/*jslint node:true*/
'use strict';

var async = require('async');
var mysql = require('mysql');

var prod = true;

module.exports.config = {
    host: "sql12.freemysqlhosting.net",
    port: 3306,
    user: "sql12229323",
    password: "3E3MRnjVuZ",
    database: "sql12229323",
    timezone: "+0530",
    supportBigNumbers: true,
    expiration: (prod ? 10 : 60) * 60 * 1000,
    connectTimeout: (prod ? 1 : 10) * 60 * 1000,
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

module.exports.getConnection = function () {
    return mysql.createConnection(this.config);
};

module.exports.transaction = function waterfall(tasks, connection, callback) {
    try {
        connection.beginTransaction(function (error) {
            if (error) return callback(error);
            try {
                async.waterfall(tasks, function (error, results) {
                    if (error) {
                        if (error !== "Data Already Initialized") {
                            console.log("Error occurred: " + (typeof error === "object" ? JSON.stringify(error) : error));
                            console.log("Rolling back changes.");
                        }
                        connection.rollback(function () {
                            connection.end(function(error) {
                                if(error) console.log("Error while ending connection: " + error);
                            });
                            return callback(error);
                        });
                    } else {
                        var args = arguments;
                        connection.commit(function (error) {
                            if (error) {
                                console.log("Error while committing transaction: " + (typeof error === "object" ? JSON.stringify(error) : error));
                                console.log("Rolling back changes.");
                                connection.rollback(function () {
                                    connection.end(function(error) {
                                        if(error) console.log("Error while ending connection: " + error);
                                    });
                                    return callback(error);
                                });
                            } else {
                                connection.end(function(error) {
                                    if(error) console.log("Error while ending connection: " + error);
                                });
                                return callback.apply(null, args);
                            }
                        });
                    }
                });
            } catch (error) {
                console.log("Unknown Error Occurred: " + error);
                console.log("Error Stack Trace: " + error.stack);
            }
        });
    } catch (error) {
        console.log("Unknown Error Occurred: " + error);
        console.log("Error Stack Trace: " + error.stack);
    }
};

// mysql -h iplbet.cxsqpqjzmj8y.us-west-2.rds.amazonaws.com -P 3306 -D iplbet -u iplbet -p