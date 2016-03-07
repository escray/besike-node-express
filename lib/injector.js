module.exports = createInjector;

getParameters.cache = {};

function createInjector(handler, app) {
  'use strict'

  var injector = function (req, res, next) {
    var loader = injector.dependencies_loader(req, res, next);
    loader(function (err, values) {
      if (err) {
        next(err);
      } else {
        handler.apply(this, values);
      }
    });
  };

  injector.extract_params = function () {
    return getParameters(handler);
  }

  injector.dependencies_loader = function (req, res, next2) {
    var values = [];
    var params = getParameters(handler);
    var error;
    ////
    //if (!needInject(params)) {
    //  next2();
    //}


    var loader = function (fn) {

      if (!needInject(params)) {
        return fn;
      }

      for (var i = 0; i < params.length; i++) {
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

        if (app._factories[params[i]]) {
          try {
            app._factories[params[i]](req, res, next);
          } catch (err) {
            error = err;
            break;
          }
        } else {
          error = new Error("Factory not defined: " + params[i]);
          break;
        }
      }

      function next(err, dep) {
        if (err) {
          error = err;
          return;
        }
        values.push(dep);
      }

      if (error) {
        fn(error);
      } else {
        fn(error, values);
      }

    }

    return loader;
  }

  return injector;
}


function getParameters(fn) {
  var fnText = fn.toString();
  if (getParameters.cache[fnText]) {
    return getParameters.cache[fnText];
  }

  var FN_ARGS = /^function\s*[^\()]*\(\s*([^\)]*)\)/m;
  var FN_ARGS_SPLIT = /,/;
  var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
  var STRIP_COMMENTS = /((\/\/.$)|(\/\*[\s\S]*?\*\/))/mg;

  var inject = [];
  var argDecl = fnText.replace(STRIP_COMMENTS, '').match(FN_ARGS);

  argDecl[1].split(FN_ARGS_SPLIT).forEach(function (arg) {
    arg.replace(FN_ARG, function (all, underscore, name) {
      inject.push(name);
    });
  });

  getParameters.cache[fn] = inject;
  return inject;
}

function needInject(parameters) {
  var skipRules = [
    [],
    ['req'],
    ['req', 'res',],
    ['req', 'res', 'next'],
    ['err', 'req', 'res', 'next'],
    ['error', 'req', 'res', 'next']
  ];
  for (var i = 0; i < skipRules.length; ++i) {
    if (arraysEqual(skipRules[i], parameters)) {
      return false;
    }
  }
  return true;
}

function arraysEqual(arr1, arr2) {
  if (arr1 === null || arr2 === null) return false;
  if (arr1 === arr2) return true;
  if (arr1.length != arr2.length) return false;

  for (var i = 0; i < arr1.length; ++i) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

