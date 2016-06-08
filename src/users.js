/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require('fs');
var config = require("./config");
var path = require("path");
var userFile = './data/users.json';

module.exports = {
    getUsers: getUsers,
    getSubscribers: getSubscribers,
    getSubscribersMails: getSubscribersMails,
    getUser: getUser,
    getAvatar: getAvatar
};

function getUsers() {
    var users = JSON.parse(fs.readFileSync(userFile, 'utf8'));
    users.forEach(function (user) {
        user.avatar = getAvatar(user.id);
    });

    return users;
}

function getSubscribers() {
    var users = getUsers();

    return users.filter(function (item) {
        return item.hasSubscribe;
    });
}

function getSubscribersMails() {
    var mails = [];
    var subscribers = getSubscribers();

    subscribers.forEach(function (item) {
        if (item && item.email) {
            mails.push(item.email);
        } else if (item && item.isExternal) {
            mails.push(config.externalMailFormat().replace("{0}", item.id));
        } else if (item) {
            mails.push(config.mailFormat().replace("{0}", item.id));
        }
    });

    return mails;
}

function getUser(id) {
    var users = getUsers();

    var matchingUsers = users.filter(function (item) {
        return item.id == id;
    });

    if (matchingUsers.length >= 1) {
        return matchingUsers[0];
    } else {
        console.log('Aucun utilisateur correspondant à ' + id);
        return {"name": id};
    }
}

function getAvatar(id) {
    var imagepath = path.join(__dirname, '../public/images/' + id + '.jpg');
    try {
        var stats = fs.statSync(imagepath);
        if (stats.isFile()) {
            // si le fichier existe le lien est bon
            return '/images/' + id + '.jpg';
        }
    } catch (e) {
        // fichier inexistant
    }

    return '/images/inconnu.jpg';
}