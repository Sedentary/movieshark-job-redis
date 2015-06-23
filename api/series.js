/*jslint node: true */

'use strict';

var request = require('request');
var provider = require('../providers/serie');

var _responseHandler = function (response, body, callback) {
    if (response.statusCode >= 200 && response.statusCode < 400) {
        try {
            var data = JSON.parse(body);
            return callback(null, data);
        } catch (ex) {
            return callback('Error parsing (' + response.statusCode + '): ' + ex);
        }
    }

    return callback('Failed with status: ' + response.statusCode);
};

exports.getSeries = function (page, callback) {
    request(provider.get(page), function (err, response, body) {
        if (err)
            return callback(err);

        _responseHandler(response, body, function (error, data) {
            if (error)
                return callback(error);

            return callback(null, data);
        });
    });
};

exports.getSerie = function (id, callback) {
    request(provider.get('show/' + id), function (err, response, body) {
        if (err)
            return callback(err);
        
        _responseHandler(response, body, function (error, data) {
            if (error)
                return callback(error);

            return callback(null, data);
        });
    });
};

exports.getPages = function (callback) {
    request(provider.get('shows'), function (err, response, body) {
        if (err)
            return callback(err);

        _responseHandler(response, body, function (error, data) {
            if (error)
                return callback(error);

            return callback(null, data);
        });
    });
};
