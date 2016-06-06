var express = require('express');
var userManager = require('../src/users');
var router = express.Router();

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
    res.send(200, 'Authenticated');
});

router.get('/users', auth, function (req, res){
    var users = userManager.getUsers();
    var subscribers = userManager.getSubscribers();
    res.status(200).send({ users: users, subscribers : subscribers});
});

module.exports = router;
