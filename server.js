
var express = require('express');
require('dotenv').config();
var bodyParser = require('body-parser');
var app = express();
var session = require('express-session');
var sessionStore = new session.MemoryStore;

app.set('view engine', 'ejs');

app.use(session({
    cookie: { maxAge: 60000 },
    store: sessionStore,
    saveUninitialized: true,
    resave: 'true',
    secret: 'secret'
}));
app.use(function(req, res, next){
  // if there's a flash message in the session request, make it available in the response, then delete it
  res.locals.sessionFlash = req.session.sessionFlash;
  delete req.session.sessionFlash;
  next();
});
var { mongoDB } = require('./config');
// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

app.use(bodyParser.json({
  limit: '50mb'
}));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(__dirname + '/mdb'));
app.use('/api', require('./api'));
app.use(require('./routes'));

// connection and express server
console.log('Connection established');
mongoDB.connection();
var server = app.listen(port, async function () {
  console.log("Express server listening on port " + app.get('port'));
});