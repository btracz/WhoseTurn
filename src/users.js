/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require('fs');
var userFile = './data/users.json';

module.exports = {
    getUsers: getUsers
};

function getUsers(){
    return JSON.parse(fs.readFileSync(userFile, 'utf8'));
}