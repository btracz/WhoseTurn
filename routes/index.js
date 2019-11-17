var express = require('express');
var router = express.Router();
var planning = require("../src/planning.js");
//var userPlanning = require("../data/planning.json");
var users = require("../src/users.js");
var _ = require("underscore");
var moment = require("moment");

/* GET home page. */
router.get('/', function (req, res, next) {
    var model = {};
    var planData = planning.actualAndNextDeliverer();
    model.actualDeliverer = planData[0];
    model.deliverers = planning.getPlanning();
    model.deliverers.forEach(function (deliverer) {
        if (deliverer.date === planData[1].date) {
            deliverer.next = true;
        }
    });
    res.render('index', {title: "A qui le tour ?", model: model});
});

/* POST home page*/
router.post('/', function (req, res, next) {
    var model = {};
    users.getUsers().forEach(function (user) {
        if (user.id.indexOf(req.body.name) > -1) {
            console.log('La date de cette livraison est :');
        }
    });

    res.render('index', {title: "A qui le tour ?", model: model});
});

/* POST searchUser*/
router.post('/search', function (req, res, next) {
    var usersMatch = new Array();
    var reg = new RegExp(req.body.data, "i");
    var currentDate = moment(new Date);
    var theLastDate = _.last(planning.getPlanningOnly()).date;
    users.getUsers().forEach(function (user) {
        if (reg.test(user.id) && user.hasSubscribe == true) {
            user.date = (_.last(_.where(planning.getPlanningOnly(), {"deliverer": user.id})) || {}).date;
            var userDate = moment(user.date, "DD/MM/YYYY");
            if(!userDate.isValid() || userDate < currentDate){
                user.date = 'Prochaine livraison après le ' + theLastDate;
            }
            usersMatch.push(user);
        }
    });
    res.status(200).send(usersMatch);
});

module.exports = router;
