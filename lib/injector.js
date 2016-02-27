module.exports = createInjector;

function createInjector(handler, app) {
  var injector = function(req, res, next) {
    var loader = injector.dependencies_loader(req, res, next);
    loader(function(err, values) {

    });
  };

  injector.extract_params = function() {
    return getParameters(handler);
  }

  injector.dependencies_loader = function(req, res, next2) {
    var values = [];
    var params = getParameters(handler);
    var error;
    var loader = function(fn) {
      for(var i = 0; i< params.length; i++) {
        if (params[i] === 'req') {
          values.push(req);
          continue;
        } else if (params[i] === 'res') {
          values.push(res);
          continue;
        } else if (params[i] === 'next') {
          values.push(next2);
          continue;
        }

        if(app._factories[params[i]]) {
          try {
            app._factories[params[i]](req, res, next);
          } catch(err) {
            error = err;
            break;
          }
        } else {
          error = new Error("Factory not defined: " + params[i]);
          break;
        }

      }
    }
    return loader;
  }

  return injector;
}

getParameters.cache = {};

function getParameters(fn) {
  var fnText = fn.toString();
  if(getParameters.cache[fnText]) {
    return getParameters.cache[fnText];
  }

  var FN_ARGS         = /^function\s*[^\()]*\(\s*([^\)]*)\)/m;
  var FN_ARGS_SPLIT   = /,/;
  var FN_ARG          = /^\s*(_?)(\S+?)\1\s*$/;
  var STRIP_COMMENTS  = /((\/\/.$)|(\/\*[\s\S]*?\*\/))/mg;

  var inject = [];
  var argDecl = fnText.replace(STRIP_COMMENTS, '').match(FN_ARGS);

  argDecl[1].split(FN_ARGS_SPLIT).forEach(function(arg) {
    arg.replace(FN_ARG, function(all, underscore, name) {
      inject.push(name);
    });
  });

  getParameters.cache[fn] = inject;
  return inject;
}

