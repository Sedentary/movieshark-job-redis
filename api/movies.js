/*jslint node: true */

'use strict';

var request = require('request');
var provider = require('../providers/movie');

var _responseHandler = function (response, body, callback) {
    if (response.statusCode >= 200 && response.statusCode < 400) {
        try {           
            if (body.status !== 'ok')
                return callback('Query failed');
            
            return callback(null, body.data);
        } catch (ex) {
            return callback(ex);
        }
    }

    return callback('Failed with status: ' + response.statusCode);
};

exports.countMovies = function (callback) {
    request({
        url: provider.get('list_movies.json?limit=1'),
        json: true
    }, function (err, response, body) {
        if (err)
            return callback(err);

        _responseHandler(response, body, function (error, data) {
            if (error)
                return callback(error);
            
            return callback(null, data.movie_count);
        });
    });
};

exports.getMovies = function (page, callback) {
    request({
        url: provider.get('list_movies.json?limit=50&page=' + page),
        json: true
    }, function (err, response, body) {
        if (err)
            return callback(err);

        _responseHandler(response, body, function (error, data) {
            if (error)
                return callback(error);

            return callback(null, data.movies);
        });
    });
};