module.exports = Layer;
var p2re = require("path-to-regexp");

function Layer(path, middleware) {
  this.handle = middleware;

  if( path[path.length - 1] === '/') {
    this.path = path.slice(0, -1);
  } else {
    this.path = path;
  }
}


Layer.prototype.match = function (str) {

  var names = [];
  var url = decodeURIComponent(str);
  re = p2re(this.path, names, {end: false});

  if (re.test(url)) {
    var m = re.exec(url);

    if (m) {
      var o = new Object();
      var params = new Object();
      for (var i = 1; i < m.length; i++) {
        params[names[i - 1].name] = m[i];
      }
      o.path = m[0];
      o.params = params;
      return o;
    }
  }
  //else {
  //  return undefined;
  //}
}
