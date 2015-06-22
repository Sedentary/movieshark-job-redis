/*jslint node: true */

'use strict';

var events = require('events');
var eventEmitter = new events.EventEmitter();

var async = require('async');
var request = require('request');
var log = require('winston');
var readTorrent = require('read-torrent');
var peerflix = require('peerflix');
var torrentStream = require('torrent-stream');
var provider = require('../providers/serie');

var _endsWith = function (name, end) {
    return name.indexOf(end) !== -1;
};

var _asyncLoop = function (iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function() {
            if (done) {
                return;
            }

            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        },

        iteration: function() {
            return index - 1;
        },

        break: function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
};

var _getSeries = function (page, cb) {
    var url = provider.get(page);
    request(url, function (err, response, body) {
        var series = null;

        if (!err) {
            if (response.statusCode >= 200 && response.statusCode <= 400) {
                try {
                    series = JSON.parse(body);
                } catch (ex) {
                    err = 'Error parsing series for page ' + page + ': ' + ex.message;
                }
            } else {
                err = 'Get series for page ' + page + ' failed with status: ' + response.statusCode
            }
        }

        return cb(err, series);
    });
};

var _getSerie = function (id, cb) {
    var url = provider.get('show/' + id);
    request(url, function (err, response, body) {
        var serie = null;

        if (!err) {
            if (response.statusCode >= 200 && response.statusCode <= 400) {
                try {
                    serie = JSON.parse(body);
                } catch (ex) {
                    err = 'Error parsing data for serie ' + id + ': ' + ex.message;
                }
            } else {
                err = 'Get data for serie ' + id + ' failed with status: ' + response.statusCode
            }
        }

        return cb(err, serie);
    });
};

var _getPages = function (cb) {
    var url = provider.get('shows');
    request(url, function (err, response, body) {
        var page = null;

        if (!err) {
            if (response.statusCode >= 200 && response.statusCode <= 400) {
                try {
                    page = JSON.parse(body);
                } catch (ex) {
                    err = 'Error parsing pages: ' + ex.message;
                }
            } else {
                err = 'Get pages failed with status: ' + response.statusCode
            }
        }

        return cb(err, page);
    });    
};

var _getTorrentFiles = function (magnet, cb) {
    readTorrent(magnet, function (err, torrent) {
        if (err) {
            return cb(err);
        }

        cb(null, torrent.files);
    });
};

/**####################################################################################*/
var pagesList = [];
var seriesList = [];
var episodesList = [];
var torrentsList = [];

var _start = function () {
    log.info('Starting process');

    _processPages();
};

var _processPages = function () {
    log.info('Processing pages...');

    _getPages(function (err, pages) {
        if (err) {
            return log.error('GET PAGE: ', err);
        }

        async.each(pages, function (page, cbPages) {
            pagesList.push(page);
            return cbPages();
        }, function () {
            log.info(pagesList.length + ' pages loaded.');
            eventEmitter.emit('pagesLoaded');
        });
    });
};

var _processSeries = function () {
    log.info('Processing series...');

    async.each(pagesList, function (page, cbPages) {
        _getSeries(page, function (err, series) {
            if (err) {
                log.error('GET SERIES: ', err);
                return cbPages();
            }

            async.each(series, function (serie, cbSeries) {
                seriesList.push(serie._id);
                cbSeries();
            }, function () {
                cbPages();
            });
        });
    }, function () {
        log.info(seriesList.length + ' series loaded.');
        eventEmitter.emit('seriesLoaded');
    });
};

var _processEpisodes = function () {
    log.info('Processing episodes...');

    async.each(seriesList, function (serie, cbSeriesList) {
        _getSerie(serie, function (err, s) {
            if (err) {
                log.error('GET SERIE: ', err);
                return cbSeriesList();
            }

            async.each(s.episodes, function (episode, cbEpisodes) {
                episodesList.push(episode);
                cbEpisodes();
            }, function () {
                cbSeriesList();
            });

        });
    }, function() {
        log.info(episodesList.length + ' episodes loaded.');
        eventEmitter.emit('episodesLoaded');
    });
};

var _processTorrents = function () {
    log.info('Processing torrents...');

    async.each(episodesList, function (episode, cbEpisodesList) {
        if (!episode || !episode.torrents) {
            log.error('Episode ' + episode.episode + ' has problems.');
            return cbEpisodesList();
        }

        async.each(episode.torrents, function (torrent, cbTorrents) {
            if (torrent && torrent.url) {
                torrentsList.push(torrent.url);
            }
            cbTorrents();
        }, function () {
            cbEpisodesList();
        });
    }, function () {
        log.info(torrentsList.length + ' torrents loaded.');
        eventEmitter.emit('torrentsLoaded');
    });
};

var _processTorrentsInformation = function () {
    log.info('Processing torrents information...');

    _asyncLoop(torrentsList.length, function (loop) {
        _getTorrentFiles(torrentsList[loop.iteration()], function (err, files) {
            if (err) {
                log.error('Error processing torrent:' + err);
                return cbTorrent();
            }

            console.log(files);

            //for (var file in files) {
            //    file = files[file];
            //
            //    var filename = file.name;
            //
            //    if (!_endsWith(filename, '.ogg') && !_endsWith(filename, '.mp4') && !_endsWith(filename, '.webm') ) {
            //        log.info('File: %s', filename);
            //    } else {
            //        log.info('Ok');
            //    }
            //}

            loop.next();
        });
    });

    eventEmitter.emit('processFinished');
};

eventEmitter.on('pagesLoaded', _processSeries);
eventEmitter.on('seriesLoaded', _processEpisodes);
eventEmitter.on('episodesLoaded', _processTorrents);
eventEmitter.on('torrentsLoaded', _processTorrentsInformation);
eventEmitter.on('processFinished', function () {
    log.info('Process finished successfully!')
});

_start();