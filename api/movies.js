'use strict';

var request = require('request');
var provider = require('../providers/movie');

var _responseHandler = function (response, body, callback) {
    var err = null,
        data = null;

    if (response.statusCode >= 200 && response.statusCode < 400) {
        try {
            data = JSON.parse(body);
            if (data.status !== 'ok') {
                err = 'Query failed';
            } else {
                data = data.data;
            }
        } catch (ex) {
            err = ex.message;
        }
    } else {
        err = 'Failed with status: ' + response.statusCode
    }

    callback(err, data);
};

exports.countMovies = function (callback) {
    var url = provider.get('list_movies.json?limit=1');
    request(url, function (err, response, body) {
        var count = null;

        if (!err) {
            _responseHandler(response, body, function (error, data) {
                if (error) {
                    err = error;
                } else {
                    count = data.movie_count;
                }
            });
        }

        return callback(err, count);
    });
};

exports.getMovies = function (page, callback) {
    var url = provider.get('list_movies.json?limit=50&page=' + page);
    request(url, function (err, response, body) {
        var movies = null;

        if (!err) {
            _responseHandler(response, body, function (error, data) {
                if (error) {
                    err = error;
                } else {
                    movies = data.movies;
                }
            });
        }

        return callback(err, movies);
    });
};