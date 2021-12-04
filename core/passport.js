/*jslint node:true*/

var mailer = require('./mailer');
var configuration = require('./auth');
var mysql = require('./mysql');

var adminEmail = "deepak.kn@sap.com";

var Strategy = {
    Google   : require('passport-google-oauth').OAuth2Strategy,
    Facebook : require('passport-facebook').Strategy,
    Twitter  : require('passport-twitter').Strategy
};

function _createUserObject(id, name, email, image) {
    return {
        id        : id,
        name      : name,
        email     : email,
        image     : image ? image : "http://placehold.it/200x200",
        activateCode : Math.random().toString(36).slice(2)
    };
}

function checkUserExistOrAdd(user, done) {
    try {
        var connection = mysql.getConnection();
        mysql.transaction([
            function(callback) {
                connection.query("SELECT `id` FROM `user` WHERE `id` = ?", user.id, callback);
            },
            function(users) {
                var callback = arguments[arguments.length-1];
                if(users.length === 1) return callback(null, true, users[0]);
                connection.query("INSERT INTO `user` (`id`, `name`, `email`, `photoURL`, `activateCode`) VALUES (?, ?, ?, ?, ?)",
                                [ user.id, user.name, user.email, user.image, user.activateCode ], callback);
            },
            function(isUser, foundUser) {
                var callback = arguments[arguments.length-1];
                if(isUser === true) return callback(null, isUser, foundUser);
                return callback(null, false, user);
            }
        ], connection, function(error, foundUser, user) {
            if(error) return done(error);
            else {
                if(foundUser === false) {
                    mailer.mail(adminEmail, 'Activate User: ' + user.name,
                                'Activate User: <a href="iplbet.herokuapp.com/apis/user/activate/' + user.id + '/' + user.activateCode + '">' + user.name + '</a>');
                }
                return done(null, user);
            }
        });
    } catch(error) {
        console.log("Unknown Error Occurred while checking for user: " + error);
        console.log("Error Stack Trace: " + error.stack);
        done(error);
    }
}

module.exports = function(app, passport) {
    
    app.use(passport.initialize());
    
    app.use(passport.session());
    
    passport.serializeUser(function(user, done) {
        return done(null, user.id);
    });
    
    passport.deserializeUser(function(user, done) {
        try {
            var connection = mysql.getConnection();
            mysql.transaction([
                function(callback) {
                    connection.query("SELECT u.*, c.`value` AS transfer FROM `user` u, `configuration` c WHERE u.`id` = ? AND c.`key` = 'transfers'", user, callback);
                }
            ], connection, function(error, users) {
                if(error) return done(error);
                else return done(null, users[0]);
            });
        } catch(error) {
            console.log("Unknown Error while deserializing user: " + error);
            console.log("Error Stack Trace: " + error.stack);
            done(error);
        }
    });
    
    passport.use(new Strategy.Google({
        clientID     : configuration.google.clientID,
        clientSecret : configuration.google.clientSecret,
        callbackURL  : configuration.google.callbackURL
    }, function(token, refreshToken, user, done) {
        checkUserExistOrAdd(_createUserObject(user.id, user.displayName, user.emails[0].value, user.photos[0].value), done);
    }));
    
    passport.use(new Strategy.Facebook({
        clientID      : configuration.facebook.clientID,
        clientSecret  : configuration.facebook.clientSecret,
        callbackURL   : configuration.facebook.callbackURL,
        profileFields : [ 'id', 'emails', 'name', 'displayName', 'gender', 'photos' ]
    }, function(token, refreshToken, user, done) {
        checkUserExistOrAdd(_createUserObject(user.id, user.displayName, user.emails[0].value, user.photos[0].value), done);
    }));
    
    passport.use(new Strategy.Twitter({
        consumerKey    : configuration.twitter.consumerKey,
        consumerSecret : configuration.twitter.consumerSecret,
        callbackURL    : configuration.twitter.callbackURL,
        includeEmail   : true
    }, function(token, tokenSecret, user, done) {
        checkUserExistOrAdd(_createUserObject(user.id, user.displayName, user.emails[0].value, user.photos[0].value), done);
    }));
    
    var redirect = {
        successRedirect: '/users',
        failureRedirect: '/error'
    };
    
    var redirectIfAuthenticated = function(request, response, next) {
        if(request.isAuthenticated()) response.redirect(redirect.successRedirect);
        else return next();
    };
    
    // Google Authentication Route & Callback
    
    app.get('/auth/google', redirectIfAuthenticated, passport.authenticate('google', { scope: ['profile', 'email'] }));
    
    app.get('/auth/google/callback', passport.authenticate('google', redirect));
    
    // Facebook Authentication Route & Callback
    
    app.get('/auth/facebook', redirectIfAuthenticated, passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
    
    app.get('/auth/facebook/callback', passport.authenticate('facebook', redirect));
    
    // Twitter Authentication Route & Callback
    
    app.get('/auth/twitter', redirectIfAuthenticated, passport.authenticate('twitter'));
    
    app.get('/auth/twitter/callback', passport.authenticate('twitter', redirect));
    
    app.get('/logout', function(request, response) {
        request.logout();
        response.redirect('/');
    });
    
};