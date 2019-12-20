var express = require('express');
var router = express.Router();

var sendTask = require('./../inc/sendTask');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/send', function(req, res, next) {
  sendTask.sendDirectly().then(result=>{
    res.send(result);
  });
});

module.exports = router;
