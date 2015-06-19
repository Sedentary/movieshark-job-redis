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
        if (err)
            return cb(err);

        return cb(null, JSON.parse(body));
    });
};

var _getPages = function (cb) {
    var url = provider.get('shows');
    log.info('request %s', url);
    request(url, function (err, response, body) {
        if (err)
            return cb(err);

        return cb(null, JSON.parse(body));
    });    
};

var _withEnd = function (name, end) {
    return name.indexOf(end) !== -1;
}

var _getTorrent = function (magnet, cb) {
    readTorrent(magnet, function (err, torrent) {
        if (err)
            return cb(err);

        async.each(torrent.files, function (file, cbFiles) {
            var filename = file.name;

            if (!_withEnd(filename, '.ogg') && !_withEnd(filename, '.mp4') && !_withEnd(filename, '.webm') ) {
                log.info('File: %s', filename);
            }
        }, function () {
            return cb();    
        });        
    })
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
}

_getPages(function (err, pages) {
    if (err)
        return log.error('GET PAGE: ', err);

    async.eachSeries(pages, function (page, cbPages) {

        _getSeries(page, function (err, series) {
            if (err)
                return log.error('GET SERIES: ', err);

            async.eachSeries(series, function (serie, cbSeries) {

                _getSerie(serie._id, function (err, s) {
                    if (err)
                        return log.error('GET SERIE: ', err);

                    async.eachSeries(s.episodes, function (episode, cbEpisodes) {
                        async.eachSeries(episode.torrents, function (torrent, cbTorrents) {
                            if (!torrent && !torrent.url)
                                return cbTorrents(torrent);

                            _getTorrent(torrent.url, function (err) {
                                cbTorrents(err);
                            });

                        }, function (err) {
                            if (err)
                                return log.error('GET TORRENT: ', err);

                            log.info('EPISODE %s\n', episode.title);
                            cbEpisodes();
                        });

                    }, function () {
                        cbSeries();
                    });

                });

            }, function () {
                cbPages();
            })
        });

    }, function () {
        log.info('finished');
    });

});
