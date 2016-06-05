var express = require('express');
var userManager = require('../src/users');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {
    res.send(200, 'Authenticated');
});

router.get('/users', function (req, res){
    var users = userManager.getUsers();
    var subscribers = userManager.getSubscribers();
    res.status(200).send({ users: users, subscribers : subscribers});
});

module.exports = router;
