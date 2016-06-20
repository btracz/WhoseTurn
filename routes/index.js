var express = require('express');
var router = express.Router();
var planning = require("../src/planning.js");
var users = require("../src/users.js");

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

/* POST home page*/
router.post('/', function(req, res, next) {
    var model = {};
    users.getUsers().forEach(function (user) {
        if (user.id.indexOf(req.body.name) > -1){
            console.log('La date de cette livraison est :');
        }
    });

    res.render('index', {title : "A qui le tour ?", model : model});
});

module.exports = router;
