function sendEmail(){
    if(confirm('Deseja realmente enviar o email?')){
        fetch('/send?noView', {
            method: 'GET',
        }).then(response=>{
            response.json().then(json=>{
                console.log(json);
                let message = json.message;
                if(json.somaComissoes) message = message + `\nHá R$ ${json.somaComissoes} em comissões atrasadas.`;

                alert(message);
            })
        });
    }
    
}