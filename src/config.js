/**
 * Created by Benjamin on 05/06/2016.
 */
var fs = require('fs');
var path = require('path');
configFile = path.join(__dirname, '../config.json');

module.exports = {
    getFullConfig: getFullConfig,
    mailSender: getMailSender,
    mailServer: getMailServer,
    weeklyNotificationPattern: getWeeklyNotificationPattern,
    mailFormat: getMailFormat,
    externalMailFormat: getExternalMailFormat
};

function getFullConfig() {
    return JSON.parse(fs.readFileSync(configFile, 'utf8'));
}

function getMailSender() {
    var config = getFullConfig();
    return config.mailSender;
}

function getMailServer(){
    var config = getFullConfig();
    return config.mailServer;
}

function getWeeklyNotificationPattern(){
    var config = getFullConfig();
    return config.weeklyNotificationPattern;
}

function getMailFormat(){
    var config = getFullConfig();
    return config.mailFormat;
}

function getExternalMailFormat(){
    var config = getFullConfig();
    return config.externalMailFormat;
}