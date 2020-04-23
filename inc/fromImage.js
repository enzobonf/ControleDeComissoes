const tesseract = require('node-tesseract-ocr');
const moment = require('moment');
const isWin = process.platform === "win32";
const fs = require('fs');

const cheerio = require('cheerio');

let porcentagem = 6;

const config = {
    lang: "por",
    oem: 1,
    psm: 3,
}
  
const formatDates = (dataPedido) => {

    let array = dataPedido.split('/');
    array[2] = '20' + array[2];
    dataPedido = moment(`${array[2]}-${array[1]}-${array[0]}`)
    dataRecebimento = moment(dataPedido).add(14, 'days');

    let datas = {
      dataPedido: moment(dataPedido).format('YYYY-MM-DD'),
      dataRecebimento: moment(dataRecebimento).format('YYYY-MM-DD')
    };

    return datas;
  
};

const formatarSituacao = situacao => {
  if(situacao.indexOf('Enviado') != -1) return true;
  if(situacao.indexOf('Cancelado') != -1) return false;
  if(situacao.indexOf('Entregue') != -1) return true;
  if(situacao.indexOf('Devolvido') != -1) return false;
  if(situacao.indexOf('Pago') != -1) return true;
  if(situacao.indexOf('em separação') != -1) return true;
  if(situacao.indexOf('Efetuado') != -1) return false;
  if(situacao.indexOf('Aguardando pagamnto') != -1) return false;
  return false;
}

module.exports = {

    doOCR(filename){

      let separator = (isWin) ? '\\' : '/';
      let path = filename.split(separator);

      let file = path[path.length - 1];

        return new Promise((resolve, reject)=>{
          
          tesseract.recognize(`./upload/${file}`, config).then(text=>{

            text = text.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, '');
            let arrayPedidos = text.split('\n');
        
            let qntPedidos = arrayPedidos.length / 6;
            let stringJSON = '['
        
            for(let i = 0; i < qntPedidos; i++){
        
              let datas = formatDates(arrayPedidos[i + (qntPedidos * 2)].substring(0, 8));
              let situacao = formatarSituacao(arrayPedidos[i + qntPedidos].replace(/[\d-]/, '').replace(/[^0-9a-zA-Z]+/, '').replace('O', '').replace(/ /g, ''));
              let valorPedido = parseFloat((arrayPedidos[i + (qntPedidos * 5)].match(/[0-9]{0,10}[,]{1,1}[0-9]{0,4}/, '')).toString().replace(',', '.')).toFixed(2);
              let valorComissao = (valorPedido * (porcentagem / 100)).toFixed(2);
        
              stringJSON += `{"ID_PEDIDO": "${arrayPedidos[i]}", "SITUACAO_PEDIDO": "${situacao}", "SITUACAO": 0, "DATA_RECEBIMENTO": "${datas.dataRecebimento}", 
              "VALOR_PEDIDO": "${valorPedido}", "VALOR_COMISSAO": "${valorComissao}", "FORMA_PAGAMENTO": "PagSeguro"}`;
              if(i != qntPedidos - 1) stringJSON += ',';
        
            };
        
            stringJSON += ']';
            stringJSON = stringJSON.replace('undefined', '');
            
            resolve(JSON.parse(stringJSON));

          }).catch(err=>{

              reject(err);

          }).finally(()=>{

              fs.unlink(filename, (err) => {
                if(err){
                  console.error(err);
                }
              });

          });

      
        });
      
      },

      parseHTML(filename){
        
        return new Promise((resolve, reject)=>{

          try{

            let separator = (isWin) ? '\\' : '/';
            let path = filename.split(separator);

            let file = path[path.length - 1];
            console.log(file);

            var $ = cheerio.load(fs.readFileSync(`./upload/${file}`));

            let pedidos = []
            
            let tablePedidos = $('#mainContent > div:nth-child(3) > div:nth-child(3) > div.box-content.table-content > table > tbody > tr');

            for(i=0; i < 20; i++){

              let ID_PEDIDO = $(tablePedidos[i]).find('td.pedido-numero.footable-visible > a').text();

              let SITUACAO_PEDIDO = $(tablePedidos[i]).find(`#situacao_id_${ID_PEDIDO}_chosen > a > span`).text();
              if(SITUACAO_PEDIDO.indexOf('Pedido') !== -1) SITUACAO_PEDIDO = SITUACAO_PEDIDO.replace('Pedido ', '');

              let DATA_RECEBIMENTO = formatDates($(tablePedidos[i]).find(' td.data.footable-visible > span > span.text-muted').text()).dataRecebimento;

              let VALOR_PEDIDO = $(tablePedidos[i]).find('td.text-success.button-container.footable-visible > strong').text().match(/[0-9]{0,10}[,]{1,1}[0-9]{0,4}/, '').toString().replace(',', '.');
              let VALOR_COMISSAO = (VALOR_PEDIDO * (porcentagem / 100)).toFixed(2);

              let FORMA_PAGAMENTO = $(tablePedidos[i]).find('td:nth-child(6) > img').attr('title');

              let ESTA_PAGO = formatarSituacao(SITUACAO_PEDIDO);

              pedidos.push({ID_PEDIDO, SITUACAO_PEDIDO, SITUACAO: 0,  DATA_RECEBIMENTO, VALOR_PEDIDO, VALOR_COMISSAO, FORMA_PAGAMENTO, ESTA_PAGO});

            }

            resolve(pedidos);

          }
          catch(err){
            reject(err)
          }
          finally{

            fs.unlink(filename, (err) => {
              if(err){
                console.error(err);
              }
            });

          }

        });


      }

};