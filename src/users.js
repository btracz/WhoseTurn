/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require('fs');
var config = require("./config");
var path = require("path");
var _ = require("underscore");
var userFile =  path.join(__dirname, "../data/users.json");

module.exports = {
    getUsers: getUsers,
    getSubscribers: getSubscribers,
    getSubscribersMails: getSubscribersMails,
    getUser: getUser,
    getUserMail: getUserMail,
    getAvatar: getAvatar,
    addUser: addUser,
    updateUsers: updateUsers,
    updateUser: updateUser,
    refreshUsersCache: refreshUsersCache
};

var usersCache;

function getUsers() {
    if (usersCache) {
        return usersCache;
    } else {
        refreshUsersCache();
        return usersCache;
    }
}

function refreshUsersCache() {
    var users = JSON.parse(fs.readFileSync(userFile, 'utf8'));
    users.forEach(function (user) {
        user.avatar = getAvatar(user.id);
    });
    usersCache = users;
}

function saveUsers(users) {
    var usersToSave = [];

    users.forEach(function (user) {
        usersToSave.push(_.omit(user, 'avatar'));
    });

    fs.writeFileSync(userFile, JSON.stringify(usersToSave, null, 2), 'utf8');
    refreshUsersCache();
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

function getUserMail(id) {
    var user = getUser(id);
    if (user && user.isExternal) {
        return config.externalMailFormat().replace("{0}", user.id);
    } else if (user) {
        return config.mailFormat().replace("{0}", user.id);
    }

    return '';
}

function getUserIndex(id) {
    var users = getUsers();
    var userIndex = -1;
    var matchingUsers = users.filter(function (item, index) {
        if (item.id == id) {
            userIndex = index;
        }
        return item.id == id;
    });

    if (matchingUsers.length >= 1) {
        return userIndex;
    } else {
        console.log('Aucun utilisateur correspondant à ' + id);
        return userIndex;
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

function addUser(user) {
    var users = getUsers();
    var index = getUserIndex(user.id);
    if (index == -1) {
        users.push(user);
        saveUsers(users);
    }
}

function updateUsers(data) {
    var users = getUsers();
    data.forEach(function (user) {
        var index = getUserIndex(user.id);
        if (index > -1) {
            users[index].name = user.name;
            users[index].hasSubscribe = user.hasSubscribe;
            users[index].isExternal = user.isExternal;
        } else {
            users.push({
                "id": user.id,
                "name": user.name,
                "hasSubscribe": user.hasSubscribe,
                "isExternal": user.isExternal
            });
        }

    });
    saveUsers(users);
    return users;
}

function updateUser(data) {
    var users = getUsers();
    var index = getUserIndex(data.id);
    if (index > -1) {
        users[index].name = data.name;
        users[index].hasSubscribe = data.hasSubscribe;
        users[index].isExternal = data.isExternal;
        saveUsers(users);
    }
}