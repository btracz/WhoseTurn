/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require('fs');
var _ = require('underscore');
var users = require("./users");
var planningFile = './data/planning.json';
var title = ["Le {0}, c'était :", "Cette semaine c'est :", "La semaine prochaine, ce sera :", "Le {0}, ce sera :"];

module.exports = {
    getPlanning: getPlanning,
    actualAndNextDeliverer: actualAndNextDeliverer,
    getFollowingDeliverer: getFollowingDeliverer,
    createFollowingDelivery: createFollowingDelivery
};

function getPlanning() {
    var planning = JSON.parse(fs.readFileSync(planningFile, 'utf8'));
    Object.keys(planning).map(function (index) {
        planning[index].title = getTitle(planning[index].date);
        planning[index].deliverer = users.getUser(planning[index].deliverer);
    });
    return planning;
}

function actualAndNextDeliverer() {
    var planning = getPlanning();
    var now = new Date();
    var result = _.filter(planning, function (plan) {
        var delivererDate = convertDateStringToDate(plan.date);
        var timeDiff = delivererDate.getTime() - now.getTime();
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays <= 13 && diffDays >= 0;
    });

    return result;
}

function convertDateStringToDate(dateString){
    var splitDate = dateString.split("/");
    var month = parseInt(splitDate[1], 10) - 1;
    return new Date(splitDate[2], month.toString(), splitDate[0]);
}

function getTitle(date) {
    var now = new Date();
    var splitDate = date.split("/");
    var month = parseInt(splitDate[1], 10) - 1;
    var delivererDate = new Date(splitDate[2], month.toString(), splitDate[0]);
    var timeDiff = delivererDate.getTime() - now.getTime();
    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (diffDays <= 0) {
        return title[0].replace("{0}", date);
    }
    else if (diffDays <=7) {
        return title[1];
    }
    else if (diffDays <= 13) {
        return title[2];
    }
    else {
        return title[3].replace("{0}", date);
    }
}

function savePlanning(planning){
    var planningStorable = [];

    planning.forEach(function(delivery){
        planningStorable.push({
            date:delivery.date,
            deliverer: delivery.deliverer.id
        });
    });

    fs.writeFileSync(planningFile, JSON.stringify(planningStorable, null, 2), 'utf8');
}

function createFollowingDelivery(){
    var planning = getPlanning();

    var lastDelivery = planning[planning.length - 1];

    var lastDeliveryDate = convertDateStringToDate(lastDelivery.date);
    // On calcule la date + 7 jours
    var followingDate = new Date();
    followingDate.setDate(lastDeliveryDate.getDate() + 7);
    planning.push({
        date: getNextDayOfWeek(followingDate, 5),
        deliverer: getFollowingDeliverer().id
    });

    savePlanning(planning);
}

function getFollowingDeliverer(){
    // TODO
}

/**
 * Retourne la date du prochain jour donnée après la date
 * date : Date de référence de calcul
 * dayOfWeek : index de base zéro du jour de la semaine (Dimanche = 0)
 */
function getNextDayOfWeek(date, dayOfWeek) {
    var resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);

    return resultDate;
}