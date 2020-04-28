const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const redis   = require("redis");
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const client = redis.createClient();

var socket = require('socket.io');

const multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage});

const bodyParser = require('body-parser');

var indexRouter = require('./routes/index');

var sendTask = require('./inc/sendTask');
sendTask.executeTask();

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(upload.any());

/*app.use(function(req, res, next){

  if(req.method === 'POST'){

    next();
    var form = formidable.IncomingForm({
      uploadDir: path.join(__dirname, "/upload"),
      keepExtensions: true
    });
  
    form.parse(req, function(err, fields, files){

      req.body = fields;
      req.fields = fields;
      req.files = files;

      next();
  
    });

  }
  else{
    next();
  }

});*/


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({

  store: new RedisStore({
    host: 'localhost',
    port: 6379,
    client,
  }),
  secret: 'Windows10',
  resave: true,
  saveUninitialized: true

}));

app.use(logger('dev'));
app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
