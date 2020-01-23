function sendEmail(){
    if(confirm('Deseja realmente enviar o email?')){
        fetch('/send?noView', {
            method: 'GET',
        }).then(response=>{
            response.json().then(json=>{
                alert(json.message + `\nHá R$ ${json.somaComissoes} em comissões atrasadas.`);
            })
        });
    }
    
}