/*jslint node: true */

'use strict';

var request = require('request');
var provider = require('../providers/serie');

var _responseHandler = function (response, body, callback) {
    if (response.statusCode >= 200 && response.statusCode < 400) {
        try {
            return callback(null, body);
        } catch (ex) {
            return callback('Error parsing (' + response.statusCode + '): ' + ex);
        }
    }

    return callback('Failed with status: ' + response.statusCode);
};

exports.getSeries = function (page, callback) {
    request({
        url: provider.get(page),
        json: true
    }, function (err, response, body) {
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
    request({
        url: provider.get('show/' + id),
        json: true
    }, function (err, response, body) {
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
    request({
        url: provider.get('shows'),
        json: true
    }, function (err, response, body) {
        if (err)
            return callback(err);

        _responseHandler(response, body, function (error, data) {
            if (error)
                return callback(error);

            return callback(null, data);
        });
    });
};
