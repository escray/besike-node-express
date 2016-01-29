module.exports = myexpress;
var url = require("url");

function myexpress() {
  return  function(req, res) {
    if (url.parse(req.url).path === '/foo') {
       res.statusCode = 404;
       res.end();  
    };
  };  
}