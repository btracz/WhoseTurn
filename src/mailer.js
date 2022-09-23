var Q = require("q");
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var EmailTemplate = require("email-templates");
var path = require("path");
var config = require("./config");
var planning = require("./planning");
var pollManager = require("./polling");
var scheduler = require("./scheduler");
var users = require("./users");
var later = require("later");
var moment = require("moment-timezone");
moment.locale("fr");
later.date.localTime();

// Création du client SMTP
var smtpClient = nodemailer.createTransport(smtpTransport(config.mailServer()));
var weeklyNotificationTaskName = "WeeklyNotification";
var startPollTaskName = "PollStart";
var endPollTaskName = "PollEnd";

const emailTemplates = new EmailTemplate({
  views: {
    options: {
      extension: "ejs",
    },
  },
});

module.exports = {
  sendWeeklyNotification: sendWeeklyNotification,
  startNotificationsScheduling: startNotificationsScheduling,
  refreshSMTPClientConfig: refreshSMTPClientConfig,
  refreshTaskPatterns: refreshTaskPatterns,
  sendPoll: sendPoll,
  sendPollResult: sendPollResult,
  createPoll: createPoll,
  endPoll: endPoll,
};

/**
 * Démarrage de l'ordonnanceur pour les taches hebdomadaire.
 */
function startNotificationsScheduling() {
  console.log("lancement de l'ordonnanceur");
  scheduler.createJob(
    weeklyNotificationTaskName,
    config.weeklyNotificationPattern(),
    sendWeeklyNotification
  );
  scheduler.createJob(startPollTaskName, config.pollStartPattern(), createPoll);
  scheduler.createJob(endPollTaskName, config.pollEndPattern(), endPoll);

  if (config.isCronModeOn()) {
    scheduler.startTask(startPollTaskName);
    scheduler.startTask(weeklyNotificationTaskName);
    scheduler.startTask(endPollTaskName);
  }
}

/**
 * Envoie la notification de prochain livreur aux abonnés
 */
