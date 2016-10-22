/**
 * Created by Benjamin on 21/07/2016.
 */
var fs = require('fs');
var uuid = require('uuid');
var _ = require("underscore");
var pollsFile = './data/polls.json';

var polls = getPolls();

module.exports = {
    createPoll: createPoll,
    setPollResponse: setPollResponse,
    getPoll: getPoll,
    getOpenPoll: getOpenPoll,
    getLastClosedPoll: getLastClosedPoll,
    closePoll: closePoll,
    getPollStatus: getPollStatus
};

function initPollFile() {
    if (!pollFileExists()) {
        fs.writeFileSync(pollsFile, JSON.stringify([], null, 4), 'utf8');
    } else {
        savePolls();
    }
}

function savePolls() {
    fs.writeFileSync(pollsFile, JSON.stringify(polls, null, 4), 'utf8');
}

function pollFileExists() {
    try {
        fs.accessSync(pollsFile, fs.F_OK);
        return true;
    } catch (e) {
        return false;
    }
}

function getPolls() {
    if (pollFileExists()) {
        var filePolls = JSON.parse(fs.readFileSync(pollsFile, 'utf8'));
        return filePolls;
    } else {
        initPollFile();
        return [];
    }
}

function getPoll(date) {
    var index = getPollIndex(date);
    if (index >= 0) {
        return polls[index];
    } else {
        return null;
    }
}

function getOpenPoll() {
    var openPolls = polls.filter(function (poll) {
        return poll.open;
    });

    if (openPolls && openPolls.length > 0) {
        return openPolls[0];
    }
}

function getLastClosedPoll() {
    var closedPolls = polls.filter(function (poll) {
        return !poll.open;
    });

    if (closedPolls && closedPolls.length > 0) {
        return closedPolls.sort(function(pollA, pollB){
            return convertDateStringToDate(pollB.date) - convertDateStringToDate(pollA.date);
        })[0];
    }

}

function convertDateStringToDate(dateString) {
    var splitDate = dateString.split("/");
    var month = parseInt(splitDate[1], 10) - 1;
    return new Date(splitDate[2], month.toString(), splitDate[0]);
}

function getPollIndex(date) {
    return _.findIndex(polls, function (item) {
        return item.date == date;
    });
}

function checkPollExists(date) {
    var index = getPollIndex(date);

    return index >= 0;
}

function createPoll(delivery, respondents) {
    if (checkPollExists(delivery.date)) {
        var existingPoll = getPoll(delivery.date);
        existingPoll.deliverer = delivery.deliverer.id;
        savePolls();
        return existingPoll;
    } else {
        var newPoll = {
            date: delivery.date,
            deliverer: delivery.deliverer.id,
            open: true,
            respondents: []
        };

        respondents.forEach(function (respondent) {
            newPoll.respondents.push({
                id: respondent.id,
                guid: uuid.v4(),
                status: null
            });
        });

        polls.push(newPoll);
        savePolls();

        return newPoll;
    }
}

function setPollResponse(guid, answer) {
    var idxs = findPollFromGuid(guid);
    var isAnwserBoolean = (answer == 'true' || answer == 'false');
    if (isAnwserBoolean) {
        polls[idxs.pollIdx].respondents[idxs.respondentIdx].status = (answer == 'true');
        polls[idxs.pollIdx].respondents[idxs.respondentIdx].answerDate = new Date();
        savePolls();
    } else {
        throw new Error("Réponse invalide");
    }

}

function findPollFromGuid(guid) {
    var response = {
        pollIdx: -1,
        respondentIdx: -1
    };

    var pollIndex = _.findIndex(polls, function (poll) {
        var respondentIndex = _.findIndex(poll.respondents, function (respondent) {
            return respondent.guid == guid;
        });

        if (respondentIndex >= 0) {
            response.respondentIdx = respondentIndex;
            return true;
        } else {
            return false;
        }
    });

    if (pollIndex >= 0) {
        response.pollIdx = pollIndex;
        if (polls[pollIndex].open) {
            return response;
        } else {
            throw new Error("Sondage Fermé");
        }
    } else {
        throw new Error("Identifiant inconnu");
    }
}

function closePoll(date) {
    if (checkPollExists(date)) {
        var index = getPollIndex(date);
        polls[index].open = false;
        savePolls();
        return polls[index];
    } else {
        throw new Error("Sondage inexistant");
    }
}

function getPollStatus(date){
    var poll = JSON.parse(JSON.stringify(getPoll(date)));

    // Calcul résultats
    var presents = poll.respondents.filter(function (resp) {
        return resp.status === true;
    });
    var presCount = presents ? presents.length : 0;

    var absents = poll.respondents.filter(function (resp) {
        return resp.status === false;
    });
    var absCount = absents ? absents.length : 0;
    var noRespCount = poll.respondents.length - presCount - absCount;

    poll.status = {
        presents: presCount,
        absents: absCount,
        noResponse: noRespCount
    };

    return poll;
}