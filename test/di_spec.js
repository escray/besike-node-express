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

  });


  describe("pass req and res to factories: ", function () {

  });


});