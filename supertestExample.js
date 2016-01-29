var request = require('supertest');
var express = require('express');

var app = express();

app.get('/usr', function(req, res) {
  res.status(200).json({name: 'tobi'});
});


describe('GET /user', function() {
  it('response with json', function(done){
    request(app)
    .get('/usr')
    //.set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect('Content-Length', '15')
    .expect(200, done);
    // .end(function(err, res) {
    //   if (err) throw err;
    // });    
  })
});