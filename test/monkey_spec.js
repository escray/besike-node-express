var request = require("supertest");
var expect = require("chai").expect;
var http = require("http");

var express = require("../")
var app;

describe("Monkey patch req and res", function() {
  beforeEach(function() {
    app = express();
  });

  it("add isExpress to req and res", function(done) {
    var _req, _res;
    app.use(function(req, res) {
      app.monkey_patch(req, res);
      _req = req;
      _res = res;
      res.end(req.isExpress + ", " + res.isExpress);
    });

    request(app).get("/").expect("true, true").end(function() {

      expect(_res).to.not.have.ownProperty('isExpress');
      expect(_req).to.not.have.ownProperty('isExpress');
      done();
    });
  })
})

describe("Monkey patch before serving", function() {
  beforeEach(function() {
    app = express();
  });

  it("adds isExpress to req and res", function(done) {
    app.use(function(req, res) {
      res.end(req.isExpress + ", " + res.isExpress);
    })

    request(app).get("/").expect("true, true").end(done());
  })
})

describe("Setting req.app", function() {

  beforeEach(function() {
    app = express();

  });

  it("sets req.app when entering an app" , function(done) {
    var _app;
    app.use(function(req, res, next) {
      _app = req.app;
      res.end("ok");
    });
    request(app).get("/").expect(200).end(function() {
      expect(_app).to.equal(app);
      done();
    });
  });

  it("resets req.app to parent app when exiting a subapp", function(done) {
    var _app, _subapp, _app2;
    var subapp = express();
    subapp.use(function(req, res, next) {
      _subapp = req.app;
      next();
    });

    app.use(subapp);
    app.use(function(req, res, next) {
      _app = req.app;
      next();
    })

    app.use(subapp);
    app.use(function(req, res) {
      _app2 = req.app;
      res.end("ok");
    });

    request(app).get('/').expect(200).end(function() {
      expect(_app).to.equal(app, "req.app is not restored to parent");
      expect(_subapp).to.equal(subapp);
      expect(_app2).to.equal(app);
      done();
    });
  });
})

describe("req.res and res.req", function() {
  beforeEach(function() {
    app = express();
  })

  it("makes request and response accessible to each other" , function(done) {
    var _res, _req;
    app.use(function(req, res) {
      _res = res;
      _req = req;
      res.end("ok")
    });

    request(app).get('/').expect(200).end(function() {
      expect(_req.res).to.equal(_res, "req.res is not response");
      expect(_res.req).to.equal(_req, "res.req is not request");
      done();
    });
  });
});

describe("HTTP redirect: ", function() {
  beforeEach(function() {
    app = express();
    app.use("/foo", function(req, res) {
      res.redirect("/baz");
    });
    app.use('/bar', function(req, res) {
      res.redirect(301, '/baz');
    })
  });

  it("redirects with 302 by default", function(done) {
    request(app).get('/foo')
      .expect(302)
      .expect("Location", "/baz").end(done);
  });

  it("redirects with the given status code", function(done) {
    request(app).get('/bar')
      .expect(301)
      .expect("Location", "/baz").end(done);
  });

  it("returns empty body", function(done) {
    request(app).get('/foo')
      .expect(302, "")
      .expect("Content-Length", 0).end(done);
  });
});