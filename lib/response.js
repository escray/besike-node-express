var http = require('http');
var mime = require('mime');
var accepts = require('accepts');

var proto = { };

proto.isExpress = true,

proto.type = function(name) {
  this.setHeader('Content-Type', mime.lookup(name));
},

proto.default_type = function(name) {
  if (!this.getHeader('Content-Type')) {
    this.setHeader('Content-Type', mime.lookup(name));
  }
},

proto.format = function(arr){
  var accept = accepts(this.req);
  var keys = Object.keys(arr);
  var type = accept.types(keys);

  if(arr[type]) {
    this.setHeader('Content-Type', mime.lookup(type));
    arr[type]();
  } else {
    this.statusCode = 406;
    this.end("Not Acceptable");
  }
}

proto.redirect = function(path) {
  var address, status;

  address = path;
  status = 302;

  if (arguments.length === 2) {
    if (typeof arguments[0] === 'number') {
      status = arguments[0];
      address = arguments[1];
    } else {
      // deprecate ?
      address = arguments[0];
      status = arguments[1];
    }
  }

  this.setHeader('Location', address);
  this.setHeader('Content-length', 0);
  this.statusCode = status;
  this.end();
}
proto.__proto__ = http.ServerResponse.prototype;

module.exports = proto;