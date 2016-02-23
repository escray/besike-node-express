var request = require("supertest");
var expect = require("chai").expect;
var http = require("http");

var express = require("../");
var makeRoute = require("../lib/route");

describe("Add handlers to a route:", function() {
  var route, handler1, handler2;
  before(function() {
    route = makeRoute();
    handler1 = function() {};
    handler2 = function() {};
    route.use("get", handler1);
    route.use("post", handler2);
  });

  it("add multiple handlers to route", function() {
    expect(route.stack).to.have.length(2);
  });

  it("pushes action object to the stack", function() {
    var action = route.stack[0];
    expect(action).to.have.property("verb", "get");
    expect(action).to.have.property("handler", handler1);

    action = route.stack[1];
    expect(action).to.have.property("verb", "post");
    expect(action).to.have.property("handler", handler2);
  })

  //it("add multiple HTTP verb handlers to a route", function() {
  //  app = new express();
  //  route = app.route("/foo");
  //  route.get(function(req, res) {
  //    res.end("got foo");
  //  });
  //  route.post(function(req, res) {
  //    res.end("posted to foo");
  //  });
  //
  //  request(app).get("/foo").expect("got foo").end(done);
  //
  //});


});