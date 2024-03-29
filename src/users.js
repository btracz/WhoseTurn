/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require("fs");
var config = require("./config");
var path = require("path");
var _ = require("underscore");
const { testFileExists } = require("./utils");
var userFile = path.join(__dirname, "../data/users.json");

module.exports = {
  getUsers: getUsers,
  getSubscribers: getSubscribers,
  getSubscribersMails: getSubscribersMails,
  getUser: getUser,
  getAvatar: getAvatar,
  addUser: addUser,
  updateUsers: updateUsers,
  updateUser: updateUser,
  refreshUsersCache: refreshUsersCache,
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
  var users = []; // seed

  if (testFileExists(userFile)) {
    try {
      users = JSON.parse(fs.readFileSync(userFile, "utf8"));
    } catch (err) {
      console.warn("Error parsing users file", users);
    }
  }

  users.forEach(function (user) {
    user.avatar = getAvatar(user.id);
  });
  usersCache = users;
}

function saveUsers(users) {
  var usersToSave = [];

  users.forEach(function (user) {
    usersToSave.push(_.omit(user, "avatar"));
  });

  fs.writeFileSync(userFile, JSON.stringify(usersToSave, null, 2), "utf8");
  refreshUsersCache();
}

function getSubscribers() {
  var users = getUsers();

  return users.filter(function (item) {
    return item.hasSubscribe;
  });
}

function getSubscribersMails() {
  var subscribers = getSubscribers();
  return _.compact(subscribers.map((item) => item.id));
}

function getUser(id) {
  var users = getUsers();

  var matchingUsers = users.filter(function (item) {
    return item.id == id;
  });

  if (matchingUsers.length >= 1) {
    return matchingUsers[0];
  } else {
    console.log("Aucun utilisateur correspondant à " + id);
    return { name: id };
  }
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
    console.log("Aucun utilisateur correspondant à " + id);
    return userIndex;
  }
}

function getAvatar(id) {
  var imagepath = path.join(__dirname, "../public/images/" + id + ".jpg");
  try {
    var stats = fs.statSync(imagepath);
    if (stats.isFile()) {
      // si le fichier existe le lien est bon
      return "/images/" + id + ".jpg";
    }
  } catch (e) {
    // fichier inexistant
  }

  return "/images/inconnu.jpg";
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
    } else {
      users.push({
        id: user.id,
        name: user.name,
        hasSubscribe: user.hasSubscribe,
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
    saveUsers(users);
  }
}
