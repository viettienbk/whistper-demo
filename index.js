'use strict'

var express = require('express');
var app = new express();

var Web3 = require('web3');

var bodyParser = require('body-parser');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(8000, function(err, data){
    console.log('localhost:8000');
});

app.get('/', function(req, res) {
    res.render('home');
});

