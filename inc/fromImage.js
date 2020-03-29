var tesseract = require('node-tesseract-ocr');
var moment = require('moment');
var isWin = process.platform === "win32";
var fs = require('fs');

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
  if(situacao.indexOf('Enviado') != -1) return 'Pago';
  if(situacao.indexOf('Cancelado') != -1) return 'Cancelado';
  if(situacao.indexOf('Entregue') != -1) return 'Pago';
  if(situacao.indexOf('devolvi') != -1) return 'Pagamento devolvido';
  if(situacao.indexOf('Pago') != -1) return 'Pago';
  if(situacao.indexOf('emseparaç') != -1) return 'Pago';
  if(situacao.indexOf('Efetuado') != -1) return 'Efetuado';
  if(situacao.indexOf('Aguardandopaga') != -1) return 'Aguardando pagamento';
  return '?';
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
        
            let porcentagem = 6;
        
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
        
            let pedidosJSON = JSON.parse(stringJSON);
            
            resolve(pedidosJSON);

            fs.unlink(filename, (err) => {
                if(err){
                  console.error(err);
                }
            });

        
          }).catch(err=>{

              reject(err);

          });

      
        });
      
      }

};