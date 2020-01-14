var express = require('express');
var router = express.Router();

var sendTask = require('./../inc/sendTask');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/send', function(req, res, next) {
  sendTask.sendDirectly().then(result=>{    
    res.send(result.message + result.table + `<h2 style="font-family:Calibri">Total: R$ ${result.somaComissoes}<h2>`);
  });
});

router.get('/list', function(req, res, next) {
  sendTask.listAll(req).then(result=>{    
    res.send(result.message + result.table + `<h2 style="font-family:Calibri">Total: R$ ${result.somaComissoes}<h2>`);
  });
});

module.exports = router;
