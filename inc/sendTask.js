const comissoes = require('./comissoes');
const CronJob = require('cron').CronJob;
let emailer = require('./emailer');
let moment = require('moment');

function sendEmail(){
    return new Promise((resolve, reject)=>{

        comissoes.selectLates().then(results=>{

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
                        <td align='center' valign='middle'>R$ ${result.VALOR_PEDIDO}</td>
                        <td align='center' valign='middle'>R$ ${result.VALOR_COMISSAO}</td>
                        <td align='center' valign='middle'>${moment.parseZone(result.DATA_RECEBIMENTO).format("DD/MM/YYYY")}</td>
                        <td align='center' valign='middle'>Atrasada</td>
                    </tr>
                `);
                somaComissoes = somaComissoes + parseFloat(result.VALOR_COMISSAO);
            });
    
            tr = tr + `</tbody>
                    </table>
                </body>
            </html>`;
    
            emailText = `Oi mãe, <br>
                Existem ${results.length} comissões atrasadas. <br>
                Somando um valor total de R$ ${somaComissoes}, <br>
                Espero que me pague rápido kkkkkkk <p>        
                (Email automático enviado no dia ${moment.parseZone().format("DD/MM/YYYY")} às ${moment.parseZone().format("hh:mm")})`;
            
            emailer.sendEmail(`${results.length} Comissões Atrasadas`, emailText, tr, 'leandra@golfershoes.com.br').then(result=>{
                console.log('Email enviado com sucesso');
                resolve('Email enviado com sucesso!');
            }).catch(err=>{
                reject(err);
            });
    
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
    }

};