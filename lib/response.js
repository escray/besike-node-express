var http = require('http');
var mime = require('mime');
var proto = {};
proto.isExpress = true;
proto.__proto__ = http.ServerResponse.prototype;
module.exports = proto;