/*jslint node: true */
'use strict';

var scheduler = require('node-schedule');
var seriesJob = require('./jobs/series');
var moviesJob = require('./jobs/movies');
var log = require('./utils/logger')('main', 'Main');

var _runSeriesJob = function () {
    if (!seriesJob.isRunning()) {
        seriesJob.run();
    } else {
        log.info('Series job is already running. Waiting till the next tick...');
    }
};

var _runMoviesJob = function () {
    if (!moviesJob.isRunning()) {
        moviesJob.run();
    } else {
        log.info('Movies job is already running. Waiting till the next tick...');
    }
};

// Executes every 1 minute(s)
var _seriesSchedule = scheduler.scheduleJob('*/1 * * * *', _runSeriesJob);

// Executes every 1 minute(s)
var _moviesSchedule = scheduler.scheduleJob('*/1 * * * *', _runMoviesJob);