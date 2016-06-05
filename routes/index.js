var express = require('express');
var router = express.Router();
var planning = require("../src/planning.js");
var mailer = require("../src/mailer");

/* GET home page. */
router.get('/', function(req, res, next) {
    var planData = planning.actualAndNextDeliverer();
    console.log(planData);
    res.render('index', {title : "A qui le tour ?", model : planData});
});

router.get('/test-mail', function(req, res, next) {
    var result = mailer.sendWeeklyNotification();
    res.send(200, result);
});

module.exports = router;
