'use strict';

var schedule = require('node-schedule');
var seriesJob = require('./jobs/series');
var log = require('./utils/logger')('main', 'Main');

var _runSeriesJob = function () {
    if (!seriesJob.isRunning()) {
        seriesJob.run();
    } else {
        log.info('Series job is already running. Waiting till the next tick...');
    }
};

// Executes every 1 minute(s)
var _seriesSchedule = schedule.scheduleJob('*/1 * * * *', _runSeriesJob);