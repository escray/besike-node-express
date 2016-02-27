var express = require('../');
var request = require('supertest');
var expect = require('chai').expect;
var layer = require('../lib/layer.js');
var http = require('http');

var inject;

try {
  inject = require('../lib/injector');
} catch (e) {

}

describe('app.factory', function () {
  var app, fn, getStatus;

  beforeEach(function () {
    app = express();
    fn = function () {
    };
    app.factory("foo", fn);


    getStatus = function (req, res, next) {
      next(null, 'ok');
    };
    app.factory('status', getStatus);
  })


  it('should add a factory in app._factories', function () {
    expect(app._factories).to.be.an('object');
    //expect(app._factories).to.be.an('object');
    console.log(typeof app._factories);
    expect(app._factories).to.have.property("foo", fn);
    expect(app._factories).to.have.property("status", getStatus)
  })
});

describe("Handler Dependencies Analysis", function () {
  var handler, func1, func2;
  beforeEach(function () {
    handler = function (foo, bar, baz) {
    };

    func1 = function () {
    };
    func2 = function (a) {
    };
  });

  it('extracts the parameter names', function () {
    expect(inject(func1).extract_params()).to.deep.equal([]);
    expect(inject(func2).extract_params()).to.deep.equal(["a"]);
    expect(inject(handler).extract_params()).to.deep.equal(["foo", "bar", "baz"]);
  });
});

describe("Implement Dependencies Loader", function () {

  var app, injector, loader;

  beforeEach(function () {
    app = express();
  });

  function load(handler, callback) {
    injector = inject(handler, app);
    loader = injector.dependencies_loader();
    loader(callback);
  }

  describe("load named dependencies", function () {
    var handler;

    beforeEach(function () {
      app.factory("foo", function (req, res, next) {
        next(null, "foo value");
      });
      app.factory("bar", function (req, res, next) {
        next(null, "bar value");
      });

      handler = function (bar, foo) {
      };
    })

    it("loads values", function () {
      load(handler, function (err, values) {
        expect(values).to.deep.equal(["bar value", "foo value"]);
      });
    });
  });

  describe("dependcies error handling: ", function () {
    beforeEach(function () {
      app.factory("foo", function (req, res, next) {
        next(new Error("foo error"));
      });

      app.factory("bar", function (req, res, next) {
        throw new Error("bar error");
      });
    });

    it("gets error returned by factory", function (done) {
      function handler(foo) {};
      load(handler, function(err) {
        expect(err).to.be.instanceof(Error);
        expect(err.message).to.equal("foo error");
      });

      done();
    });

    it("gets error thrown by factory", function (done) {
      function handler(bar) {};
      load(handler, function(err) {
        expect(err).to.be.instanceof(Error);
        expect(err.message).to.equal("bar error");
      });
      done();
    })

    it("gets error if factory is not defined", function (done) {
      function handler(baz) {};
      load(handler, function(err) {
        expect(err).to.be.instanceof(Error);
        expect(err.message).to.be.equal("Factory not defined: baz");
      });
      done();
    })
  });

  describe("load bulitin dependencies: ", function () {
    it("can load req, res, and next", function(done) {
      var req = 1, res = 2, next = 3;
      function handler(next, req, res) { };
      injector = inject(handler, app);
      loader = injector.dependencies_loader(req, res, next);
      loader(function(err, values) {
        expect(values).to.deep.equal([3, 1, 2]);
      });
      done();
    })
  });

  describe("pass req and res to factories: ", function () {
    it("can calls factories with req, res", function(done) {
      var req = 1, res = 2;
      app.factory("foo", function(req, res, callback) {
        callback(null, [req, res, "foo"]);
      });
      function handler(foo) {};

      injector = inject(handler, app);
      loader = injector.dependencies_loader(req, res);
      loader(function(err, values) {
        var args = values[0];
        expect(args[0]).to.equal(req);
        expect(args[1]).to.equal(res);
      });
      done();
    })
  });
});

describe("Implement Injector Invokation: ", function() {
  var app, injector, handler, loader;
  beforeEach(function(){
    app = express();
    app.factory("foo", function(req, res, next) {
      next(null, "foo value");
    });

  });

  it("can call injector as a request handler", function(done) {
    var req = 1, res = 2, next = 3;
    function handler(res, foo) {
      expect(res).to.equal(2);
      expect(foo).to.equal("foo value");
    };
    injector = inject(handler, app);
    injector(req, res, next);

    done();
  });

  it("call next with error if injection failse", function(done) {
    var req = 1, res = 2;
    function next(err) {
      expect(err).to.be.instanceof(Error);
      expect(err.message).to.equal("Factory not defined: unknow_dep");
    }

    function handler(unknown_dep) {};
    injector = inject(handler, app);
    injector(req, res, next);

    done();
  });
});

describe("Implement app.inject", function() {
  var app;
  beforeEach(function() {
    app = express();
    app.factory("foo", function(res, req, callback) {
      callback(null, "hello from foo DI!");
    });

  })
  it("can create an injector", function(done) {
    app.use(app.inject(function (res, foo) {
      res.end(foo);
    }));
    request(app).get("/").expect("hello from foo DI!");
    done();
  });
})