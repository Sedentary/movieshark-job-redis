/*jslint node: true */

'use strict';

var _base = 'http://eztvapi.re/';

exports.base = _base;

exports.get = function (uri) {
    return _base + uri;
};