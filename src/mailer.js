var Q = require("q");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var config = require("./config");
var planning = require("./planning");
var users = require("./users");

// A mettre en config
var smtpClient = nodemailer.createTransport(smtpTransport(config.mailServer()));

module.exports = {
    sendWeeklyNotification: sendWeeklyNotification
};

/**
 * Envoie la notification de prochain livreur aux abonnés
 */
function sendWeeklyNotification() {
    var deferred = Q.defer();

    var nextDeliveries = planning.actualAndNextDeliverer();
    var notification = new EmailTemplate(path.join(__dirname, '../mails/weeklyNotification'));
    notification.render({deliveries: nextDeliveries}, function (err, result) {
        if (err) {
            console.log("Erreur lors de l'envoi de la notification hebdomadaire, raison : " + err);
            deferred.reject(err);
        } else {
            // bouchon pour les tests
            //var mails = users.getSubscribersMails();
            var mails = [""];
            sendMail(mails,
                "Rappels petits pains",
                result.html).then(function(result){
                    deferred.resolve(result);
                }).catch(function(error){
                    deferred.reject(error);
                });
        }
    });

    return deferred.promise;
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
