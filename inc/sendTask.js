const comissoes = require('./comissoes');
const CronJob = require('cron').CronJob;
const emailer = require('./emailer');
const moment = require('moment');

const _pix = require('faz-um-pix');

//const credentials = require('./credentials.json');

/* const bankCredentials = require('./bankCredentials.json');
const webscrapper = require('../inc/webscrapper');
var io = require('socket.io-client'); */

require('dotenv').config();

function getSituation(situation, receivementDate){

    if(situation == false){

        let today = new Date(moment().format('YYYY-MM-DD'));
        receivementDate = new Date(receivementDate);

        if(receivementDate < today){
            return 'Atrasada';
        }
        else{
            return 'Em aberto';
        }

    }
    else{

        return 'Paga';

    }

}

const getQrCode = async (valor, msg) => {

    return {
        copiaCola: await _pix.Pix('+5541995165828', 'ENZO BONFANTE', 'FOZ DO IGUACU', valor, msg),
        qrCode: await _pix.Pix('+5541995165828', 'ENZO BONFANTE', 'FOZ DO IGUACU', valor, msg, true)
    }

}

const getStrPedidos = pedidos => {

    let str = pedidos[0].toString();

    for(let i = 1; i < pedidos.length; i++){

        str += (i !== pedidos.length - 1) ? `, ${pedidos[i]}` : ` e ${pedidos[i]}`;

    }

    return str;

}

function getTr(results){
    
    let somaComissoes = 0;
    let pedidos = [];
    let height = results.length * 21 + 41;
    let tr = `<html>
                <body style="width: 428px; height: ${height}px;">
                    <p>
                    <table style='border-radius: 5px; font-family: Calibri;' border='1' cellpadding='0' cellspacing='0'>
                        <thead>
                        <tr>
                            <th align='center' valign='middle'>Pedido</th>
                            <th align='center' valign='middle'>Valor Pedido</th>
                            <th align='center' valign='middle'>Valor Comissão</th>
                            <th align='center' valign='middle'>Data Recebimento</th>
                            <th align='center' valign='middle'>Situação</th>
                        </tr>
                    </thead>
                    <tbody>`;

    results.forEach(result=>{
        tr = tr + (`
            <tr>
                <td align='center' valign='middle'>${result.ID_PEDIDO}</td>
                <td align='center' valign='middle'>${result.VALOR_PEDIDO}</td>
                <td align='center' valign='middle'>${result.VALOR_COMISSAO}</td>
                <td align='center' valign='middle'>${moment.parseZone(result.DATA_RECEBIMENTO).format("DD/MM/YYYY")}</td>
                <td align='center' valign='middle'>${getSituation(result.SITUACAO, moment.parseZone(result.DATA_RECEBIMENTO).format("YYYY-MM-DD"))}</td>
            </tr>
        `);
        somaComissoes = somaComissoes + parseFloat(result.VALOR_COMISSAO);
        pedidos.push(result.ID_PEDIDO);
    });

    tr = tr + `</tbody>
            </table>
        </body>
    </html>`;

    somaComissoes = somaComissoes.toFixed(2);
    
    return ({
        tr,
        somaComissoes,
        pedidos: pedidos.reverse()
    });

}

/* function gerarBoleto(token, valor, vencimento){

    let browser = await webscrapper.init();
    let page = await browser.newPage();
    await webscrapper.login(page, bankCredentials.conta, bankCredentials.senha, token);
    return await webscrapper.gerarBoleto(page, valor, moment().add(diasParaVencer, 'days').format('DD/MM/YYYY'), browser);

    return new Promise((resolve, reject)=>{

        var socket = io.connect("https://geradorboleto.herokuapp.com/", {
            reconnection: true
        });

        socket.on('connect', ()=>{

            console.log('conectado ao socket remoto');
            socket.emit('gerarBoleto', {token, valor, vencimento});
            
            socket.on('message', function(message){
                console.log(message);
            });

            socket.on('erro', function(err){
                reject(err);
                socket.close();
            });

            socket.on('boleto gerado', function(codigo){
                resolve(codigo);
                socket.close();
            });


        });

    });

}; */

function sendEmail(token = ''){
    return new Promise((resolve, reject)=>{

        let req = {query: {sit: 'atrasadas'}};

        comissoes.select(req).then(async results=>{

            let numeroAtrasadas = results.data.length;

            if(numeroAtrasadas > 0){

                let arrayTr = getTr(results.data);
                let somaComissoes = arrayTr.somaComissoes;
                let tr = arrayTr.tr;
                let strPedidos = getStrPedidos(arrayTr.pedidos);

                let sufixo = numeroAtrasadas > 1 ? 'ões' : 'ão';
                let sufixoS = numeroAtrasadas > 1 ? 's' : '';

                let pix = await getQrCode(arrayTr.somaComissoes, `Comiss${sufixo.replace('õ', 'o')} do${sufixoS} pedido${sufixoS} ${strPedidos}`);

                emailText = `Oi mãe, <br>
                ${numeroAtrasadas > 1 ? 'Existem' : 'Há'} ${numeroAtrasadas} comiss${sufixo} atrasada${sufixoS}. <br>
                Somando um valor total de R$ ${somaComissoes}, <br>
                Espero que me pague rápido kkkkkkk <p>
                Dados do Pix para pagamento: <p>
                QR Code: <br>
                <img src="cid:qrcodeimg" width="150px"/> <p>
                Copia e Cola: <br>
                ${pix.copiaCola} <p>
                (Email automático enviado dia ${moment.parseZone().format("DD/MM/YYYY")} às ${moment().tz('America/Bahia').format("HH:mm:ss")})`;
            
                emailer.sendEmail(`${numeroAtrasadas} ${numeroAtrasadas > 1 ? 'Comissões Atrasadas' : 'Comissão Atrasada'}`, emailText, tr, process.env.TO,  [{
                    path: pix.qrCode,
                    cid: 'qrcodeimg'
                }]).then(result=>{
                    resolve({
                        message: 'Email enviado com sucesso!',
                        table: tr,
                        somaComissoes
                    });
                }).catch(err=>{
                    console.log(err);
                    reject({
                        message: err
                    });
                });

            }
            else{
                resolve({
                    message:'Não há nenhuma comissão atrasada!'
                });
            }
            
        }).catch(err=>{
            reject(err);
        });

    });

    
}

module.exports = {

    executeTask(){

        const task = new CronJob('00 15 * * *', () => {
        
            sendEmail();

        }, null, true, 'America/Sao_Paulo');

    },

    sendDirectly(token){
        return new Promise((resolve, reject)=>{
            sendEmail(token).then(results=>{
                resolve(results);
            }).catch(err=>{
                reject(err);
            });
        });
    },

    listAll(req){
        
        return new Promise((resolve, reject)=>{

            comissoes.select(req).then(results=>{
    
                if(results.data.length > 0){
    
                    let arrayTr = getTr(results.data);
                    let somaComissoes = arrayTr.somaComissoes;
                    let tr = arrayTr.tr;             
                    resolve({
                        message: `<h3 style="font-family:Calibri">Últimas ${results.data.length} comissões:</h3>`,
                        table: tr,
                        somaComissoes
                    });
    
                }
                else{
                    resolve({
                        message: 'Não há nenhuma comissão'
                    });
                }
    
            }).catch(err=>{
                reject(err);
            });
    
        });

    }

};