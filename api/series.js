/*jslint node: true */
'use strict';

var request = require('request');
var provider = require('../providers/serie');

var _responseHandler = function (response, body, callback) {
    var err = null,
        data = null;

    if (response.statusCode >= 200 && response.statusCode < 400) {
        try {
            data = JSON.parse(body);
        } catch (ex) {
            err = 'Error parsing (' + response.statusCode + '): ' + ex;
        }
    } else {
        err = 'Failed with status: ' + response.statusCode;
    }

    callback(err, data);
};

exports.getSeries = function (page, callback) {
    request(provider.get(page), function (err, response, body) {
        var series = null;

        if (!err) {
            _responseHandler(response, body, function (error, data) {
                if (error) {
                    err = error;
                } else {
                    series = data;
                }
            });
        }

        return callback(err, series);
    });
};

exports.getSerie = function (id, callback) {
    request(provider.get('show/' + id), function (err, response, body) {
        var serie = null;

        if (!err) {
            _responseHandler(response, body, function (error, data) {
                if (error) {
                    err = error;
                } else {
                    serie = data;
                }
            });
        }

        return callback(err, serie);
    });
};

exports.getPages = function (callback) {
    request(provider.get('shows'), function (err, response, body) {
        var page = null;

        if (!err) {
            _responseHandler(response, body, function (error, data) {
                if (error) {
                    err = error;
                } else {
                    page = data;
                }
            });
        }

        return callback(err, page);
    });
};