function sendWeeklyNotification() {
  var deferred = Q.defer();
  var nextDeliveries = planning.actualAndNextDeliverer();

  emailTemplates
    .render(
      { path: "weeklyNotification/html" },
      { deliveries: nextDeliveries, appBaseURI: config.getAppBaseURI() }
    )
    .then(function (result) {
      var mails = [""];
      if (process.env.NODE_ENV === "production") {
        mails = users.getSubscribersMails();
        console.log("abonnés : " + mails.join(";"));
      } else {
        return deferred.resolve("Mode hors prod, mail non envoyé");
      }

      sendMail(mails, "Rappels petits pains", result)
        .then(function (sendResult) {
          console.log("Notification hebdomadaire réussie");
          planning.createFollowingDelivery();
          deferred.resolve("Succès (" + JSON.stringify(sendResult) + ")");
        })
        .catch(function (error) {
          console.log("Notification hebdomadaire échouée, raison : " + error);
          deferred.reject(error);
        });
    })
    .catch(function (err) {
      console.log(
        "Erreur lors de l'envoi de la notification hebdomadaire, raison : " +
          err
      );
      deferred.reject(err);
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
  (function sendingLoop(i) {
    setTimeout(function () {
      var respondent = poll.respondents[i - 1];
      sendPoll(respondent, nextDeliv.date);
      if (--i) sendingLoop(i);
    }, 10000);
  })(poll.respondents.length);

  sendPollStart(poll);
}

function sendPoll(respondent, date) {
  var deferred = Q.defer();
  var recipient = respondent.id; // id is mail
  var cron = later.parse.cron(config.pollEndPattern(), false);
  var pollClose = later.schedule(cron).next(1);
  emailTemplates
    .render(
      { path: "polling/html" },
      {
        delivery: {
          dateText: moment(date, "DD/MM/YYYY")
            .tz("Europe/Paris")
            .format("dddd Do MMMM"),
        },
        guid: respondent.guid,
        poll: {
          closingDateText: moment(pollClose)
            .tz("Europe/Paris")
            .format("dddd Do MMMM [à] H[h]mm"),
        },
        appBaseURI: config.getAppBaseURI(),
      }
    )
    .then(function (result) {
      console.log("Corps du mail qui va être envoyé : \r\n" + result);
      sendMail(recipient, "Sondage petits pains", result)
        .then(function (sendResult) {
          console.log("Sondage de " + respondent.id + " envoyé");
          deferred.resolve(sendResult);
        })
        .catch(function (error) {
          console.log(
            "Sondage de " + respondent.id + " échoué, raison : " + error
          );
          deferred.reject(error);
        });
    })
    .catch(function (err) {
      console.log(
        "Erreur lors de la création du mail de sondage, raison : " + err
      );
      deferred.reject(err);
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
  sendPollResult(poll.date)
    .then(function (result) {
      deferred.resolve(result);
    })
    .catch(function (error) {
      deferred.reject(error);
    });

  return deferred.promise;
}

function sendPollResult(date) {
  var deferred = Q.defer();
  var poll = pollManager.getPollStatus(date);
  var recipient = poll.deliverer; // id is mail
  emailTemplates.render(
    { path: "poll-result/html" },
    {
      deliveryDateText: moment(date, "DD/MM/YYYY")
        .tz("Europe/Paris")
        .format("dddd Do MMMM"),
      presentCount: poll.status.presents,
      noResponseCount: poll.status.noResponse,
      absentCount: poll.status.absents,
    })
    .then(function (result) {
      console.log("Corps du mail qui va être envoyé : \r\n" + result);
      sendMail(recipient, "Résultat sondage petits pains", result)
        .then(function (sendResult) {
          console.log(
            `Résultat du sondage du ${poll.date} envoyé à ${recipient}`
          );
          deferred.resolve(sendResult);
        })
        .catch(function (error) {
          console.log(
            `Résultat du sondage du ${poll.date} échoué, raison : `,
            error
          );
          deferred.reject(error);
        });
    })
    .catch(function (err) {
      console.log(
        "Erreur lors de la création du mail de résultat du sondage, raison :",
        err
      );
      deferred.reject(err);
    });

  return deferred.promise;
}

function sendPollStart(poll) {
  var deferred = Q.defer();
  var recipient = poll.deliverer; // id is mail
  emailTemplates.render(    
    { path: "poll-watch/html" },
    {
      deliveryDateText: moment(poll.date, "DD/MM/YYYY")
        .tz("Europe/Paris")
        .format("dddd Do MMMM"),
      pollAddress: config.getAppBaseURI() + "/polls/" + poll.guid,
    })
    .then(function (result) {
      console.log("Corps du mail qui va être envoyé : \r\n" + result);
      sendMail(recipient, "Petits Pains, à votre tour !", result)
        .then(function (sendResult) {
          console.log(
            "Mail de consultation du sondage du " +
              poll.date +
              " envoyé à " +
              recipient
          );
          deferred.resolve(sendResult);
        })
        .catch(function (error) {
          console.log(
            "Mail de consultation du sondage du " +
              poll.date +
              " échoué, raison : " +
              error
          );
          deferred.reject(error);
        });
    })
    .catch(function (err) {
      console.log(
        "Erreur lors de la création du mail de consultation du sondage, raison : " +
          err
      );
      deferred.reject(err);
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
  scheduler.updateTaskOnCronChange(
    weeklyNotificationTaskName,
    config.weeklyNotificationPattern()
  );
  scheduler.updateTaskOnCronChange(
    startPollTaskName,
    config.pollStartPattern()
  );
  scheduler.updateTaskOnCronChange(endPollTaskName, config.pollEndPattern());
}

/**
 * Envoie un mail via le serveur mail configuré
 * @param recipients Destinataire (string) ou tableau des destinataires (array de string)
 * @param subject
 * @param body
 */
function sendMail(recipients, subject, body) {
  var recipient = "";
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
    html: body,
  };

  smtpClient.sendMail(mailOpts, function (error, response) {
    console.log("Réponse envoi : ");
    console.log(response);
    //Email not sent
    if (error) {
      // ajout d'une trace dans les logs
      console.log(
        "Envoi lors de l'envoi du mail '" +
          subject +
          "' à " +
          recipients +
          ", détails : ",
        error
      );

      deferred.reject(error);
    }

    deferred.resolve(response);
  });

  return deferred.promise;
}
