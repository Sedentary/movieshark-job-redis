exports.endsWith = function (name, end) {
    return name.indexOf(end) !== -1;
};

exports.getPrecision = function (number) {
    var s = number + '',
        d = s.indexOf('.') + 1;

    return !d ? 0 : s.length - d;
};