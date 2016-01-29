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
    })
  });
});