var express = require('../');
var request = require('supertest');
var expect = require('chai').expect;
var layer = require('../lib/layer.js');
var http = require('http');

var inject;

try {
  inject = require('../lib/injector');
} catch(e) {

}

describe('app.factory', function() {
  var app, fn, getStatus;

  beforeEach(function() {
    app = express();
    fn = function() {};
    app.factory("foo", fn);


    getStatus = function(req, res, next) {
      next(null, 'ok');
    };
    app.factory('status', getStatus);
  })



  it('should add a factory in app._factories', function(){
    expect(app._factories).to.be.an('object');
    //expect(app._factories).to.be.an('object');
    console.log(typeof app._factories);
    expect(app._factories).to.have.property("foo", fn);
    expect(app._factories).to.have.property("status", getStatus)
  })
});

describe("Handler Dependencies Analysis", function() {
  var handler, func1, func2;
  beforeEach(function() {
    handler = function(foo, bar, baz){};

    func1 = function() {};
    func2 = function(a) {};
  });

  it('extracts the parameter names', function() {
    expect(inject(func1).extract_params()).to.deep.equal([]);
    expect(inject(func2).extract_params()).to.deep.equal(["a"]);
    expect(inject(handler).extract_params()).to.deep.equal(["foo", "bar", "baz"]);
  });
});

describe("load named dependencies", function() {
  var app, handler, loader, injector;

  function load(handler, callback) {
    injector = inject(handler, app);
    loader = injector.dependencies_loader();
    loader(callback);
  }

  beforeEach(function() {
    app = express();



    app.factory("foo", function(req, res, next) {
      next(null, "foo value");
    });
    app.factory("bar", function(req, res, next) {
      next(null, "bar value");
    });

    handler = function(bar, foo) {};
  })

  it("loads values", function(){

    load(handler, function(err, values) {
      expect(values).to.deep.equal(["bar value", "foo value"]);
    });


   // expect(loader(function(err, values){})).to.deep.equal(["var value", "foo value"]);
  });
});