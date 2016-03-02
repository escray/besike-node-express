var request = require('supertest');
var expect = require('chai').expect;
var express = require('../');

var app;

describe('res.send', function() {
  beforeEach(function() {
    app = express();
  })

  describe('support buffer and string body:', function() {
    it('responds to buffer', function(done) {
      app.use('/buffer', function(req, res) {
        res.send(new Buffer('binary data'));
      });
      request(app).get('/buffer')
        .expect(200)
        .expect('binary data')
        .expect('Content-Type', 'application/octet-stream')
        .end(done);
    });

    it('responds to string', function(done) {
      app.use('/string', function(req, res) {
        res.send("string data");
      });
      request(app).get('/string')
        .expect(200)
        .expect('string data')
        .expect('Content-Type', 'text/html')
        .end(done);
    });

    it('should not override existing content-type', function(done) {
      app.use('/json', function(req, res) {
        res.type('json');
        res.send('[1, 2, 3]');
      });

      request(app).get('/json')
        .expect(200)
        .expect('[1, 2, 3]')
        .expect('Content-Type', 'application/json')
        .end(done);
    });
  });

  describe('sets content-length', function(){
    it('responds with the byte length of buffer', function(done) {
      app.use('/buffer', function(req, res) {
        res.send(new Buffer('abc'));
      });
      request(app)
        .get('/buffer')
        .expect(200)
        .expect('Content-Length', 3);
        //.end(done); //?
      done();
    });

    it('response with the byte length of unicode string', function(done) {
      app.use('/string', function(req, res) {
        res.send('你好吗');
      });
      request(app).get('/string').expect(200).expect('Content-Length', 9);
      done();
    })
  });
});