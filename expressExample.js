var app = require("express")();

app.use(function(req, res, next) {
  next();
});

app.use(function(req, res, next) {
  res.end("hello from the second middleware\n");
});

app.listen(4000);