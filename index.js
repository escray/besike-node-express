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

      if (err) {
        while (app.stack[i] && app.stack[i].handle.length != 4) {
          i++;
        }
        if (i == app.stack.length) {
          if (app.next2) {
            app.next2(err);
          }
          resEnd(500);
          return;
        }
        ;
        if (app.stack[i]) {
          if (app.stack[i].match(req.url))
            return app.stack[i++].handle(err, req, res, next);
        }

      }
      // without error
      else {
        while (app.stack[i] &&  i <= app.stack.length) {
          if (app.stack[i].handle.length == 2) {
            if (app.stack[i].match(req.url))
              return app.stack[i].handle(req, res);
          } else if (app.stack[i].handle.length == 3 ) {





            break;
          }

          i++;


        }
        if (app.stack[i]) {
          try {
            if (app.stack[i].match(req.url))
              return app.stack[i++].handle(req, res, next);
            else
              i++;
          }
          catch (err) {
            next(err);
          }
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

