module.exports = myexpress;
var url = require("url");
var http = require("http");

function myexpress() {

  

  var app = function(req, res) {
    if (url.parse(req.url).path === '/foo') {
        res.statusCode = 404;
        res.end();  
    };
  }

  app.listen = function() {
    var server = http.createServer(app);
    return server.listen.apply(server, arguments);    
  }

  app.stack = [];

  app.use = function(middleware) {
    app.stack.push(middleware);
  }

  return app; 
}