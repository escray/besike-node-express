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

  app.listen = function(port, done) {

    var server = http.createServer(app).listen(port);
    if (done) {
      done();
    }
    return server;   
  }

  return app; 
}