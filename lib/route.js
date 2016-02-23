module.exports = makeRoute
var methods = require('methods');

function makeRoute() {
  var route =  function(req, res, parentNext) {

    var routeIndex;

    (function startRoute() {
      routeIndex = 0;
      try {
        next();
      } catch(e) {
        parentNext(e);
      }
    }());

    function next(err) {
      if (err) {
        if (err === 'route') {
          parentNext();
        } else {
          parentNext(err);
        }
      }

      if (route.stack && route.stack[0]) {
        if (route.stack.length === routeIndex) {
          parentNext();
        } else {
          var current = route.stack[routeIndex];
          routeIndex++;

          if(current.verb.toUpperCase() === 'ALL' ||
            current.verb.toUpperCase() === req.method.toUpperCase()) {
            current.handler(req, res, next);
          } else {
            next();
          }
        }
      } else {
        parentNext();
      }
    }
  };

  route.stack = [];

  route.use = function(verb, handler) {
    route.stack.push({verb:verb, handler:handler});
  }

  methods.push("all");
  methods.forEach(function(verb){
    route[verb] = function(handler) {
      route.use(verb, handler);
      return route;
    }
  });

  return route;
}



