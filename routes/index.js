var express = require('express');
var router = express.Router();
var comissoes = require('./../inc/comissoes');
var users = require('./../inc/users')
var sendTask = require('./../inc/sendTask');
var md5 = require('md5');
var moment = require('moment');

moment.locale('pt-BR');

function getResponse(result){

    let stringResponse = result.message;
    if(result.table) stringResponse = stringResponse + result.table;
    if(result.somaComissoes) stringResponse = stringResponse + `<h2 style="font-family:Calibri">Total: R$ ${result.somaComissoes}</h2>`;

    return stringResponse;

}

router.use(function(req, res, next){
  if((req.url).indexOf('/login') === -1 && !req.session.user){
      res.redirect('/login');
  }
  else{
      next();
  }

});

router.use(function(req, res, next){

  req.menus = comissoes.getMenus(req);

  next();

});

router.get('/login', function(req, res, next){

  users.render(req, res, null);

});

router.post('/login', function(req, res, next){

  if(!req.body.user){
      users.render(req, res, "Preencha o campo usuário!");
  }
  else if(!req.body.password){
      users.render(req, res, "Preencha o campo senha!");
  }
  else{
      users.login(req.body.user, md5(req.body.password)).then(user=>{
          console.log(user);
          req.session.user = user;
          res.redirect('/');

      }).catch(err=>{
          users.render(req, res, err.message || err);
      });
  }

});

router.get('/logout', function(req, res, next){

  delete req.session.user;

  res.redirect('/login');

});

router.get('/', function(req, res, next) {
  
  comissoes.dashboard().then(data=>{
    
      res.render('index', comissoes.getParams(req, {
        data
      }));

  });

});

router.get('/send', function(req, res, next) {
  sendTask.sendDirectly().then(result=>{
      
      res.send(getResponse(result));

  }).catch(err=>{
      res.send(err);
  });
});

router.get('/comissoes', function(req, res, next) {

  let start = (req.query.start) ? req.query.start : moment().subtract(2, 'year').format('YYYY-MM-DD');
  let end = (req.query.end) ? req.query.end : moment().format('YYYY-MM-DD');
  
  comissoes.select(false, req).then(data=>{
    res.render('comissoes', comissoes.getParams(req, {
      date: {
        start,
        end
      },
      data,
      moment,
      situationFunction: 'getSituation(row.SITUACAO, moment.parseZone(row.DATA_RECEBIMENTO).format("YYYY-MM-DD"));'
    }));

  });

});

router.get('/comissoes/chart', function(req, res, next){

  req.query.start = (req.query.start == '') ? req.query.start : moment(new Date()).subtract(4, 'year').format('YYYY-MM-DD');
  req.query.end = (req.query.end = '') ? req.query.end : moment(new Date()).format('YYYY-MM-DD');

  comissoes.chart(req).then(chartData=>{

      res.send(chartData);

  });
  
});

router.post('/comissoes/marcarpaga', function(req, res, next){

  comissoes.marcarPaga(req.body.ID_COMISSAO).then(results=>{

      res.send(results);

  }).catch(err=>{
      res.send(err);
  });

});

router.delete('/comissoes/:id', function(req, res, next){

  comissoes.delete(req.params.id).then(results=>{

      res.send(results);

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
