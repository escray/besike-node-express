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

  describe('sets status code', function() {
    it('defaults status code to 200', function(done) {
      app.use('/foo', function(req, res) {
        res.send('foo ok');
      })

      request(app).get('/foo')
        .expect(200)
        .expect('foo ok').end(done);

      //done();
    });

    it('can respond with a given status code', function(done) {
      app.use('/bar', function(req, res) {
        res.send(201, 'bar created');
      });
      request(app).get('/bar')
        .expect(201)
        .expect('bar created')
        .end(done);
    });

    it('respond with default status code body is only status code is given', function(done) {
      app.use('/201', function(req, res) {
        res.send(201);
      });
      request(app).get('/201')
        .expect(201,"Created")
        .expect(201)
        .expect('Created')
        .end(done);
    });
  })

  describe('JSON response', function() {


    it('returns a JSON as responde', function(done) {

    app.use(function(req, res) {
      res.send({foo: [1, 2, 3]});
    });
    request(app).get('/')
      .expect('Content-Type', 'application/json')
      .expect('{"foo": [1, 2, 3]}')
    done();
    })
  })
});

describe("Conditional get: ", function() {
  beforeEach(function() {
    app = express();
  });

  describe("Calculatet Etag: ", function() {

    beforeEach(function() {
      app.use('/plumless', function(req, res) {
        res.send('plumless');
      });
      app.use('/buckeroo', function(req, res) {
        res.setHeader('ETag', 'buckeroo');
        res.send('buckeroo');
      });
      app.use('/empty', function(req, res) {
        res.send("");
      });
    })

    it("generates ETag", function(done) {
      request(app).get('/plumless')
        .expect(200)
        .expect('plumless')
        .expect('ETag', '1306201125')
        .end(done);

    });

    it("doesn't generate ETag for non GET request", function(done) {
      request(app).post('/plumless')
        .expect(200)
        .expect('plumless')
        .expect(function(res) {
          expect(res.headers).to.not.have.property('etag');
        })
        .end(done);

    });

    it("doesn't generate ETag if already set", function(done) {
      request(app).get('/buckeroo')
        .expect(200)
        .expect('buckeroo')
        .expect('ETag', 'buckeroo')
        .end(done);
    });

    it("doesn't generate ETag for empty body", function(done) {
      request(app).get('/empty')
        .expect(function(res) {
          expect(res.headers).to.not.have.property("etag");
        })
        .end(done);
    });
  });

  describe("ETag 304: ", function() {
    beforeEach(function() {
      app.use('/', function(req, res) {
        res.setHeader('ETag', 'foo-v1');
        res.send('foo-v1');
      });
    });

    it("return 304 if ETag matches", function(done) {
      request(app)
        .get('/')
        .set('If-None-Match', 'foo-v1')
        .expect(304)
        .end(done);
    });

    it('returns 200 if ETag doesn\'t matches', function(done) {
      request(app).get('/')
        .set('If-None-Match', 'foo-v0')
        .expect(200, 'foo-v1')
        .end(done);
    })

  })

  describe('Last-Modified 304:', function() {
    beforeEach(function() {
      app.use(function(req, res) {
        res.setHeader('Last-Modified',
          'Wed, 2 Mar 2016 16:00:00 GMT');
        res.send('bar-2010');
      })
    })

    it('returns 304 if not modified since', function(done) {
      request(app).get('/')
        .set('If-Modified-Since', 'Wed, 2 Mar 2016 16:00:00 GMT')
        .expect(304)
        .end(done);
    })

    it('returns 200 if modified since', function(done) {
      request(app).get('/')
        .set('If-Modified-Since', 'Thu, 1 Mar 2016 16:00:00 GMT')
        .expect(200)
        .end(done);
    })
  })
});