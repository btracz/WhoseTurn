var CronJob = require("cron").CronJob;
var CronManager = require("cron-job-manager");
var scheduler = new CronManager();
var Q = require("q");

/**
 * Méthode de création d'un job.
 * @param taskName Nom de la tache.
 * @param cronPattern Pattern de périodicité (sous la forme d'un pattern Cron ou d'une date).
 * @param taskmethod La méthode appellée.
 */
function createJob(taskName, cronPattern, taskmethod) {
    var deferred = Q.defer();
    if (taskName && cronPattern && taskmethod && checkCronPattern(cronPattern)) {
        scheduler.add(taskName, cronPattern, taskmethod);
        var message = "Tache crée : " + taskName + ", pattern : " + cronPattern;
        console.log(message);
        deferred.resolve(message);
    }
    else {
        var msg = "L'un des paramètres est incorrect : tâche=> " + taskName + " pattern Cron=> " + cronPattern + " méthode=> " + taskmethod;
        console.log(msg);
        deferred.reject(msg);
    }

    return deferred.promise;
}

/**
 * vérification du pattern Cron
 * @param pattern : string - pattern à vérifier.
 */
function checkCronPattern(pattern) {
    var isValid = false;
    try {
        new CronJob(pattern, function () {
            return null;
        });
        isValid = true;
    } catch (ex) {
        errorHandle("Pattern d'ordonnanceur incorrect", ex);
        isValid = false;
    }

    return isValid;
}


/**
 * Méthode de démarrage d'un job.
 * @param taskName Le nom de la tache.
 */
function startTask(taskName) {
    scheduler.start(taskName);
}

/**
 * Méthode d'arrêt d'un job
 * @param taskName le nom de la tache.
 */
function stopTask(taskName) {
    scheduler.stop(taskName);
}

/**
 *
 * @param taskName
 * @param cronDate
 */
function updateTaskOnCronChange(taskName, cronDate) {
    var deferred = Q.defer();
    var currentCronDate = scheduler.jobs[taskName].cronTime.source;
    if (currentCronDate && cronDate) {
        if (cronDate !== currentCronDate) {
            if (checkCronPattern(cronDate)) {
                console.log("Changement du rafraichissement pour la tache : " + taskName);
                scheduler.update(taskName, cronDate);
            }
        }

        deferred.resolve();
    }
    else {
        var msg = "L'un des pattern est incorrect : courant => " + currentCronDate + " nouveau : " + cronDate;
        console.log(msg);
        deferred.reject(msg);
    }

    return deferred.promise;
}

/**
 * Error handle pour le logger
 * @param func Le nom de la fonction.
 * @param error L'erreur.
 */
function errorHandle(func, error) {
    console.log("[" + func + "] Erreur rencontrée : " + error + " stacktrace : " + (error ? error.stack : "-"));
}

module.exports = {
    createJob: createJob,
    startTask: startTask,
    updateTaskOnCronChange: updateTaskOnCronChange,
    stopTask: stopTask
};