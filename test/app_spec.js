var express = require('../');
var request = require("supertest");
var expect = require("chai").expect;
var http = require("http");

describe("app", function () {
  var app = express();
  describe("create http server", function () {

    it("responds to /foo with 404", function (done) {
      var server = http.createServer(app);
      request(server)
        .get("/foo")
        .expect(404)
        .end(done);
    });

    it('should return a function', function () {
      expect(app).to.be.a('function');
    });
  });

  describe("#listen", function () {
    // making test port configurable
    var port = process.env["TEST_PORT"] || 7001;
    var server = app.listen(port);

    it("should return an http.Server", function () {

      expect(server).to.be.instanceof(http.Server);
    });

    it("with port", function (done) {
      request("http://localhost:" + port)
        .get("/foo")
        .expect(404)
        .end(done);
    });
  });
});

describe("Building the middlewares stack", function () {
  var app;

  beforeEach(function () {
    app = express();
  });


  describe("Implement app.use", function () {
    it("should be able to add middlewares to stack", function () {
      expect(app.use).to.be.a('function');
      expect(app.stack.length).to.equal(0);
      var m1 = function () {
      };
      var m2 = function () {
      };
      app.use(m1);
      app.use(m2);
      expect(app.stack.length).to.equal(2);
    });
  });

  describe("Implement calling the middlewares", function () {
    it("should be able to call a single middleware", function (done) {
      var msg = "hello from m1";
      var m1 = function (req, res, next) {
        res.end(msg);
      };
      app.use(m1);
      request(app).get('/').expect(msg).end(done);
    });

    it("should be able to call 'next' to go to the next middleware", function (done) {
      var msg = "hello from m2";
      var m1 = function (req, res, next) {
        next();
      }
      var m2 = function (req, res, next) {
        next();
      }
      var m3 = function (req, res, next) {
        res.end(msg);
      }
      app.use(m1);
      app.use(m2);
      app.use(m3);

      request(app).get('/').expect(msg).end(done);
    });

    it("should 404 at the end of middleware chain", function (done) {
      var m1 = function (req, res, next) {
        next();
      }
      var m2 = function (req, res, next) {
        next();
      }
      app.use(m1);
      app.use(m2);

      request(app).get('/').expect(404).end(done);
    });

    it("should 404 if no middleware is added", function (done) {
      //app.stack = [];
      request(app).get('/').expect(404).end(done);
    });
  });

  describe("Implement error handling", function () {
    var app;

    beforeEach(function () {
      app = express();
    });

    it("should return 500 for unhandled error", function (done) {
      var m1 = function (req, res, next) {
        next(new Error("boom!"));
      }
      app.use(m1);
      request(app).get('/').expect(500).end(done);
    });

    it("should return 500 for uncaught error", function (done) {
      var m1 = function (req, res, next) {
        throw new Error("boom!");
      };
      app.use(m1);
      request(app).get('/').expect(500).end(done);
    });

    it("should ignore error handlers when 'next' is called without an error", function (done) {
      var m1 = function (req, res, next) {
        next();
      }
      var e1 = function (err, req, res, next) {
        // timeout
      }
      var m2 = function (req, res, next) {
        res.end("m2");
      }
      app.use(m1);
      app.use(e1);
      app.use(m2);

      request(app).get('/').expect("m2").end(done);

    });

    it("should skip normal middlewares if 'next' is called with an error", function (done) {
      var m1 = function (req, res, next) {
        next(new Error("boom!"));
      }
      var m2 = function (req, res, next) {
        // timeout
      }
      var e1 = function (err, req, res, next) {
        res.end("e1")
      }
      app.use(m1);
      app.use(m2);
      app.use(e1);

      request(app).get('/').expect("e1").end(done);
    });
  });

  describe("Implement App Embedding As Middleware", function () {
    var app;
    var subapp;

    beforeEach(function () {
      app = express();
      subApp = express();
    });

    it("should pass unhandled request to parent", function (done) {
      function m2(req, res) {
        res.end("m2");
      }

      app.use(subApp);
      app.use(m2);
      request(app).get('/').expect("m2").end(done);
    });

    it("should pass unhandled error to parent", function (done) {
      function m1(req, res, next) {
        next("m1 error");
      }

      function e1(err, req, res, next) {
        res.end(err);
      }

      subApp.use(m1);

      app.use(subApp);
      app.use(e1);

      request(app).get('/').expect("m1 error").end(done);
    })
  });

  describe("Layer class and the match method", function () {

    var app;
    var layer;
    var fn;
    var Layer = require('../lib/layer.js');

    //function m1(req, res) {
    //
    //}


    beforeEach(function () {
      app = new express();
      fn = new function () {
      };
      layer = new Layer("/foo", fn);
    });

    it("sets layer.handle to be the middleware", function () {
      expect(layer.handle).to.eql(fn);
    });

    it("returns undefined if path doesn't match", function () {
      expect(layer.match("/bar")).to.be.undefined;
    });

    it("returns matched path if layer matches the request path exactly", function () {
      expect(layer.match("/foo")).to.be.eql({path: "/foo"});
    });

    it("returns mathced prefix if the layer matches the prefix of the request path", function () {
      expect(layer.match("/foo/bar")).to.be.eql({path: "/foo"});
    });
  });

  describe("app.use should add a Layer to stack", function () {
    var app;
    var middleware;
    var layer = require("../lib/layer.js");

    beforeEach(function () {
      app = new express();
      middleware = function () {
      };
      app.use(middleware);
      app.use('/foo', middleware);
    })

    it("first layer's path should be /", function () {
      layer = app.stack[0];
      expect(layer.match('/foo')).to.not.be.undefined;

    });

    it("second layer's path should be /foo", function () {
      layer = app.stack[1];
      expect(layer.match('/foo')).to.not.be.undefined;
      expect(layer.match('/')).to.be.undefined;
    });
  });

  describe("The middlewares called should match request path: ", function () {
    var app;


    beforeEach(function () {
      app = new express();
      app.use("/foo", function (req, res) {
        res.end("/foo");
      })
      app.use("/", function (req, res, next) {
        res.end("root");
      })
    });

    it("returns root for GET /", function (done) {
      request(app).get("/").expect("root").end(done);
    });

    it("returns foo for GET /foo", function (done) {
      request(app).get("/foo").expect("/foo").end(done);
    });

    it("returns foo for Get /foo/bar", function (done) {
      request(app).get("/foo/bar").expect("/foo").end(done);
    });
  });
});

