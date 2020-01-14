var express = require('express');
var router = express.Router();

var sendTask = require('./../inc/sendTask');

function getResponse(result){

    let stringResponse = result.message;
    if(result.table) stringResponse = stringResponse + result.table;
    if(result.somaComissoes) stringResponse = stringResponse + `<h2 style="font-family:Calibri">Total: R$ ${result.somaComissoes}</h2>`;

    return stringResponse;

}

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  res.redirect('list');
});

router.get('/send', function(req, res, next) {
  sendTask.sendDirectly().then(result=>{
      
      res.send(getResponse(result));

  }).catch(err=>{
      res.send(err);
  });
});

router.get('/list', function(req, res, next) {
  sendTask.listAll(req).then(result=>{ 

      res.send(getResponse(result));

  }).catch(err=>{
      res.send(err);
  });
});

module.exports = router;
