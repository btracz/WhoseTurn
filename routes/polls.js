/**
 * Created by Benjamin on 21/08/2016.
 */
var express = require('express');
var router = express.Router();
var mailer = require("../src/mailer");
var userManager = require('../src/users');
var planningManager = require('../src/planning');
var pollManager = require('../src/polling');
var _ = require("underscore");

// GET Create (tests uniquement)
router.get('/create', function (req, res) {
    var nextDeliv = planningManager.actualAndNextDeliverer()[0];
    var poll = pollManager.createPoll(nextDeliv, userManager.getSubscribers());
    res.send(JSON.stringify(poll));
});

// Renvoi du mail de sondage
router.get('/send/:guid', function (req, res) {
    try {
        var poll = pollManager.getOpenPoll();
        if(poll){
            var respond = _.findWhere(poll.respondents, {guid: req.params.guid});

            if(respond){
                mailer.sendPoll(respond, poll.date);
                res.status(200).end();
            } else {
                res.status(404).send("Pas de sondé trouvé");
            }
        } else {
            res.status(404).send("Pas de sondage ouvert");
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(JSON.stringify(err));
    }


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