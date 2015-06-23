/*jslint node: true */
'use strict';

var scheduler = require('node-schedule');
var seriesJob = require('./jobs/series');
var moviesJob = require('./jobs/movies');
var express = require('express');
var app = express();
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

if (process.env.NODE_ENV !== 'development') {
    app.set('port', (process.env.PORT || 5000));

    app.get('/', function (req, res, next) {
        return res.status(200).json({ status : 'OK' })
    });

    app.listen(app.get('port'), function() {
      log.info('Node app is running on port', app.get('port'));
    });
}

// Executes every 1 minute(s)
var _seriesSchedule = scheduler.scheduleJob('*/1 * * * *', _runSeriesJob);

// Executes every 1 minute(s)
var _moviesSchedule = scheduler.scheduleJob('*/1 * * * *', _runMoviesJob);