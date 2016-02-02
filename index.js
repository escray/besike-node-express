module.exports = myexpress;

var url = require("url");
var http = require("http");
var Layer = require("./lib/layer.js");

//var i;
function myexpress() {
  var i;
  var app = function (req, res) {
    i = 0;

    function resEnd(code) {
      res.statusCode = code;
      var msg;
      if (code == 500) {
        msg = "500 - Internal Error";
      } else if (code == 404) {
        msg = "404 - Not Found";
      }
      res.end(msg);
    }

    function next(err) {

      var appstack = app.stack;
      if (err) {
        while (appstack[i]) {
          if (appstack[i].handle.length == 4)
            if (appstack[i].match(req.url))
              return appstack[i++].handle(err, req, res, next);
          i++;
        }
        if (i == appstack.length) {
          if (app.next2) {
            app.next2(err);
          }
          resEnd(500);
          return;
        }
      }
      // without error
      else {
        while (appstack[i] && i <= appstack.length) {
          var match = appstack[i].match(req.url);
          if (match && appstack[i].handle.length == 2) {
              req.params = match.params;
              return appstack[i++].handle(req, res);

          } else if ( match && appstack[i].handle.length == 3) {
            try {
                req.params = match.params;
                return appstack[i++].handle(req, res, next);
            }
            catch (err) {
              next(err);
            }
          } else {
            i++;
          }


        }
        if (appstack[i]) {

        } else {
          if (app.next2) {
            app.next2();
          }
          resEnd(404);
        }
      }
    }

    next();
  }

  app.stack = [];


  app.listen = function () {
    var server = http.createServer(app);
    return server.listen.apply(server, arguments);
  }

  app.use = function (path, middleware) {

    if (typeof path != 'string') {
      middleware = path;
      path = '/';
    }

    if (middleware.use) {
      middleware = createEmbedding(middleware);
    }

    layer = new Layer(path, middleware);
    app.stack.push(layer);

    //return app;
  }

  function createEmbedding(subApp) {
    var embed = function (req, res, next) {
      subApp.next2 = next;
      subApp(req, res);
    }
    return embed;
  }

  return app;
}

