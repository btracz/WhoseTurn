/**
 * Created by Benjamin on 03/06/2016.
 */
var fs = require("fs");
var _ = require("underscore");
var moment = require("moment");
var users = require("./users");
const path = require("path");
const { getDayOfOccurrence } = require("./config");
const { testFileExists } = require("./utils");
const { ERRORS } = require("./constants");
var planningFile = path.join(__dirname, "../data/planning.json");
var title = [
  "Le {0}, c'était :",
  "Cette semaine ({0}) c'est :",
  "La semaine prochaine ({0}), ce sera :",
  "Le {0}, ce sera :",
];

module.exports = {
  getPlanningOnly: getPlanningOnly,
  getPlanning: getPlanning,
  actualAndNextDeliverer: actualAndNextDeliverer,
  getFollowingDeliverer: getFollowingDeliverer,
  createFollowingDelivery: createFollowingDelivery,
  getFollowingDeliveryDate: getFollowingDeliveryDate,
  updatePlanning: updatePlanning,
};

function getPlanningOnly() {
  var planning = []; // seed
  if (testFileExists(planningFile)) {
    try {
      planning = JSON.parse(fs.readFileSync(planningFile, "utf8"));
    } catch (err) {
      console.warn("Error parsing planning file", err);
    }
  }

  return planning;
}

function getPlanning() {
  const planning = getPlanningOnly();
  Object.keys(planning).map(function (index) {
    planning[index].title = getTitle(planning[index].date);
    planning[index].deliverer = users.getUser(planning[index].deliverer);
  });
  return planning;
}

function getDateIndex(date, planning) {
  var dateIndex = -1;
  var matchingDate = planning.filter(function (item, index) {
    if (item.date === date) {
      dateIndex = index;
    }
    return item.date === date;
  });

  if (matchingDate.length >= 1) {
    return dateIndex;
  } else {
    console.log("Aucune date correspondant à " + date);
    return dateIndex;
  }
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

  // if next 2 deliveries not planned, create it
  if (!result[0]) {
    result[0] = createFollowingDelivery();
  }
  if (!result[1]) {
    result[1] = createFollowingDelivery();
  }

  return result;
}

function convertDateStringToDate(dateString) {
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
  } else if (diffDays < 7) {
    return title[1].replace("{0}", date);
  } else if (diffDays <= 13) {
    return title[2].replace("{0}", date);
  } else {
    return title[3].replace("{0}", date);
  }
}

function savePlanning(planning) {
  var planningStorable = [];

  planning.forEach(function (delivery) {
    planningStorable.push({
      date: delivery.date,
      deliverer: delivery.deliverer.id,
    });
  });

  fs.writeFileSync(
    planningFile,
    JSON.stringify(planningStorable, null, 2),
    "utf8"
  );
}

function createFollowingDelivery() {
  var planning = getPlanning();
  const followDelivery = getFollowingDelivery();

  planning.push(followDelivery);

  savePlanning(planning);
  return followDelivery;
}

function getFollowingDelivery() {
  return {
    date: getFollowingDeliveryDate(),
    deliverer: getFollowingDeliverer(),
  };
}

function getFollowingDeliveryDate() {
  var planning = getPlanning();

  var lastDelivery = planning[planning.length - 1];
  // fallback to fake delivery in the past if no delivery found (init mode)
  if (!lastDelivery) {
    lastDelivery = { date: "21/05/2012" }; // first day at sopra
  }
  var lastDeliveryDate = convertDateStringToDate(lastDelivery.date);

  // On calcule la date + 7 jours
  var followingDate = lastDeliveryDate;
  followingDate.setDate(lastDeliveryDate.getDate() + 7);

  // in the past, we'll start from today
  if (moment(followingDate).isBefore(moment())) {
    followingDate = moment().toDate();
  }

  // TODO : exclude holidays
  return moment(getNextDayOfWeek(followingDate, getDayOfOccurrence())).format(
    "DD/MM/YYYY"
  );
}

function getFollowingDeliverer() {
  var subscribers = _.clone(users.getSubscribers());

  if (subscribers.length === 0) {
    throw new Error(ERRORS.NO_USER_ERROR);
  }
  // reset all delivery dates
  subscribers.forEach((sub) =>  { sub.lastDelivery = null });

  var planning = getPlanning();

  // Moulinette de calcul de la dernière livraison des abonnés
  planning.forEach(function (delivery) {
    var deliveryDate = moment(delivery.date, "DD/MM/YYYY");
    subscribers.forEach(function (sub) {
      if (
        (sub.id == delivery.deliverer.id && !sub.lastDelivery) ||
        (sub.id == delivery.deliverer.id &&
          sub.lastDelivery &&
          moment(sub.lastDelivery).isBefore(deliveryDate))
      ) {
        sub.lastDelivery = deliveryDate.toISOString();
      }
    });
  });

  var subscribersWithoutDelivery = subscribers.filter(function (item) {
    return !item.lastDelivery;
  });

  if (subscribersWithoutDelivery && subscribersWithoutDelivery.length > 0) {
    return subscribersWithoutDelivery[0];
  }

  subscribers.sort(function (a, b) {
    return moment(a.lastDelivery).isBefore(moment(b.lastDelivery)) ? -1 : 1;
  });

  return subscribers.shift();
}

/**
 * Retourne la date du prochain jour donnée après la date
 * date : Date de référence de calcul
 * dayOfWeek : index de base zéro du jour de la semaine (Dimanche = 0)
 */
function getNextDayOfWeek(date, dayOfWeek) {
  var resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7));

  return resultDate;
}

function updatePlanning(partialPlanning) {
  var newPlanning = getPlanning();
  var planning = getPlanning();
  partialPlanning.forEach(function (item) {
    var index = getDateIndex(item.date, planning);
    if (index > -1) {
      newPlanning[index] = {
        date: item.date,
        deliverer: {
          id: item.deliverer,
        },
      };
    } else {
      newPlanning.push({
        date: item.date,
        deliverer: {
          id: item.deliverer,
        },
      });
    }
  });

  savePlanning(newPlanning);
}
