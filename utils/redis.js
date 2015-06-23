/*jslint node: true */

'use strict';

var log = require('./logger')('redis', 'Redis Util');
var redis = require('redis');
var url = require('url');
var redisURL = process.env.REDISCLOUD_URL ? url.parse(process.env.REDISCLOUD_URL) : null;
var client = redis.createClient(redisURL.port, redisURL.hostname, { no_ready_check: true });

client.auth(redisURL.auth.split(":")[1]);

client.on('error', function (err) {
    log.error('Redis connection error: ', err.message);
});

client.on('ready', function callback() {
    log.info("Connected to Redis!");
});

module.exports = redis;