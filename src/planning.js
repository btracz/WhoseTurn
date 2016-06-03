/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require('fs');
var planningFile = './data/planning.json';

module.exports = {
    getPlanning: getPlanning
};

function getPlanning(){
    return JSON.parse(fs.readFileSync(planningFile, 'utf8'));
}