var http = require('http');
var Layer = require('./lib/layer.js');
var makeRoute = require('./lib/route.js');
var createInjector = require('./lib/injector.js');
var methods = require('methods');
var mime = require('mime');
var accepts = require('accepts');
var req_proto = require('./lib/request.js');
var res_proto = require('./lib/response.js');

module.exports = function () {
  var app = function (req, res, parentNext) {
    req.app = app;

    app.monkey_patch(req, res);
    app.handle(req, res, parentNext);
  };

  app.stack = [];
  app._factories = {};

  app.listen = function () {
    var server = http.createServer(app);
    server.listen.apply(server, arguments);
    return server;
  }

  app.handle = function (req, res, parentNext) {
    var i = 0;


    function errHandler(code) {
      res.statusCode = code;
      var msg = "";
      if (code == 500) {
        msg = "500 - Internal Error";
      } else if (code == 404) {
        msg = "404 - Not Found";
      }
      res.end(msg);
    }

    function next(err) {
      if (i >= app.stack.length) {

        if (parentNext) {
          req.url = req.url_bak;
          req.app = req.app_bak;
          parentNext(err);
        } else {
          var code = err ? 500 : 404;
          errHandler(code);
        }

      } else {
        var layer = app.stack[i];
        var middleware = layer.handle;
        ++i;
        try {
          var result = layer.match(req.url);
          if (!result) {
            next(err);
            return;
          }

          req.params = result.params;

          if (err && middleware.length >= 4) {
            middleware(err, req, res, next);
          } else if (!err && middleware.length < 4) {
            try {
              if (middleware.handle) {
                req.url_bak = req.url;
                req.url = req.url.slice(result.path.length);
                req.app_bak = app;
                req.app = middleware;
                middleware.handle(req, res, next);
              } else {
                middleware(req, res, next);

              }
            } catch (ee) {
              next(ee);
            }

          } else {
            next(err);
          }
        } catch (e) {
          errHandler(500);
        }
      }
    }

    next();
  }

  app.use = function (path, middleware) {
    if (typeof path != 'string') {
      middleware = path;
      path = '/';
    }

    app.stack.push(new Layer(path, middleware));
    return app;
  }

  methods.push("all");
  methods.forEach(function(method) {
    app[method] = function(path, handler) {
      app.route(path)[method](handler);
      return app;
    }
  });

  app.route = function(path) {
    var route = makeRoute();
    app.stack.push(new Layer(path, route, {end:true}));
    return route;
  }

  app.factory = function(name, func) {
    if( typeof func != 'function') {
      throw new Error('app.factory() require a function but got a ' + typeof func);
    }

    app._factories[name] = func;
  }

  app.inject = function(handler){
    return createInjector(handler, app);
  }

  app.monkey_patch = function(req, res) {

    req_proto.__proto__ = req.__proto__;
    req.__proto__ = req_proto;
    req.res = res;

    res_proto.__proto__ = res.__proto__;
    res.__proto__ = res_proto;
    res.req = req;
  }


  return app;
}



