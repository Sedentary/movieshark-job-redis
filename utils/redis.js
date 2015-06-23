/*jslint node: true */

'use strict';

var log = require('./logger')('redis', 'Redis Util');
var redis = require('redis');
var url = require('url');
var redisURL = url.parse(process.env.REDISCLOUD_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname, { no_ready_check: true });

client.auth(redisURL.auth.split(":")[1]);

client.on('error', function (err) {
    log.error('Redis connection error: ', err.message);
});

client.on('ready', function callback() {
    log.info("Connected to Redis!");
});

module.exports = redis;