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
            err = 'Error parsing: ' + ex.message;
        }
    } else {
        err = 'Failed with status: ' + response.statusCode
    }

    callback(err, data);
};

exports.getSeries = function (page, callback) {
    var url = provider.get(page);
    request(url, function (err, response, body) {
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
    var url = provider.get('show/' + id);
    request(url, function (err, response, body) {
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
    var url = provider.get('shows');
    request(url, function (err, response, body) {
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