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

describe("Implement Route Handlers Invocation: ", function(){
  var app, route;
  beforeEach(function() {
    app = express();
    route = makeRoute();
    app.use(route);
  });

  describe("calling next(): ", function(){
    it("goes to the next handler", function(done){
      route.use("get", function(req, res, next) {
        next();
      });
      route.use("get", function(req, res) {
        res.end("handler2");
      });
      request(app).get("/").expect("handler2").end(done);
    });

    it("exists the route if there's no more handler", function(done) {
      request(app).get("/").expect(404).end(done);
    })
  });

  describe("error handling:", function() {
    it("exists the route if there is an error", function(done) {
      route.use("get", function(req, res, next) {
        next(new Error("boom!"));
      });
      route.use("get", function(req, res, next) {

      });

      request(app).get("/").expect(500).end(done);
    });
  });

  describe("verb matching: ", function() {
    beforeEach(function() {
      route.use("get", function(req, res) {
        res.end("got");
      });
      route.use("post", function(req, res) {
        res.end("posted");
      });
    });

    it("matches GET to the get handler", function(done) {
      request(app).get("/").expect("got").end(done);
    });

    it("matches POST to the post handler", function(done) {
      request(app).post("/").expect("posted").end(done);
    });

    it("unmatches to the 404", function(done) {
        request(app).put("/").expect(404).end(done);
    });
  });

  describe("match any verb: ", function() {
    beforeEach(function() {
      route.use("all", function(req, res) {
        res.end("all");
      });
    });

    it("matches POST to the all hanlder", function(done) {
      request(app).post("/").expect("all").end(done);
    });

    it("match GET to the all handler", function(done) {
      request(app).get("/").expect("all").end(done);
    });
  });

  describe("calling next(route)", function() {
    beforeEach(function() {
      route.use("get", function(req, res, next) {
        next('route');
      });
      route.use("get", function() {
        throw new Error("boom");
      });

      app.use(function(req, res) {
        res.end("middleware");
      });
    });

    it("skip remaining handlers", function(done) {
      request(app).get("/").expect("middleware").end(done);
    });
  });
});

describe("Implement Verbs For Route: ", function() {
  var app, route, methods;
  try {
    methods = require("methods").concat("all");
  } catch(e) {
    methods = [];
  }

  beforeEach(function() {
    app = express();
    route = makeRoute();
    app.use(route);
  })

  methods.forEach(function(method) {
    if (method != "connect") {
      it("should respond to " + method, function (done) {
        route[method](function (req, res) {
          res.end("success!");
        });
        if (method === "delete")
          method = "del";
        if (method === "all")
          method = "get";

        request(app)[method]("/").expect(200).end(done);
      });
    }
  });

  it("should be able to chain verbs", function(done) {
    route.get(function(req, res, next) {
      next();
    }).get(function(req, res) {
      res.end("got");
    });
    request(app).get("/").expect("got").end(done);
  });
});

describe("Implement app.route ", function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  it("can create a new route", function(done) {
    var route = app.route("/foo")
      .get(function(req, res, next) {
        next();
      })
      .get(function(req, res) {
        res.end("foo");
      });

    expect(app.stack).to.have.length(1);

    request(app).get("/foo").expect("foo").end(done);
  })
});

describe("Implement Verb For App", function() {
  var app;
  try {
    methods = require("methods").concat("all");
  } catch(e) {
    methods = [];
  }

  beforeEach(function() {
    app = express();
  });

  methods.forEach(function(method) {
    if (method != "connect") {
      it("create a new route for " + method, function (done) {
        app[method]("/foo", function (req, res) {
          res.end("ok");
        });
        if (method === "delete")
          method = "del";
        if (method === "all")
          method = "get";
        request(app)[method]("/foo").expect(200).end(done);
      });
    }
  });

  it("can chain VERBS ", function(done){
    app.get("/foo", function(req, res) {
      res.end("foo");
    }).get("/bar", function(req, res) {
      res.end("bar");
    });
    expect(app.stack).to.have.length(2);
    request(app).get("/foo").expect("foo");
    request(app).get("/bar").expect("bar").end(done);
  })
});