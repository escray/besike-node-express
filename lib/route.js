module.exports = makeRoute;

function makeRoute(verb, handler) {
  var route =  function(req, res, next) {
    if( req.method.toUpperCase() === verb.toUpperCase()) {
      handler(req, res, next);
    } else {
      next();
    }
  };

  route.stack = [];

  route.use = function(verb, handler) {
    route.stack.push({verb:verb, handler:handler});
  }

  return route;
}



