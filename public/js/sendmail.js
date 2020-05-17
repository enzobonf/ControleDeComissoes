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

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

const formatarSituacao = situacao => {
  if(situacao.indexOf('Enviado') != -1) return true;
  if(situacao.indexOf('Entregue') != -1) return true;
  if(situacao.indexOf('Pago') != -1) return true;
  if(situacao.indexOf('em separação') != -1) return true;
  return false;
}

function sendEmail(){
    if(confirm('Deseja realmente enviar o email?')){
        /* if(confirm('Com boleto?')){

            let token = prompt('Insira o token i-Safe do Banco Inter:');
            fetch(`/send?noView&tokenBoleto=${token}`, {
                method: 'GET',
            }).then(response=>{
                response.json().then(json=>{
                    console.log(json);
                    let message = json.message;
                    if(json.somaComissoes) message = message + `\nHá R$ ${json.somaComissoes} em comissões atrasadas.`;

                    alert(message);
                })
            });
            alert('Aguardando geração do boleto...');
            
        }
        else{ */

            fetch('/send?noView', {
                method: 'GET',
            }).then(response=>{
                response.json().then(json=>{
                    let message = json.message;
                    if(json.somaComissoes) message = message + `\nHá R$ ${json.somaComissoes} em comissões atrasadas.`;

                    alert(message);
                })
            });

        //}
    }
}

this.inputFiles = document.querySelector('#files');

this.inputFiles.addEventListener('change', event=>{
    /* uploadTask(event.target.files).then(response=>{
        (response.redirect) ? window.location.href = response.redirect : alert(response.error);
    }).catch(err=>{
        console.log(err);
        alert('Ocorreu um erro!');
        this.inputFiles.value = '';
    }); */

    var fr=new FileReader(); 
    fr.onload = function(){ 

        let html = fr.result.replace(/src=((['][^']*['])|(["][^"]*["]))/igm, "").replace(/<link[^>]*>/igm, ""); ;

        parseHTML(html).then(pedidos=>{
            console.log(pedidos);
            uploadTask(pedidos).then(response=>{
                console.log(response);
                (response.redirect) ? window.location.href = response.redirect : alert(response.error);
            }).catch(err=>{
                console.log(err);
                alert('Ocorreu um erro no servidor!');
                this.inputFiles.value = '';
                html = '';
            });

        }).catch(err=>{
            alert('Ocorreu um erro ao processar o arquivo!');
        });
    } 
    
    let extension = event.target.files[0].name.split('.')[1];
    
    (extension === 'html' ) ? fr.readAsText(event.target.files[0]) : alert('Envie um arquivo HTML!');

});

function parseHTML(html){

    return new Promise((resolve, reject)=>{

        try{

            let tablePedidos = $(html).find('#mainContent > div:nth-child(3) > div:nth-child(3) > div.box-content.table-content > table > tbody > tr');

            let pedidos = [];
                
            let porcentagem = 6;

            for(i = 0; i < 20; i++){

                let ID_PEDIDO = $(tablePedidos[i]).find('td.pedido-numero.footable-visible > a').text();

                let SITUACAO_PEDIDO = $(tablePedidos[i]).find(`#situacao_id_${ID_PEDIDO}_chosen > a > span`).text();
                if(SITUACAO_PEDIDO.indexOf('Pedido') !== -1) SITUACAO_PEDIDO = SITUACAO_PEDIDO.replace('Pedido ', '');
                SITUACAO_PEDIDO = SITUACAO_PEDIDO.capitalize();

                let DATA_RECEBIMENTO = formatDates($(tablePedidos[i]).find(' td.data.footable-visible > span > span.text-muted').text()).dataRecebimento;

                let VALOR_PEDIDO = $(tablePedidos[i]).find('td.text-success.button-container.footable-visible > strong').text().match(/[0-9]{0,10}[,]{1,1}[0-9]{0,4}/, '').toString().replace(',', '.');
                let VALOR_COMISSAO = (VALOR_PEDIDO * (porcentagem / 100)).toFixed(2);

                let FORMA_PAGAMENTO = $(tablePedidos[i]).find('td:nth-child(6) > img').attr('title');

                let ESTA_PAGO = formatarSituacao(SITUACAO_PEDIDO);

                pedidos.push({ID_PEDIDO, SITUACAO_PEDIDO: SITUACAO_PEDIDO.capitalize(), SITUACAO: 0,  DATA_RECEBIMENTO, VALOR_PEDIDO, VALOR_COMISSAO, FORMA_PAGAMENTO, ESTA_PAGO});

            }

            resolve(pedidos);

        }
        catch(err){
            reject(err);
        }  

    });

}

function uploadTask(pedidos){

    return new Promise((resolve, reject)=>{

        /* let formData = new FormData();
        formData.append('file', files[0]);

        fetch('/cadastroArquivo', {
            method: 'POST',
            body: formData
        }).then(response=>response.json().then(json=>{
            resolve(json);
        })).catch(err=>{
            reject(err);
        }); */

        let formData = new FormData();
        formData.append('pedidos', JSON.stringify(pedidos));

        fetch('/cadastroArquivo', {
            method: 'POST',
            body: formData
        }).then(response=>response.json().then(json=>{
            resolve(json);
        })).catch(err=>{
            reject(err);
        });

    });

}

function selectImageOCR(){

    (userLevel === 'Administrador') ? this.inputFiles.click() : alert('Você não tem permissão para isso!');

}

function parseHTMLFile(file){



}