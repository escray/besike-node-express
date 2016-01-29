var app = require("express")();

app.use(function(req, res, next) {
  var error = new Error("an error");
  next(error);
});

app.use(function(req, res, next) {
  console.log("second middleware\n");
  next();
});

app.use(function(error, req, res, next) {
  console.log("first error handler\n");
  next(error);
});

app.use(function(req, res, next) {
  console.log("third middleware\n");
});

app.use(function(error, req, res, next) {
  console.log("second error handler\n");
  res.end("hello from the second middleware\n");
});

app.listen(4000);