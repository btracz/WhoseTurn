var Q = require("q");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var config = require("./config");

// A mettre en config
var smtpClient = nodemailer.createTransport(smtpTransport(config.mailServer()));

module.exports = {
    sendWeeklyNotification: sendWeeklyNotification
};

/**
 * Envoie la notification de prochain livreur aux abonnés
 */
function sendWeeklyNotification(){
    return sendMail("", "Test", "<body>Miam des petits pains !</body>");
}

/**
 * Envoie un mail via le serveur mail configuré
 * @param recipients Destinataire (string) ou tableau des destinataires (array de string)
 * @param subject
 * @param body
 */
function sendMail(recipients, subject, body){
    var recipient = '';
    var deferred = Q.defer();

    if(Array.isArray(recipients)){
        recipients.forEach(function(item){
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
