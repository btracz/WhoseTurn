/**
 * Created by Benjamin on 21/08/2016.
 */
var express = require('express');
var moment = require('moment');
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

// Renvoi du résultat
router.get('/send-result/:date*', function (req, res) {
    var date = req.params.date.substr(0, 2) + '/' + req.params.date.substr(2, 2) + '/' + req.params.date.substr(4, 4);
    try {
        mailer.sendPollResult(date).then(
            function(result){
                res.status(200).end();
            }).catch(
            function(err){
                res.status(500).send(JSON.stringify(err));
            }
        );
    } catch (err) {
        console.log(err);
        res.status(500).send(JSON.stringify(err));
    }
});


/* GET Consultation publique du sondage */
router.get('/:guid', function (req, res) {
    try {
        var poll = pollManager.getPollStatusByGuid(req.params.guid);
        poll.deliverer = userManager.getUser(poll.deliverer);

        poll.respondents.forEach(function (resp) {
            resp.name = userManager.getUser(resp.id).name;
            resp.dateText = resp.answerDate ? moment(resp.answerDate).tz("Europe/Paris").format("DD/MM/YYYY HH:mm:ss") : '-';
        });
        res.render('poll/status', {poll: poll});
    } catch (err){
        console.log(err);
        res.render('poll/status', {poll: null});
    }
});

/* GET Réponse au sondage */
router.get('/:guid/:answer', function (req, res) {
    console.log("Réponse sondage (GET) :", req.params.guid, req.params.answer);
    
    res.render('poll/form', { guid: req.params.guid, answer: req.params.answer });
});

router.post('/:guid/:answer', function (req, res) {
    console.log("Réponse sondage (POST) :", req.params.guid, req.body.answer);

    try {
        pollManager.setPollResponse(req.params.guid, req.body.answer);
        res.render('poll/answer', {title: "Merci !", success: true});
    } catch (err){
        console.log(err);
        res.render('poll/answer', {title: "Erreur !", success: false, reason: err});
    }
});

module.exports = router;