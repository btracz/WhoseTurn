var express = require('express');
var router = express.Router();
var planning = require("../src/planning.js");

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
    console.log(req.body);
    res.render('index', {title : "A qui le tour ?", model : model});
});

module.exports = router;
