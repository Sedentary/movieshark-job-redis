var torrentStream = require('torrent-stream');

//exports.magnetize = function (torrent) {
//    var trackers = [
//        'udp://open.demonii.com:1337',
//        'udp://tracker.istole.it:80',
//        'http://tracker.yify-torrents.com/announce',
//        'udp://tracker.publicbt.com:80',
//        'udp://tracker.openbittorrent.com:80',
//        'udp://tracker.coppersurfer.tk:6969',
//        'udp://exodus.desync.com:6969',
//        'http://exodus.desync.com:6969/announce'
//    ];
//
//    var magnet = 'magnet:?xt=urn:btih:' + torrent.hash;
//    magnet += '&dn=' + torrent.name;
//    magnet += '&tr=';
//    trackers.forEach(function () {
//
//    });
//    http://track.one:1234/announce&tr=udp://track.two:80
//};

exports.getTorrentFiles = function (magnet, callback) {
    var engine = torrentStream(magnet);

    engine.on('ready', function() {
        return callback(null, engine.files);
    });
};