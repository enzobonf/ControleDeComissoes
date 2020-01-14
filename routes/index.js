var express = require('express');
var router = express.Router();

var sendTask = require('./../inc/sendTask');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/send', function(req, res, next) {
  sendTask.sendDirectly().then(result=>{

      let stringResponse = result.message;
      if(result.table) stringResponse = stringResponse + result.table;
      if(result.somaComissoes) stringResponse = stringResponse + `<h2 style="font-family:Calibri">Total: R$ ${result.somaComissoes}<h2>`;
      
      res.send(stringResponse);

  });
});

router.get('/list', function(req, res, next) {
  sendTask.listAll(req).then(result=>{ 

      let stringResponse = result.message;
      if(result.table) stringResponse = stringResponse + result.table;
      if(result.somaComissoes) stringResponse = stringResponse + `<h2 style="font-family:Calibri">Total: R$ ${result.somaComissoes}<h2>`;
      
      res.send(stringResponse);

  });
});

module.exports = router;
