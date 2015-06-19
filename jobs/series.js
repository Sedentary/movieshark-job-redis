/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var log = require('winston');
var readTorrent = require('read-torrent');
var peerflix = require('peerflix');
var torrentStream = require('torrent-stream');
var provider = require('../providers/serie');

var _getSeries = function (page, cb) {
    var url = provider.get(page);
    log.info('request %s', url);
    request(url, function (err, response, body) {
        if (err)
            return cb(err);

        var series = body ? JSON.parse(body) : [];

        return cb(null, series);
    });
};

var _getSerie = function (id, cb) {
    var url = provider.get('show/' + id);
    log.info('request %s', url);
    request(url, function (err, response, body) {
        if (err) {
            return cb(err);
        }

        var serie;
        try {
            serie = JSON.parse(body);
        } catch (e) {
            return cb(e);
        }

        return cb(null, serie);
    });
};

var _getPages = function (cb) {
    var url = provider.get('shows');
    log.info('request %s', url);
    request(url, function (err, response, body) {
        if (err) {
            return cb(err);
        }

        return cb(null, JSON.parse(body));
    });    
};

var _endsWith = function (name, end) {
    return name.indexOf(end) !== -1;
};

var _getTorrent = function (magnet, cb) {
    readTorrent(magnet, function (err, torrent) {
        if (err) {
            return cb(err);
        }

        async.each(torrent.files, function (file, cbFiles) {
            var filename = file.name;

            if (!_endsWith(filename, '.ogg') && !_endsWith(filename, '.mp4') && !_endsWith(filename, '.webm') ) {
                log.info('File: %s', filename);
            }
        }, function () {
            return cb();    
        });        
    });
    // var engine = torrentStream(magnet);

    // engine.on('ready', function() {
    //     async.each(engine.files, function (file, cbFile) {

    //         var filename = file.name;

    //         if ( !_withEnd(filename, '.ogg') && !_withEnd(filename, '.mp4') && !_withEnd(filename, 'webm') ) {
    //             log.info('File: %s', filename);
    //         }

    //         cbFile();
    //     }, function () {
    //         cb();
    //     })
    // });

    // engine.on('download', function (fragment) {
    //     console.log('Downloading ' + fragment + ' fragment...');
    // });

    // engine.on('upload', function (fragment, offset, length) {
    //     console.log('Uploading ' + fragment + ' fragment...');
    // });
};

_getPages(function (err, pages) {
    if (err) {
        return log.error('GET PAGE: ', err);
    }

    var seriesList = [];
    var episodesList = [];
    var torrentsList = [];

    async.each(pages, function (page, cbPages) {

        _getSeries(page, function (err, series) {
            if (err) {
                log.error('GET SERIES: ', err);
                cbPages();
            }

            async.each(series, function (serie, cbSeries) {
                seriesList.push(serie._id);
                cbSeries();
            }, function () {
                cbPages();
            })
        });

    }, function () {
        log.info(seriesList.length + ' series loaded.');

        async.each(seriesList, function (serie, cbSeriesList) {
            _getSerie(serie, function (err, s) {
                if (err) {
                    log.error('GET SERIE: ', err);
                    cbSeriesList();
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

            async.each(episodesList, function (episode, cbEpisodesList) {
                if (!episode || !episode.torrents) {
                    log.error('Episode ' + episode.episode + ' has problems.');
                    cbEpisodesList();
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

                async.each(torrentsList, function (torrent, cbTorrent) {
                    _getTorrent(torrent, function (err) {
                        if (err) {
                            log.error('GET TORRENT: ' + err);
                        }

                        cbTorrent();
                    });
                }, function () {
                    log.info('Process finished!');
                });
            });
        });
    });

});
