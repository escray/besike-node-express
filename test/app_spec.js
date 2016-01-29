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
  })
});