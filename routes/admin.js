var express = require('express');
var userManager = require('../src/users');
var planningManager = require('../src/planning');
var pollManager = require('../src/polling');
var router = express.Router();
var mailer = require("../src/mailer");
var formidable = require('formidable');
var configFile = './config.json';
var fs = require('fs');
var path = require('path');
var moment = require('moment-timezone');
moment.locale('fr');

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

router.put('/user', auth, function (req, res) {
    var user = req.body;
    userManager.updateUser(user);
    res.status(200).send("ok");
});

router.post('/avatar/:login', auth, function (req, res) {
    var login = req.params.login;
    console.log('Upload de l\'avatar de ' + login);
    // create an incoming form object
    var form = new formidable.IncomingForm();
    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;
    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '../public/images/');
    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function (field, file) {
        fs.rename(file.path, path.join(form.uploadDir, login + '.jpg'));
    });

    // log any errors that occur
    form.on('error', function (err) {
        console.log('Erreur : \n' + err);
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function () {
        userManager.refreshUsersCache();
        res.end('success');
    });

    // parse the incoming request containing the form data
    form.parse(req);
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
    mailer.refreshSMTPClientConfig();
    mailer.refreshTaskPatterns();
    res.status(200).send("ok");
});

router.get('/planning', auth, function (req, res) {
    res.render('admin/planning', {
        planning: planningManager.getPlanning(),
        subscribers: userManager.getSubscribers(),
        followingDeliverer: planningManager.getFollowingDeliverer(),
        followingDeliveryDate: planningManager.getFollowingDeliveryDate()
    });
});

router.get('/poll', auth, function (req, res) {
    var respondents;
    var presCount = 0;
    var absCount = 0;
    var noRespCount = 0;

    var openedPoll = pollManager.getOpenPoll();
    if (openedPoll) {
        respondents = [];
        openedPoll.respondents.forEach(function (resp) {
            respondents.push({
                name: userManager.getUser(resp.id).name,
                status: resp.status,
                dateText: resp.answerDate ? moment(resp.answerDate).tz("Europe/Paris").format("DD/MM/YYYY HH:mm:ss") : '-'
            });
        });

        // Calcul résultats
        var presents = openedPoll.respondents.filter(function (resp) {
            return resp.status === true;
        });
        presCount = presents ? presents.length : 0;

        var absents = openedPoll.respondents.filter(function (resp) {
            return resp.status === false;
        });
        absCount = absents ? absents.length : 0;
        noRespCount = openedPoll.respondents.length - presCount - absCount;
    }
    res.render('admin/poll', {
        respondents: respondents,
        presentCount: presCount,
        noResponseCount: noRespCount,
        absentCount: absCount
    });
});

router.post('/planning/update', auth, function (req, res) {
    try {
        planningManager.updatePlanning(req.body);
        res.status(200).send("ok");
    } catch (ex) {
        console.log(ex.stack);
        res.status(500).send(ex.stack);
    }
});

router.get('/send-notification', function (req, res) {
    mailer.sendWeeklyNotification().then(function (value) {
        res.status(200).send(value);
    }, function (reason) {
        res.status(500).send(reason);
    });
});

module.exports = router;
