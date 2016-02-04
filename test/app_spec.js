var express = require('../');
var request = require("supertest");
var expect = require("chai").expect;
var http = require("http");
var Layer = require('../lib/layer.js');

describe("app", function () {
  var app = new express();
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
    app = new express();
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
      app = new express();
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
    var subApp;

    beforeEach(function () {
      app = new express();
      subApp = new  express();
    });

    it("should pass unhandled request to parent", function (done) {
      function m2(req, res, next) {
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
      expect(layer.match("/foo")).to.not.be.undefined;
      expect(layer.match("/foo")).to.have.property("path", "/foo");
    });

    it("returns mathced prefix if the layer matches the prefix of the request path", function () {
      expect(layer.match("/foo/bar")).to.not.be.undefined;
      expect(layer.match("/foo/bar")).to.have.property("path", "/foo");
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
      app.use("/foo", function (req, res, next) {
        res.end("/foo");
      })
      app.use("/", function (req, res) {
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

  describe("The error handlers called should match request path:", function() {
    var app;
    beforeEach(function() {
      app = new express();

      app.use("/foo", function(req, res, next) {
        throw "boom!";
      });

      app.use("/foo/a", function(err, req, res, next) {
        res.end("error handled /foo/a");
      });

      app.use("/foo/b", function(err, req, res, next) {
        res.end("error handled /foo/b");
      })
    });

    it("handles error with /foo/a", function(done) {
      request(app).get('/foo/a').expect("error handled /foo/a").end(done);
    });

    it("handles error with /foo/b", function(done) {
      request(app).get('/foo/b').expect("error handled /foo/b").end(done);
    });

    it("returns 500 for /foo", function(done) {
      request(app).get('/foo').expect(500).end(done);
    });
  });

  describe("Path parameters extraction", function(){
    var app;
    var layer;
    var middleware;
    beforeEach(function(){
      app = new express();
      middleware = function() {};
      layer = new Layer("/foo/:a/:b", middleware)

    });
    it("returns undefined for unmatched path", function() {
      expect(layer.match("/foo")).to.be.undefined;
      expect(layer.match("/bar")).to.be.undefined;
    });

    it("returns undefined if there isn't enough parameters", function() {
      expect(layer.match("/foo/apple")).to.be.undefined;
    });

    it("returns match data for exact match", function() {
      var match = layer.match("/foo/apple/xiaomi");
      expect(match).to.not.be.undefined;
      expect(match).to.have.property("path", "/foo/apple/xiaomi");
      expect(match.params).to.deep.equal({a:"apple", b:"xiaomi"});
    });

    it("returns match data for prefix match", function() {
      var match = layer.match("/foo/apple/samsung/xiaomi/htc");

      expect(match).to.not.be.undefined;
      expect(match).to.have.property("path", "/foo/apple/samsung");
      expect(match.params).to.deep.equal({a:"apple", b:"samsung"});
    });

    it("should decode uri encoding", function(){
      var match = layer.match("/foo/apple/xiao%20mi");
      expect(match.params).to.deep.equal({a: "apple", b: "xiao mi"});
      match = layer.match("/foo/app%20le/xiao%20mi");
      expect(match.params).to.deep.equal({a:"app le", b:"xiao mi"});

      layer = new Layer('/');
      expect(layer.match("/ab%20cd")).to.not.be.undefined;
    });

    it("should strip trialing slash", function(){
      layer = new Layer('/');
      expect(layer.match("/foo")).to.not.be.undefined;
      expect(layer.match('/')).to.not.be.undefined;

      layer = new Layer('/foo/');
      expect(layer.match('/foo/')).to.not.be.undefined;
      expect(layer.match('/foo')).to.not.be.undefined;
    });
  });

  describe("Implement req.params", function(){
    var app;
    beforeEach(function() {
      app = new express();
      app.use("/foo/:a", function(req, res, next) {
        res.end(req.params.a);
      });
      app.use("/foo", function(req, res, next) {
        res.end("" + req.params.a);
      })
    })

    it("should make path parameters accessible in req.params", function(done) {
      request(app).get('/foo/google').expect("google").end(done);
    });

    it("should make {} the default for req.params", function(done) {
      request(app).get('/foo').expect("undefined").end(done);
    });
  });

  describe("app should have the handle method", function(){
    var app;
    var subApp;
    beforeEach(function() {
      app = new express();
      //subApp = new express();

    });
    it("should have the handle method", function() {
      expect(app.handle).to.be.a("function");
    });
  });

  describe("Prefix path trimming", function() {
    var app;
    var subApp;
    beforeEach(function() {
      app = new express();
      subApp = new express();

      function subAppFunc (req, res){
        res.end("embedded app: " + req.url);
      }

      subApp.use("/bar", subAppFunc);
      app.use("/foo", subApp);

      function AppFunc(req, res) {
        res.end("handler: " + req.url)
      }

      app.use("/foo", AppFunc);
    });

    it("trims request path prefix when calling embedded app", function(done) {

      request(app).get("/foo/bar").expect("embedded app: /bar").end(done);
    });

    it("restore trimmed request path to original when going to the next middleware ensures leading slash", function(done) {
      request(app).get("/foo").expect("handler: /foo").end(done);
    });

    it("ensures that first char is / for trimmed path", function(done) {

      var app, subapp, barapp;
      app = new express();
      subapp = new express();
      barapp = new express();

      subapp.use("/bar",function(req,res) {
        res.end("embedded app: "+req.url);
      });

      app.use("/foo",subapp);
      app.use("/foo",function(req,res) {
        res.end("handler: "+req.url);
      });

      barapp.use("/",function(req,res) {
        res.end("/bar");
      });
      app.use("/bar",barapp);

      request(app).get("/bar").expect("/bar");
      request(app).get("/bar/").expect("/bar").end(done);
    });
  });
});

