/**
 * Created by Benjamin on 05/06/2016.
 */
var fs = require('fs');
var configFile = './config.json';

module.exports = {
    getFullConfig: getFullConfig,
    mailSender: getMailSender,
    mailServer: getMailServer
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