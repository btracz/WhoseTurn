var express = require('express');
var userManager = require('../src/users');
var planningManager = require('../src/planning');
var router = express.Router();
var mailer = require("../src/mailer");
var configFile = './config.json';
var fs = require('fs');

/*Authentification*/
var basicAuth = require('basic-auth');
var auth = function (req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401);
    }

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    }

    if (user.name === 'admin' && user.pass === 'password') {
        return next();
    } else {
        return unauthorized(res);
    }
};

/* GET users listing. */
router.get('/', auth, function (req, res) {
    res.render('admin/index', {title: "Administration"});
});

router.get('/users', auth, function (req, res) {
    var users = userManager.getUsers();
    res.render('admin/users', {title: "Gestion des utilisateurs", users: users});
});

router.post('/users', auth, function (req, res) {
    var users = req.body;
    userManager.updateUsers(users);
    res.status(200).send("ok");
});

router.post('/user', auth, function (req, res) {
    var newUser = req.body;
    userManager.addUser(newUser);
    res.status(200).send("ok");
});

router.get('/parameters', auth, function (req, res) {
    var config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    res.render('admin/parameters', {title: "Paramétrage de l'application", config: config});
});

router.post('/parameters', auth, function (req, res) {
    var data = req.body;
    var config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    config.mailSender = data.mailSender || "";
    config.mailServer.host = data.mailServer.host || "";
    config.mailServer.port = data.mailServer.port || "";
    config.mailServer.secure = data.mailServer.secure;
    config.mailServer.requireTLS = data.mailServer.requireTLS;
    config.mailServer.auth.user = data.mailServer.auth.user || "";
    config.mailServer.auth.pass = data.mailServer.auth.pass || "";
    config.weeklyNotificationPattern = data.weeklyNotificationPattern;
    fs.writeFileSync(configFile, JSON.stringify(config, null, 4), 'utf8');
    res.status(200).send("ok");
});

router.get('/planning', auth, function (req, res) {
    res.render('admin/planning', {planning: planningManager.getPlanning(), subscribers: userManager.getSubscribers()});
});

router.get('/send-notification', function (req, res) {
    mailer.sendWeeklyNotification().then(function (value) {
        res.status(200).send(value);
    }, function (reason) {
        res.status(500).send(reason);
    });
});

module.exports = router;
