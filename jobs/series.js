/*jslint node: true */

'use strict';

var utils = require('../utils/common');

var events = require('events');
var async = require('async');
var api = require('../api/series');
var torrentUtils = require('../utils/torrent');
var client = require('../utils/redis').getClient();
var log = require('../utils/logger')('seriesJob', 'Series Job');

var emitter = new events.EventEmitter();

var _isRunning = false;

exports.run = function () {
    emitter.emit('run');
    _isRunning = true;
};

exports.isRunning = function () {
    return _isRunning;
};

var _loadPages = function () {
    log.info('Processing pages...');

    var pagesList = [];
    api.getPages(function (err, pages) {
        if (err)
            return log.error('GET PAGES: ', err);

        async.each(pages, function (page, cbPages) {
            pagesList.push(page);
            return cbPages();
        }, function () {
            log.info(pagesList.length + ' pages loaded.');
            emitter.emit('pagesLoaded', pagesList);
        });
    });
};

var _loadSeries = function (pagesList) {
    log.info('Processing series...');

    var seriesList = [];
    async.each(pagesList, function (page, cbPages) {
        api.getSeries(page, function (err, series) {
            if (err) {
                log.error('GET SERIES AT ' + page + ': ', err);
                return cbPages();
            }

            async.each(series, function (serie, cbSeries) {
                seriesList.push(serie);
                cbSeries();
            }, function () {
                cbPages();
            });
        });
    }, function () {
        log.info(seriesList.length + ' series loaded.');
        emitter.emit('seriesLoaded', seriesList);
    });
};

var _loadEpisodes = function (seriesList) {
    log.info('Processing episodes...');

    var episodesList = [];
    async.each(seriesList, function (serie, cbSeriesList) {
        api.getSerie(serie._id, function (err, s) {
            if (err) {
                log.error('GET SERIE AT ' + serie._id + ': ', err);
                return cbSeriesList();
            }

            async.each(s.episodes, function (episode, cbEpisodes) {
                episodesList.push({serie: serie, episode : episode});
                cbEpisodes();
            }, function () {
                cbSeriesList();
            });

        });
    }, function () {
        log.info(episodesList.length + ' episodes loaded.');
        emitter.emit('episodesLoaded', episodesList);
    });
};

var _loadTorrents = function (episodesList) {
    log.info('Processing torrents...');

    var torrentsList = [];
    async.each(episodesList, function (episode, cbEpisodesList) {
        var epi = episode.episode,
            serie = episode.serie;

        if (!epi || !epi.torrents) {
            log.error('Episode ' + epi.episode + ' from serie ' + serie._id + ' has problems.');
            return cbEpisodesList();
        }

        async.each(epi.torrents, function (torrent, cbTorrents) {
            if (torrent && torrent.url) {
                torrentsList.push({serie : serie, episode : epi, torrent : torrent.url});
            }
            cbTorrents();
        }, function () {
            cbEpisodesList();
        });
    }, function () {
        log.info(torrentsList.length + ' torrents loaded.');
        emitter.emit('torrentsLoaded', torrentsList);
    });
};

var _processTorrentsInformation = function (torrentsList) {
    log.info('Processing torrents information...');

    async.eachSeries(torrentsList, function (torrent, cbTorrent) {
        var serie = torrent.serie;
        log.info('Processing episode ' + torrent.episode.episode + ' from serie ' + serie._id);

        torrentUtils.getTorrentFiles(torrent.torrent, function (err, files) {
            if (err) {
                log.error('Error processing torrent:' + err);
                return cbTorrent();
            }

            files.forEach(function (file) {
                var filename = file.name;

                if (utils.endsWith(filename, '.ogg') || utils.endsWith(filename, '.mp4') || utils.endsWith(filename, '.webm')) {
                    client.get(serie.slug, function (err, ser) {
                        if (err)
                            return log.error('Error processing redis: ', err);

                        if (!ser) {
                            client.rpush('series-valid', serie);
                            client.set(serie.slug, serie);
                            log.info('File: %s', filename);
                        }
                    });
                } else {
                    log.info('File: %s', filename);
                }
            });

            return cbTorrent();
        });
    }, function () {
        emitter.emit('processFinished');
    });
};

emitter.on('run', _loadPages);
emitter.on('pagesLoaded', _loadSeries);
emitter.on('seriesLoaded', _loadEpisodes);
emitter.on('episodesLoaded', _loadTorrents);
emitter.on('torrentsLoaded', _processTorrentsInformation);
emitter.on('processFinished', function () {
    log.info('Process finished successfully!');
    _isRunning = false;
});