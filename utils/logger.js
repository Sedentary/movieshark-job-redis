/*jslint node: true */
'use strict';

var winston = require('winston');

module.exports = function (name, label) {
    winston.loggers.add(name, {
        console: {
            level: 'silly',
            colorize: true,
            label: label
        }
    });

    return winston.loggers.get(name);
};