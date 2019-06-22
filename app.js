var express = require('express');
var monk = require('monk');
var db = monk('localhost:27017/shapes')
var app = express();

var shapesRouter = require('./routes/shapes');

app.use(function(req, res, next){
    req.db = db;
    next();
});
app.use(express.static(__dirname + '/public'));
app.use('/shapes', shapesRouter);
app.use('/scripts', express.static(__dirname + '/node_modules/'));


module.exports = app;