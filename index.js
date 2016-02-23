var http = require('http');
var Layer = require('./lib/layer.js');
var makeRoute = require('./lib/route.js');
var methods = require('methods');

module.exports = function () {
  var app = function (req, res, parentNext) {
    app.handle(req, res, parentNext);
  }

  app.stack = [];

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

    layer = new Layer(path, middleware);
    app.stack.push(layer);
    return app;
  }

  methods.forEach(function(method) {
    app[method] = function(path, handler) {
      if (typeof path == 'function') {
        handler = path;
        path = '/';
      }
      app.stack.push(new Layer(path, makeRoute(method, handler), {end: true}));
    }
  });

  return app;
}

