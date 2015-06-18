/*jslint node: true */

'use strict';

var _base = 'https://yts.to/api/v2/';

exports.base = _base;

exports.get = function (uri) {
    return _base + uri;
}
