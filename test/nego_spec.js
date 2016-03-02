var request = require('supertest');
var expect = require('chai').expect;
var mime = require('mime');
var express = require('../');

var app;
var chunk = "[1, 2, 3]";

describe("Setting Content-Type", function() {
  beforeEach(function() {
    app = express();
  });

  it("sets the content-type", function(done) {
    app.use(function(req, res) {
      res.type("json");
      res.end(chunk);
    })
    request(app).get('/')
      .expect(chunk)
      .expect('Content-Type', 'application/json')
      .end(done);
  });

  it("sets the default content type", function(done) {
    app.use(function(req, res) {
      res.default_type("text");
      res.default_type("json");
      res.end(chunk);
    })

    request(app).get('/')
      .expect(chunk)
      .expect('Content-Type', 'text/plain')
      .end(done);
  });
});

describe("res.format", function() {
  beforeEach(function() {
    app = express();
  })

  describe("Response with different formats", function() {
    beforeEach(function() {
    app.use(function(req, res) {
      res.format({
        text: function() {
          res.end("text hello");
        },
        html: function() {
          res.end("html<b>hello</b>");
        }
      });
    });
    })

    it("responds to text request", function(done) {
      request(app).get('/')
        .set("Accept", "text/plain, text/html")
        .expect("text hello")
        .expect("Content-Type", "text/plain")
        .end(done);
    });

    it("responds to html request", function(done) {
      request(app).get('/')
        .set("Accept", "text/html, text/plain")
        .expect("html<b>hello</b>")
        .expect("Content-Type", "text/html")
        .end(done);
    })
  });

  it ("responds with 406 if there is no matching type", function(done) {
    app.use(function(req, res) {
      res.format({});
    });
    request(app).get('/').expect(406).end(done);
  })

})