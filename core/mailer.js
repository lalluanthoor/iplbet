/*jslint node:true*/

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'connectedhealthplatform@gmail.com',
        pass: 'Toor1234'
    }
});

module.exports.mail = function(to, subject, body) {
    try {
        transporter.sendMail({
            from: '"IPL Betting Bad" <connectedhealthplatform@gmail.com>',
            to: to,
            subject: subject,
            html: body
        }, (error, info) => {
            if(error) return console.log("Error while sending mail: " + error);
            console.log("Mail Sent To Admin");
        });
    } catch(error) {
        console.log("Error while sending mail: " + error);
        console.log("Error Stack Trace: " + error.stack);
    }
};