const comissoes = require('./comissoes');
const CronJob = require('cron').CronJob;
let emailer = require('./emailer');
let moment = require('moment');

function getSituation(situation, receivementDate){

    if(situation == false){

        if(receivementDate < new Date().toLocaleDateString()){
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

function getTr(results){
    
    let somaComissoes = 0;
    let tr = `<html>
                <body>
                    <p>
                    <table style='border-radius: 5px;' border='1' cellpadding='0' cellspacing='0'>
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
    });

    tr = tr + `</tbody>
            </table>
        </body>
    </html>`;

    somaComissoes = somaComissoes.toFixed(2);
    
    return ({
        tr,
        somaComissoes
    });

}

function sendEmail(){
    return new Promise((resolve, reject)=>{

        comissoes.select(true).then(results=>{

            if(results.length > 0){

                let arrayTr = getTr(results);
                let somaComissoes = arrayTr.somaComissoes;
                let tr = arrayTr.tr;

                emailText = `Oi mãe, <br>
                    Existem ${results.length} comissões atrasadas. <br>
                    Somando um valor total de R$ ${somaComissoes}, <br>
                    Espero que me pague rápido kkkkkkk <p>        
                    (Email automático enviado dia ${moment.parseZone().format("DD/MM/YYYY")} às ${moment().tz('America/Bahia').format("HH:mm")})`;
                
                emailer.sendEmail(`${results.length} Comissões Atrasadas`, emailText, tr, 'enzobonfx@gmail.com').then(result=>{
                    resolve({
                        message: 'Email enviado com sucesso!',
                        table: tr,
                        somaComissoes
                    });
                }).catch(err=>{
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

    sendDirectly(){
        return new Promise((resolve, reject)=>{
            sendEmail().then(results=>{
                resolve(results);
            });
        });
    },

    listAll(req){
        
        return new Promise((resolve, reject)=>{

            comissoes.select(false, req).then(results=>{
    
                if(results.length > 0){
    
                    let arrayTr = getTr(results);
                    let somaComissoes = arrayTr.somaComissoes;
                    let tr = arrayTr.tr;             
                    resolve({
                        message: `Últimas ${results.length} comissões: `,
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