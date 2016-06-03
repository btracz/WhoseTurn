var express = require('express');
var router = express.Router();
var planning = require("../src/planning.js");

/* GET home page. */
router.get('/', function(req, res, next) {
    var planData = planning.actualAndNextDeliverer();
    console.log(planData);
    res.render('index', {title : "A qui le tour ?", model : planData});
});

module.exports = router;
