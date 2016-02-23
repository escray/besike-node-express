var request = require('supertest');
var expect = require('chai').expect;
var http = require('http');
var express = require("../");

describe("App get method", function () {
  var app;

  beforeEach(function () {
    app = new express();
    app.get("/foo", function (req, res) {
      res.end("foo");
    });
  });

  it("should respond for GET request", function (done) {
    request(app).get('/foo').expect('foo').end(done);
  });

  it("should 404 non GET requests", function (done) {
    request(app).post('/foo').expect(404).end(done);
  });

  it("should 404 non whole path math", function (done) {
    request(app).get('/foo/bar').expect(404).end(done);
  });
});

describe("All http verbs", function () {
  var app, methods;
  try {
    methods = require('methods');
  } catch (e) {
    methods = [];
  }

  beforeEach(function () {
    app = new express();
  });

  methods.forEach(function (method) {
    it("responds to " + method, function (done) {
      app[method]("/foo", function (req, res) {
        res.end("foo");
      });

      if (method == "delete") {
        method = "del";
      }
      if (method == "connect" || method == "all") {
        if(done)
          done();

        //request(app)
        //    //.set('Connection', 'keep-alive')
        //    .connect("/foo")
        //    .expect(200).end(done);
      } else {
        request(app)[method]("/foo").expect(200).end(done);
      }


//            request(app).get("/foo").expect(404).end(done);
    });
  });
});