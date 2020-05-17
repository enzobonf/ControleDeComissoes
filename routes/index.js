var express = require('express');
var router = express.Router();
var comissoes = require('./../inc/comissoes');
var users = require('./../inc/users')
var sendTask = require('./../inc/sendTask');
var md5 = require('md5');
var moment = require('moment');
//var fromFile = require('../inc/fromFile');

moment.locale('pt-BR');

function getResponse(result){

    let stringResponse = result.message;
    if(result.table) stringResponse = stringResponse + result.table;
    if(result.somaComissoes) stringResponse = stringResponse + `<h2 style="font-family:Calibri">Total: R$ ${result.somaComissoes}</h2>`;

    return stringResponse;

}

router.use(function(req, res, next){

  if((req.url).indexOf('/login') === -1 && !req.session.user){
      req.session.redirectTo = req.url;
      res.redirect('/login');
  }
  else{
      next();
  }

});

router.use(function(req, res, next){

  if(req.session.user && (req.url).indexOf('/login') === -1 
    && (req.method === 'POST' || req.method === 'DELETE') && req.session.user.NOME_NIVEL != 'Administrador'){
    
      res.send({
        error: 'Você não tem permissão para isso!'
      });

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

          req.session.user = user;

          let url = '/';

          if(req.session.redirectTo && req.session.redirectTo !== '/') url = req.session.redirectTo;
          delete req.session.redirectTo;

          res.redirect(url);

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

  let token = '';
  console.log(req.query);
  if(req.query.tokenBoleto ) token = req.query.tokenBoleto;

  sendTask.sendDirectly(token).then(result=>{

      if(req.query.noView === ''){
        res.send(result);
      }
      else{
        res.send(getResponse(result));
      }

  }).catch(err=>{
      res.send(err);
  });
});

router.get('/comissoes', function(req, res, next) {

  let start = (req.query.start) ? req.query.start : moment().subtract(2, 'year').format('YYYY-MM-DD');
  let chartStart = (req.query.start) ? req.query.start : moment().subtract(4, 'year').format('YYYY-MM-DD');

  let end = (req.query.end) ? req.query.end : moment().format('YYYY-MM-DD');

  comissoes.chart(chartStart, end).then(chartData=>{

      comissoes.select(req).then(pag=>{

        res.render('comissoes', comissoes.getParams(req, {
          date: {
            start,
            end
          },
          data: pag.data,
          links: pag.links,
          moment,
          chartData: JSON.stringify(chartData)
        }));
      });
  
    });

});

router.post('/comissoes', function(req, res, next){

  comissoes.pesquisaPedido(req.body.ID_PEDIDO).then(result=>{

      if(result.length > 0 && (!req.body.ID_COMISSAO || req.body.ID_COMISSAO != result[0].ID_COMISSAO)){
        res.send({error: 'Esse pedido já está cadastrado!'});
      }
      else{
        comissoes.save(req.body).then(results=>{

          res.send(results);
    
        }).catch(err=>{
            res.send({error: err});
        });
      }

  });

});

router.get('/comissoes/chart', function(req, res, next){

  let start = (req.query.start) ? req.query.start : moment(new Date()).subtract(4, 'year').format('YYYY-MM-DD');
  let end = (req.query.end) ? req.query.end : moment(new Date()).format('YYYY-MM-DD');

  comissoes.chart(start, end).then(chartData=>{

      res.send(chartData);

  });
  
});

router.post('/comissoes/marcarpaga', function(req, res, next){
  
  console.log(JSON.parse(req.body.ID_COMISSAO));
  comissoes.marcarPaga(JSON.parse(req.body.ID_COMISSAO)).then(results=>{

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

//router.post('/cadastroArquivo', function(req, res, next){
  
//  if(req.files){

//    let file = req.files[0].buffer;
    
    /* let fileType = req.files.file.type.substring(0,5);
    if(fileType == 'image'){
      fromImage.doOCR(file).then(result=>{

        req.session.fromOCR = result;
        res.send({redirect: '/cadastroOCR'});
  
      }).catch(err=>{
        res.send({error:'Houve erro na leitura da imagem!'});
      });
    }
    else{
      res.send({error: 'Envie um arquivo de IMAGEM!'});
      fs.unlink(file, (err) => {
        if(err){
          console.error(err);
        }
      });
    } */

    /* let fileType = req.files[0].mimetype;
    if(fileType == 'text/html'){
      
      fromFile.parseHTML(file).then(result=>{

        req.session.fromFile = result;
        res.send({redirect: '/cadastroArquivo'});

      }).catch(err=>{
        res.send({error:'Houve erro na leitura do arquivo.\nEnvie um arquivo válido'});
      });

    }
    else{
      res.send({error: 'Envie um arquivo HTML!'}); */
      /* fs.unlink(file, (err) => {
        if(err){
          console.error(err);
        }
      }); */
    /* }
    
  }
  else{
    res.send({error:'Houve erro no upload!'});
  }

}); */

router.post('/cadastroArquivo', function(req, res, next){

  let pedidos = JSON.parse(req.body.pedidos);
  req.session.fromFile = pedidos;

  res.send({redirect: '/cadastroArquivo'});

});

router.get('/cadastroArquivo', function(req, res, next) {

  if(req.session.fromFile){
    res.render('comissoesFromFile', comissoes.getParams(req, {
      data: req.session.fromFile,
      moment
    }));
  }
  else{
    res.redirect('/comissoes');
  }

});

router.get('/users', function(req, res, next){
  users.getUsers().then(results=>{

    let data = results[0];
    let userLevels = results[1];

    res.render('users', comissoes.getParams(req, {
      data,
      userLevels,
      moment
    }));

  });
  
});

router.post('/users', function(req, res, next){

  if(req.body.SENHA_USUARIO) req.body.SENHA_USUARIO = md5(req.body.SENHA_USUARIO);

  users.save(req.body).then(results=>{

    res.send(results);

  }).catch(err=>{

    res.send({
      error: err
    });
    
  });

});

router.post('/users/password-change', function(req, res, next){

  if(req.body.password) req.body.password = md5(req.body.password);
  if(req.body.passwordConfirm) req.body.passwordConfirm = md5(req.body.passwordConfirm);

  users.changePassword(req).then(results=>{

      res.send(results);

  }).catch(err=>{

      res.send({
          error: err
      });
      
  });

});

router.delete('/users/:id', function(req, res, next){

  users.delete(req.params.id).then(results=>{
    res.send(results);
  }).catch(err=>{
    res.send(err);
  });

});


router.get('/list', function(req, res, next) {
  //PARA FINS DE TESTE
  sendTask.listAll(req).then(result=>{ 

      res.send(getResponse(result));

  }).catch(err=>{
      res.send(err);
  });

});

module.exports = router;
