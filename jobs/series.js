/*jslint node: true */

'use strict';

var async = require('async');
var request = require('request');
var log = require('winston');
var torrentStream = require('torrent-stream');
var provider = require('../providers/serie');

var _getSeries = function (page, cb) {
    var url = provider.get(page);
    request(url, function (err, response, body) {
        if (err)
            return cb(err);

        var series = body ? JSON.parse(body) : [];

        return cb(null, series);
    });
};

var _getSerie = function (id, cb) {
    var url = provider.get('show/' + id);
    request(url, function (err, response, body) {
        if (err)
            return cb(err);

        return cb(null, JSON.parse(body));
    });
};

var _getPages = function (cb) {
    var url = provider.get('shows');
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
    var engine = torrentStream(magnet);

    engine.on('ready', function() {

        async.each(engine.files, function (file, cbFile) {

            cbFile();

            var filename = file.name;

            if ( !_withEnd(filename, '.ogg') && !_withEnd(filename, '.mp4') && !_withEnd(filename, 'webm') ) {
                log.info('File: %s', filename);
            }
        })

    });
}

_getPages(function (err, pages) {
    if (err)
        return log.error('GET PAGE: ', err);

    log.info('Init');

    async.each(pages, function (page, cbPages) {

        _getSeries(page, function (err, series) {
            if (err)
                return log.error('GET SERIES: ', err);

            async.each(series, function (serie, cbSeries) {

                _getSerie(serie._id, function (err, s) {
                    if (err)
                        return log.error('GET SERIE: ', err);

                    async.each(s.episodes, function (episode, cbEpisodes) {

                        async.each(episode.torrents, function (torrent, cbTorrents) {

                            _getTorrent(torrent.url);

                        });

                        cbEpisodes();

                    });

                });

                cbSeries();

            })
        });

        cbPages();

    });

});
