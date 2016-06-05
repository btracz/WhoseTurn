/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require('fs');
var userFile = './data/users.json';

module.exports = {
    getUsers: getUsers,
    getSubscribers: getSubscribers
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