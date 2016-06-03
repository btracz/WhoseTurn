/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require('fs');
var moment = require('moment');
var planningFile = './data/planning.json';

module.exports = {
    getPlanning: getPlanning,
    actualAndNextDeliverer : actualAndNextDeliverer
};

function getPlanning() {
    return JSON.parse(fs.readFileSync(planningFile, 'utf8'));
}

function actualAndNextDeliverer() {
    var planning = getPlanning();
    var now = moment();
    var result = [];
    planning.forEach(
        function (plan) {
            console.log(plan.date);
        }
    );
    return planning;
}