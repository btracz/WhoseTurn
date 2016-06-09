var express = require('express');
var userManager = require('../src/users');
var router = express.Router();
var mailer = require("../src/mailer");

/*Authentification*/
var basicAuth = require('basic-auth');
var auth = function (req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401);
    };

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    };

    if (user.name === 'admin' && user.pass === 'password') {
        return next();
    } else {
        return unauthorized(res);
    };
};

/* GET users listing. */
router.get('/', auth, function (req, res) {
    res.render('admin/index', {title : "Administration"});
});

router.get('/users', auth, function (req, res){
    var users = userManager.getUsers();
    res.render('admin/users', {title : "Gestion des utilisateurs", users: users});
});

router.get('/send-notification', function(req, res, next) {
    mailer.sendWeeklyNotification().then(function(value){
        res.status(200).send(value);
    }, function(reason){
        res.status(500).send(reason);
    });
});

module.exports = router;
