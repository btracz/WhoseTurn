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
    closePoll: closePoll
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
        return getPoll(delivery.date);
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
    if(isAnwserBoolean){
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

    var pollIndex =_.findIndex(polls, function(poll){
        var respondentIndex = _.findIndex(poll.respondents, function(respondent){
            return respondent.guid == guid;
        });

        if(respondentIndex >= 0){
            response.respondentIdx = respondentIndex;
            return true;
        } else {
            return false;
        }
    });

    if(pollIndex >= 0){
        response.pollIdx = pollIndex;
        if(polls[pollIndex].open){
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
    } else {
        throw new Error("Sondage inexistant");
    }
}