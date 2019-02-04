var Q = require("q");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var config = require("./config");
var planning = require("./planning");
var pollManager = require("./polling");
var scheduler = require("./scheduler");
var users = require("./users");
var later = require("later");
var moment = require("moment-timezone");
moment.locale('fr');
later.date.localTime();

// Création du client SMTP
var smtpClient = nodemailer.createTransport(smtpTransport(config.mailServer()));
var weeklyNotificationTaskName = "WeeklyNotification";
var startPollTaskName = "PollStart";
var endPollTaskName = "PollEnd";

module.exports = {
    sendWeeklyNotification: sendWeeklyNotification,
    startNotificationsScheduling: startNotificationsScheduling,
    refreshSMTPClientConfig: refreshSMTPClientConfig,
    refreshTaskPatterns: refreshTaskPatterns,
    sendPoll: sendPoll,
    sendPollResult: sendPollResult
};

/**
 * Démarrage de l'ordonnanceur pour les taches hebdomadaire.
 */
function startNotificationsScheduling() {
    console.log("lancement de l'ordonnanceur");
    scheduler.createJob(weeklyNotificationTaskName, config.weeklyNotificationPattern(), sendWeeklyNotification);
    scheduler.startTask(weeklyNotificationTaskName);
    scheduler.createJob(startPollTaskName, config.pollStartPattern(), createPoll);
    scheduler.startTask(startPollTaskName);
    scheduler.createJob(endPollTaskName, config.pollEndPattern(), endPoll);
    scheduler.startTask(endPollTaskName);
}

/**
 * Envoie la notification de prochain livreur aux abonnés
 */
function sendWeeklyNotification() {
    var deferred = Q.defer();
    var nextDeliveries = planning.actualAndNextDeliverer();
    var notification = new EmailTemplate(path.join(__dirname, '../mails/weeklyNotification'));
    notification.render({deliveries: nextDeliveries, appBaseURI: config.getAppBaseURI()}, function (err, result) {
        if (err) {
            console.log("Erreur lors de l'envoi de la notification hebdomadaire, raison : " + err);
            deferred.reject(err);
        } else {
            var mails = [""];

            if (process.env.NODE_ENV === "production") {
                mails = users.getSubscribersMails();
            }
            console.log("abonnés : " + mails.join(";"));

            sendMail(mails,
                "Rappels petits pains",
                result.html).then(function (result) {
                    console.log("Notification hebdomadaire réussie");
                    planning.createFollowingDelivery();
                    deferred.resolve(result);
                }).catch(function (error) {
                    console.log("Notification hebdomadaire échouée, raison : " + error);
                    deferred.reject(error);
                });
        }
    });

    return deferred.promise;
}

/**
 * Crée un nouveau sondage et envoie
 */
function createPoll() {
    var nextDeliv = planning.actualAndNextDeliverer()[0];
    var subscribers = users.getSubscribers();
    var poll = pollManager.createPoll(nextDeliv, subscribers);

    // boucle avec un délai de 10 sec entre chaque envoi de mail
    // afin de respecter un quota auprès du serveur mail
    (function sendingLoop (i) {
        setTimeout(function () {
            var respondent = poll.respondents[i-1];
            sendPoll(respondent, nextDeliv.date);
            if (--i) sendingLoop(i);
        }, 10000)
    })(poll.respondents.length);
}

