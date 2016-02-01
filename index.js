module.exports = myexpress;

var url = require("url");
var http = require("http");

function myexpress() {

  

  var app = function(req, res) {

    function resEnd(code, err) {
      res.statusCode = code;
      var msg;
      if (code == 500) {
        if (app.next2) {
          app.next2(err);
        }
        msg = "500 - Internal Error";
      } else if (code == 404) {
        //console.log(app.next2)
        if (app.next2) {        
            app.next2();
        }
        msg = "404 - Not Found";
      }
      res.end(msg);
    }


    if (url.parse(req.url).path === '/foo') {
        // res.statusCode = 404;
        // res.end("404 - Not Found");  
        resEnd(404);
    };

    function next(err) {




      if (err) {
        // res.statusCode = 500;
        // res.end();
        // if (i == app.stack.length) {
        //   resEnd(500);
        //   return;
        // };
        // resEnd(500);
        while (app.stack[i] && app.stack[i].length != 4) {
            i++;
            // if (app.stack[i].length == 2) {
            //    return app.stack[i++](req, res);

            //  } else {
            //    i++;
            //  }
        }
        if (i == app.stack.length) {
              resEnd(500, err);
              return;
        };
        if (app.stack[i]) {
          return app.stack[i++](err, req, res, next);
        }

      }
      else {
        while (app.stack[i] && app.stack[i].length != 3) {
            if (app.stack[i].length == 2) {
               return app.stack[i++](req, res);
             } else {
               i++;
             }
           //i++;
        }
        if (app.stack[i]) {
          try {
            return app.stack[i++](req, res, next);          
          }
          catch (err) {
            next(err);
          }
        } else {

          resEnd(404);
        }        
      }



    }

    next();

  }

  app.listen = function() {
    var server = http.createServer(app);
    return server.listen.apply(server, arguments);    
  }

  app.stack = [];
  var i = 0;

  app.use = function(middleware) {
    if (! middleware.use) {
      app.stack.push(middleware);  
    } else {
      var em = createEmbedding(middleware);
      app.stack.push(em);
    }
    return app;    
  }

  function createEmbedding(subApp) {
    var embed = function(req, res, next) {
      subApp.next2 = next;
      subApp(req, res);
    }
    return embed;
  }

  return app; 
}

