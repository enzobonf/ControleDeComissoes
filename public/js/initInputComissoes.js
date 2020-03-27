let forms = document.querySelectorAll('form');
forms.forEach(form=>{

    let inputPrazo = form.querySelector(`[name=PRAZO]`);
    if(inputPrazo){
    initLeaveInputPrazo(form, inputPrazo);
    }

    let inputPorcentagem = form.querySelector(`[name=PORCENTAGEM]`);
    if(inputPorcentagem){
    initLeaveInputPorcentagem(form, inputPorcentagem);
    }


});

function initLeaveInputPorcentagem(form, input) {

    input.addEventListener('blur', e=>{

        let valorPedido = form.querySelector(`[name=VALOR_PEDIDO]`).value;

        if(!input.value || !valorPedido){
            alert('Preencha os campos corretamente!');
        }
        else{
            form.querySelector(`[name=VALOR_COMISSAO]`).value = ((input.value / 100) * valorPedido).toFixed(2);
        }

    });
    
}

function initLeaveInputPrazo(form, input){

    input.addEventListener('blur', e=>{

    let dataPedido = form.querySelector(`[name=DATA_PEDIDO]`).value;

    if(!input.value || !dataPedido){
        alert('Preencha os dados corretamente!');
    }
    else{
        form.querySelector(`[name=DATA_RECEBIMENTO]`).value = moment(dataPedido).add(input.value, 'days').format("YYYY-MM-DD");
    }

    });


}