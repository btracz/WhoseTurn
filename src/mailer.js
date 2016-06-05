var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

// A mettre en config
var smtpClient = nodemailer.createTransport(smtpTransport({
    host: '',
    port: 25,
    secure: false, // use SSL
    auth: {
        user: "",
        pass: ""
    },
    tls: {
        rejectUnauthorized: false
    }
}));

module.exports = {
    sendWeeklyNotification: sendWeeklyNotification
};

/**
 * Envoie la notification de prochain livreur aux abonn�s
 */
function sendWeeklyNotification(){
    return sendMail("toto@yopmail.com", "Test", "<body>Miam des petits pains !</body>");
}

/**
 * Envoie un mail via le serveur mail configur�
 * @param recipients Destinataire (string) ou tableau des destinataires (array de string)
 * @param subject
 * @param body
 */
function sendMail(recipients, subject, body){
    var recipient = '';

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
        from: "no-reply@",
        subject: subject,
        html: body
    };

    return smtpClient.sendMail(mailOpts, function (error, response) {
        console.log("Réponse envoi : ");
        console.log(response);
        //Email not sent
        if (error) {
            // ajout d'une trace dans les logs
            console.log("Envoi lors de l'envoi du mail '" + subject + "' à " + recipients + ", détails : " + error.toString() + " , stack : " + error.stack());
            return false;
        }

        return true;
    });
}
