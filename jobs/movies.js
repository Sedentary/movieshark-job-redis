/*jslint node: true */

'use strict';

var utils = require('../utils/common');

var events = require('events');
var async = require('async');
var api = require('../api/movies');
var torrentUtils = require('../utils/torrent');
var client = require('../utils/redis').client;
var log = require('../utils/logger')('moviesJob', 'Movies Job');

var emitter = new events.EventEmitter();

var _isRunning = false;

exports.run = function () {
    emitter.emit('run');
    _isRunning = true;
};

exports.isRunning = function () {
    return _isRunning;
};

var _count = function () {
    log.info('Counting movies...');

    api.countMovies(function (err, count) {
        if (err)
            return log.error('COUNT MOVIES: ', err);

        log.info(count + ' movies counted.');
        emitter.emit('moviesCounted', count);
    });
};

var _getMovies = function (count) {
    log.info('Processing movies...');

    var limit = 50,
        pagination = (count / limit),
        moviesList = [];

    pagination = (utils.getPrecision(pagination) > 0) ? parseInt(pagination, 0) + 1 : parseInt(pagination, 0);

    async.times(pagination, function (page, cbPagination) {
        api.getMovies(page, function (err, movies) {
            if (err)
                return log.error('GET MOVIES AT ' + page + ': ', err);

            async.each(movies, function (movie, cbMovies) {
                moviesList.push(movie);
                cbMovies();
            }, function () {
                cbPagination();
            });
        });
    }, function () {
        log.info(moviesList.length + ' movies loaded.');
        emitter.emit('moviesLoaded', moviesList);
    });
};

var _processTorrentsInformation = function (moviesList) {
    log.info('Processing torrents information...');

    async.eachSeries(moviesList, function (movie, cbMovie) {
        log.info('Processing movie ' + movie.title);

        async.each(movie.torrents, function (torrent, cbTorrent) {
            var torr = {
                name: movie.title_long,
                hash: torrent.hash
            };
            torrentUtils.getTorrentFiles(torrentUtils.magnetize(torr), function (err, files) {
                if (err) {
                    log.error('Error processing torrent:' + err);
                    return cbTorrent();
                }

                files.forEach(function (file) {
                    var filename = file.name;

                    if (utils.endsWith(filename, '.ogg') || utils.endsWith(filename, '.mp4') || utils.endsWith(filename, '.webm')) {
                        client.get(movie.slug, function (err, movie) {
                        if (err)
                            return log.error('Error processing redis: ', err);

                        if (!movie) {
                            client.rpush('movies-valid', movie);
                            client.set(movie.slug, movie);
                            log.info('File: %s', filename);
                        }
                    });
                    } else {
                        log.info('Ok');
                    }
                });

                cbTorrent();
            });
        }, function () {
            cbMovie();
        });
    }, function () {
        emitter.emit('processFinished');
    });
};

emitter.on('run', _count);
emitter.on('moviesCounted', _getMovies);
emitter.on('moviesLoaded', _processTorrentsInformation);
emitter.on('processFinished', function () {
    log.info('Process finished successfully!');
    _isRunning = false;
});