/**
 * Created by Benjamin on 21/08/2016.
 */
var express = require('express');
var router = express.Router();
var mailer = require("../src/mailer");
var userManager = require('../src/users');
var planningManager = require('../src/planning');
var pollManager = require('../src/polling');

// GET Create (tests uniquement)
router.get('/create', function (req, res) {
    var nextDeliv = planningManager.actualAndNextDeliverer()[0];
    var poll = pollManager.createPoll(nextDeliv, userManager.getSubscribers());
    res.send(JSON.stringify(poll));
});

/* GET Réponse au sondage */
router.get('/:guid/:answer', function (req, res) {
    try {
        pollManager.setPollResponse(req.params.guid, req.params.answer);
        res.render('poll/answer', {title: "Merci !", success: true});
    } catch (err){
        console.log(err);
        res.render('poll/answer', {title: "Erreur !", success: false, reason: err});
    }
});

module.exports = router;