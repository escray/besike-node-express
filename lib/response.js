var http = require('http');
var mime = require('mime');
var accepts = require('accepts');
var http = require('http');
var crc32 = require('buffer-crc32');

var proto = { };

proto.isExpress = true,

proto.type = function(name) {
  this.setHeader('Content-Type', mime.lookup(name));
},

proto.default_type = function(name) {
  if (!this.getHeader('Content-Type')) {
    this.type(name);
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

proto.send = function(data) {
 var status = 200;


  if (arguments.length === 2) {
    if (typeof arguments[0] !== 'number' && typeof arguments[1] === 'number') {
      status = arguments[1];
    } else {
      status = arguments[0];
      data = arguments[1];
    }
  } else if (arguments.length === 1 && typeof data === 'number') {
    status  = arguments[0];
    data = http.STATUS_CODES[status];
  }

  switch (typeof data) {
    case 'string':
      this.default_type('htm');
      this.setHeader('Content-Length', data.length);

      break;
    case 'boolean':
    case 'number':
    case 'object':
      if(data === null) {
        data = http.STATUS_CODES[status];
      }
      else if (Buffer.isBuffer(data)) {
        this.default_type('bin');
        this.setHeader('Content-Length', Buffer.byteLength(data));
      }
      else {
        this.default_type('json');
        this.send(JSON.stringify(data));
      }
      break;
  }

  if (this.req.method.toUpperCase() === 'GET') {

    var etag = this.getHeader('Etag');

    if (!etag && data !== '') {
      etag = crc32.unsigned(data);
      this.setHeader('ETag', etag);
    }

    if (this.req.headers['if-none-match'] == etag) {
      status = 304;
    }

    var reqDate = Date.parse(this.req.headers['if-modified-since']);
    var resDate = Date.parse(this.getHeader('Last-Modified'));

    if (reqDate >= resDate){
      status = 304;
    }


  }

  this.statusCode = status;
  this.end(data);
}
proto.__proto__ = http.ServerResponse.prototype;

module.exports = proto;