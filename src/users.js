/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require('fs');
var userFile = './data/users.json';

module.exports = {
    getUsers: getUsers,
    getSubscribers: getSubscribers,
    getSubscribersMails: getSubscribersMails,
    getUser: getUser
};

function getUsers(){
    return JSON.parse(fs.readFileSync(userFile, 'utf8'));
}

function getSubscribers(){
    var users = getUsers();

    return users.filter(function(item){
       return item.hasSubscribe;
    });
}

function getSubscribersMails(){
    var mails = [];

}

function getUser(id){
    var users = getUsers();

    var matchingUsers =  users.filter(function(item){
        return item.id == id;
    });

    if (matchingUsers.length >= 1){
        return matchingUsers[0];
    } else {
        console.log('Aucun utilisateur correspondant à ' + id);
        return null;
    }
}