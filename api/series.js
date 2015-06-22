'use strict';

var request = require('request');
var provider = require('../providers/serie');

exports.getSeries = function (page, callback) {
    var url = provider.get(page);
    request(url, function (err, response, body) {
        var series = null;

        if (!err) {
            if (response.statusCode >= 200 && response.statusCode < 400) {
                try {
                    series = JSON.parse(body);
                } catch (ex) {
                    err = 'Error parsing series for page ' + page + ': ' + ex.message;
                }
            } else {
                err = 'Get series for page ' + page + ' failed with status: ' + response.statusCode
            }
        }

        return callback(err, series);
    });
};

exports.getSerie = function (id, callback) {
    var url = provider.get('show/' + id);
    request(url, function (err, response, body) {
        var serie = null;

        if (!err) {
            if (response.statusCode >= 200 && response.statusCode < 400) {
                try {
                    serie = JSON.parse(body);
                } catch (ex) {
                    err = 'Error parsing data for serie ' + id + ': ' + ex.message;
                }
            } else {
                err = 'Get data for serie ' + id + ' failed with status: ' + response.statusCode
            }
        }

        return callback(err, serie);
    });
};

exports.getPages = function (callback) {
    var url = provider.get('shows');
    request(url, function (err, response, body) {
        var page = null;

        if (!err) {
            if (response.statusCode >= 200 && response.statusCode < 400) {
                try {
                    page = JSON.parse(body);
                } catch (ex) {
                    err = 'Error parsing pages: ' + ex.message;
                }
            } else {
                err = 'Get pages failed with status: ' + response.statusCode
            }
        }

        return callback(err, page);
    });
};