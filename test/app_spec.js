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

    var m1 = function() {};
    var m2 = function() {};

  describe("Implement app.use", function() {
    it("should be able to add middlewares to stack", function(){
      expect(app.use).to.be.a('function');
      expect(app.stack.length).to.equal(0);
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

    it("should be able to call 'next' to go to the next middleware", function() {

    });

    it("should 404 at the end of middleware chain", function() {

    });

    it("should 404 if no middleware is added", function() {
      app.stack = [];

    });
  });

  
});