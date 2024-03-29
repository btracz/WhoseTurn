/**
 * Created by Benjamin on 05/06/2016.
 */
var fs = require("fs");
var path = require("path");
configFile = process.env.CONFIG_PATH || path.join(__dirname, "../config.json");

function getUserAdmin() {
  var config = getFullConfig();
  return config.userAdmin;
}

function getPasswordAdmin() {
  var config = getFullConfig();
  return config.passwordAdmin;
}

function getAppBaseURI() {
  var config = getFullConfig();
  return config.appBaseURI;
}

function getFullConfig() {
  return JSON.parse(fs.readFileSync(configFile, "utf8"));
}

function getMailSender() {
  var config = getFullConfig();
  return config.mailSender;
}

function getMailServer() {
  var config = getFullConfig();
  return config.mailServer;
}

function getWeeklyNotificationPattern() {
  var config = getFullConfig();
  return config.weeklyNotificationPattern;
}

function getPollStartPattern() {
  var config = getFullConfig();
  return config.pollStartPattern;
}

function getPollEndPattern() {
  var config = getFullConfig();
  return config.pollEndPattern;
}

function isCronModeOn() {
  var config = getFullConfig();
  return typeof config.cronModeOn === "boolean" ? config.cronModeOn : true;
}

function getDayOfOccurrence() {
  var config = getFullConfig();
  return config.dayOfOccurrence || 5;
}

module.exports = {
  getFullConfig,
  mailSender: getMailSender,
  mailServer: getMailServer,
  weeklyNotificationPattern: getWeeklyNotificationPattern,
  pollStartPattern: getPollStartPattern,
  pollEndPattern: getPollEndPattern,
  getAppBaseURI,
  getUserAdmin,
  getPasswordAdmin,
  isCronModeOn,
  getDayOfOccurrence,
};
