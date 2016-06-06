/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require('fs');
var moment = require('moment');
var _ = require('underscore');
var planningFile = './data/planning.json';

module.exports = {
    getPlanning: getPlanning,
    actualAndNextDeliverer: actualAndNextDeliverer
};

function getPlanning() {
    return JSON.parse(fs.readFileSync(planningFile, 'utf8'));
}

function actualAndNextDeliverer() {
    var planning = getPlanning();
    var now = new Date();
    var result = _.filter(planning, function (plan) {
        var splitDate = plan.date.split("/");
        var month = parseInt(splitDate[1], 10) - 1;
        var delivererDate = new Date(splitDate[2], month.toString(), splitDate[0]);
        var timeDiff = delivererDate.getTime() - now.getTime();
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays <= 13 && diffDays >= 0;
    });
    console.log(result);
    return result;
}