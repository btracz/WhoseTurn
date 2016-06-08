var express = require('express');
var router = express.Router();
var planning = require("../src/planning.js");
var mailer = require("../src/mailer");

/* GET home page. */
router.get('/', function(req, res, next) {
    var model = {};
    var planData = planning.actualAndNextDeliverer();
    model.actualDeliverer = planData[0];
    model.deliverers = planning.getPlanning();
    model.deliverers.forEach(function (deliverer) {
        if (deliverer.date === planData[1].date) {
            deliverer.next = true;
        }
    });
    res.render('index', {title : "A qui le tour ?", model : model});
});

router.get('/test-mail', function(req, res, next) {
    mailer.sendWeeklyNotification().then(function(value){
        res.status(200).send(value);
    }, function(reason){
        res.status(500).send(reason);
    });
});

module.exports = router;
