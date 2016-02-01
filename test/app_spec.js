var express = require('../');
var request = require("supertest");
var expect = require("chai").expect;
var http = require("http");

describe("app", function() {
 var app = express();
  describe("create http server", function() {
    
    it("responds to /foo with 404", function(done) {
      var server = http.createServer(app);
      request(server)
        .get("/foo")
        .expect(404)
        .end(done);
    });

    it('should return a function', function() {
      expect(app).to.be.a('function');
    });
  });

  describe("#listen", function() {
    // making test port configurable
    var port = process.env["TEST_PORT"] || 7001;
    var server = app.listen(port);

    it("should return an http.Server", function(){
      
      expect(server).to.be.instanceof(http.Server);
    });

    it("with port", function(done){      
      request("http://localhost:" + port)
        .get("/foo")
        .expect(404)
        .end(done);
    });
  });
});

describe("Building the middlewares stack", function() {
    var app;

    beforeEach(function(){
      app = express();
    });

    

  describe("Implement app.use", function() {
    it("should be able to add middlewares to stack", function(){
      expect(app.use).to.be.a('function');
      expect(app.stack.length).to.equal(0);
      var m1 = function() {};
      var m2 = function() {};
      app.use(m1);
      app.use(m2);
      expect(app.stack.length).to.equal(2);
    });          
  });

  describe("Implement calling the middlewares", function(){
    it("should be able to call a single middleware", function(done) {
      var msg = "hello from m1";
      var m1 = function(req, res, next) {
        res.end(msg);
      };
      app.use(m1);
      request(app).get('/').expect(msg).end(done);
    });

    it("should be able to call 'next' to go to the next middleware", function(done) {
      var msg = "hello from m2";
      var m1 = function(req, res, next) {
        next();
      }
      var m2 = function(req, res, next) {
        res.end(msg);
      }
      app.use(m1);
      app.use(m2);

      request(app).get('/').expect(msg).end(done);
    });

    it("should 404 at the end of middleware chain", function(done) {
      var m1 = function(req, res, next) {
        next();
      }
      var m2 = function(req, res, next) {
        next();
      }
      app.use(m1);
      app.use(m2);

      request(app).get('/').expect(404).end(done);
    });

    it("should 404 if no middleware is added", function(done) {
      //app.stack = [];
      request(app).get('/').expect(404).end(done);
    });
  });

  describe("Implement error handling", function() {
      var app;

      beforeEach(function() {
        app = express();
      });

      it("should return 500 for unhandled error", function(done) {
        var m1 = function(req, res, next) {
          next(new Error("boom!"));
        }
        app.use(m1);
        request(app).get('/').expect(500).end(done);
      });

      it("should return 500 for uncaught error", function(done) {
        var m1 = function(req, res, next) {
          throw new Error("boom!");
        };
        app.use(m1);
        request(app).get('/').expect(500).end(done);
      });

      debugger;
      it("should ignore error handlers when 'next' is called without an error", function(done) {
        var m1 = function(req, res, next) {
          next();
        }
        var e1 = function(err, req, res, next) {
          // timeout
        }
        var m2 = function(req, res, next) {
          res.end("m2");
        }
        app.use(m1);
        app.use(e1);
        app.use(m2);

        request(app).get('/').expect("m2").end(done);

      });

      it("should skip normal middlewares if 'next' is called with an error", function(done) {
        var m1 = function(req, res, next) {
          next(new Error("boom!"));
        }
        var m2 = function(req, res, next) {
          // timeout
        }
        var e1 = function(err, req, res, next) {
          res.end("e1")
        }
        app.use(m1);
        app.use(m2);
        app.use(e1);

        request(app).get('/').expect("e1").end(done);
      });
  });  
});