function sendPoll(respondent, date) {
    var deferred = Q.defer();
    var recipient = users.getUserMail(respondent.id);
    var cron = later.parse.cron(config.pollEndPattern(), false);
    var pollClose = later.schedule(cron).next(1);
    var pollTemplate = new EmailTemplate(path.join(__dirname, '../mails/polling'));
    pollTemplate.render(
        {
            delivery: {
                dateText: moment(date, "DD/MM/YYYY").tz("Europe/Paris").format("dddd Do MMMM")
            },
            guid: respondent.guid,
            poll: {
                closingDateText: moment(pollClose).tz("Europe/Paris").format("dddd Do MMMM [à] H[h]mm")
            },
            appBaseURI: config.getAppBaseURI()
        },
        function (err, result) {
            if (err) {
                console.log("Erreur lors de la création du mail de sondage, raison : " + err);
                deferred.reject(err);
            } else {
                console.log("Corps du mail qui va être envoyé : \r\n" + result.html);
                sendMail(recipient,
                    "Sondage petits pains",
                    result.html).then(function (result) {
                        console.log("Sondage de " + respondent.id + " envoyé");
                        deferred.resolve(result);
                    }).catch(function (error) {
                        console.log("Sondage de " + respondent.id + " échoué, raison : " + error);
                        deferred.reject(error);
                    });
            }
        });

    return deferred.promise;
}

/**
 * Crée un nouveau sondage et envoie
 */
function endPoll() {
    var deferred = Q.defer();
    var nextDeliv = planning.actualAndNextDeliverer()[0];
    var poll = pollManager.closePoll(nextDeliv.date);
    sendPollResult(poll.date).then(function (result) {
        deferred.resolve(result);
    }).catch(function (error) {
        deferred.reject(error);
    });

    return deferred.promise;
}

function sendPollResult(date){
    var deferred = Q.defer();
    var poll = pollManager.getPollStatus(date);
    var recipient = users.getUserMail(poll.deliverer);
    var pollResultTemplate = new EmailTemplate(path.join(__dirname, '../mails/poll-result'));
    pollResultTemplate.render(
        {
            deliveryDateText: moment(date, "DD/MM/YYYY").tz("Europe/Paris").format("dddd Do MMMM"),
            presentCount: poll.status.presents,
            noResponseCount: poll.status.noResponse,
            absentCount: poll.status.absents
        },
        function (err, result) {
            if (err) {
                console.log("Erreur lors de la création du mail de résultat du sondage, raison : " + err);
                deferred.reject(err);
            } else {
                console.log("Corps du mail qui va être envoyé : \r\n" + result.html);
                sendMail(recipient,
                    "Résultat sondage petits pains",
                    result.html).then(function (result) {
                        console.log("Résultat du sondage du " + nextDeliv.date + " envoyé à " + recipient);
                        deferred.resolve(result);
                    }).catch(function (error) {
                        console.log("Résultat du sondage du " + nextDeliv.date + " échoué, raison : " + error);
                        deferred.reject(error);
                    });
            }
        });

    return deferred.promise;
}

/**
 * Recrée un client un SMTP à partir de la configuration
 */
function refreshSMTPClientConfig() {
    smtpClient = nodemailer.createTransport(smtpTransport(config.mailServer()));
}

/**
 * Met à jour les patterns de toutes les tâches
 */
function refreshTaskPatterns() {
    scheduler.updateTaskOnCronChange(weeklyNotificationTaskName, config.weeklyNotificationPattern());
    scheduler.updateTaskOnCronChange(startPollTaskName, config.pollStartPattern());
    scheduler.updateTaskOnCronChange(endPollTaskName, config.pollEndPattern());
}

/**
 * Envoie un mail via le serveur mail configuré
 * @param recipients Destinataire (string) ou tableau des destinataires (array de string)
 * @param subject
 * @param body
 */
function sendMail(recipients, subject, body) {
    var recipient = '';
    var deferred = Q.defer();

    if (Array.isArray(recipients)) {
        recipients.forEach(function (item) {
            recipient += item + ";";
        });
        recipient = recipient.slice(0, -1);
    } else {
        recipient = recipients;
    }
    var mailOpts = {
        to: recipient,
        from: config.mailSender(),
        subject: subject,
        html: body
    };

    smtpClient.sendMail(mailOpts, function (error, response) {
        console.log("Réponse envoi : ");
        console.log(response);
        //Email not sent
        if (error) {
            // ajout d'une trace dans les logs
            console.log("Envoi lors de l'envoi du mail '" + subject + "' à " + recipients + ", détails : " + error.toString());

            deferred.reject(error);
        }

        deferred.resolve(response);
    });

    return deferred.promise;
}
