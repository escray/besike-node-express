module.exports = myexpress;

var url = require("url");
var http = require("http");
var Layer = require("./lib/layer.js");

//var i;
function myexpress() {

  var app = function(req, res, next) {
    app.handle(req, res, next);
  }



  //app.i = 0;
  app.stack = [];

  app.resEnd = function(code) {
    res.statusCode = code;
    var msg;
    if (code == 500) {
      msg = "500 - Internal Error";
    } else if (code == 404) {
      msg = "404 - Not Found";
    }
    res.end(msg);
  }

  app.listen = function() {
    var server = http.createServer(app);
    server.listen.apply(server, arguments);
    return server;
  }

  app.use = function(path, middleware) {

    if (typeof path != 'string') {
      middleware = path;
      path = '/';
    }

    //if (middleware.use) {
    //
    //  for (var j = 0; j < middleware.stack.length; j++) {
    //    var subapp = middleware.stack[j]
    //    layer = new Layer(path + subapp.path, subapp.handle);
    //    app.stack.push(layer);
    //  }
    //app.stack.push(new Layer(path, em));
    //} else {
    //middleware = createEmbedding(middleware);
    layer = new Layer(path, middleware);
    app.stack.push(layer);

    //}
    //
    //if (typeof middleware.handle === "function") {
    //  var subApp = middleware;
    //  subApp.is_subApp = true;
    //  middleware = function (req, res, next) {
    //    subapp.handle(req, res, next);
    //  }
    //}


    //return app;
  }

  app.handle = function (req, res, next) {

    var i = 0;

    function resEnd(code, mesg) {
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

      //if (i >= app.stack.length) {
      //  if (next) {
      //    req.url = req.url_bak;
      //    next(err);
      //  }
      //  else {
      //    var code = err ? 500 : 404;
      //    resEnd(code);
      //  }
      //} else {


        //var layer = app.stack[i];
        //var middleware =layer.handle;
        //++i;



        var appstack = app.stack;


        if (err) {
          while (appstack[i] && i <= appstack.length) {
            if (appstack[i].handle.length == 4) {
              if (appstack[i].match(req.url)) {
                appstack[i].handle(err, req, res, next);
                //i++;
              }
            }
            i++;
          }
          if (i == appstack.length) {
            resEnd(500);
          }
        }
        // without error
        else {
          while (appstack[i] && i <= appstack.length) {
            var match = appstack[i].match(req.url);
            if (match && appstack[i].handle.length == 2) {
              req.params = match.params;
              appstack[i].handle(req, res);
              i++;
            } else if (match && appstack[i].handle.length == 3) {
              try {
                req.params = match.params;
                if (appstack[i].handle.handle) {
                  req.url_bak = req.url;
                  req.url = req.url.slice(match.path.length);
                  appstack[i].handle.handle(req, res, next);
                  i++;

                } else {
                  appstack[i++].handle(req, res, next);

                }
                //i++;
              }
              catch (err) {
                next(err);
              }
              //i++;
            } else {
              i++;
            }
          }

          if (i == appstack.length) {
            resEnd(404);
          }
        }

    }


    next();
  }



  return app;

  //app.handle = function(req, res, next) {
  //  if (typeof app.handle === 'function' ) {
  //    app.handle(req, res, next);
  //  } else {
  //    app(req, res, next);
  //  }
  //};
  //
  //if (app.stack[i].handle && typeof app.stack[i].handle === 'function') {
  //  app.handle = app.stack[i].handle;
  //}
  //
  //function createEmbedding(subApp) {
  //  var embed = function (req, res, next) {
  //    //if(typeof subApp.handle == 'function') {
  //    //  subApp.handle(req, res, next);
  //    //} else {
  //    subApp.next2 = next;
  //    subApp(req, res);
  //    //}
  //  }
  //
  //  return embed;
  //}
}