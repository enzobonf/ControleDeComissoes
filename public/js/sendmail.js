this.inputFiles = document.querySelector('#files');

this.inputFiles.addEventListener('change', event=>{
    uploadTask(event.target.files).then(response=>{
        (response.redirect) ? window.location.href = response.redirect : alert(response.error);
    }).catch(err=>{
        console.log(err);
        alert('Ocorreu um erro!');
        this.inputFiles.value = '';
    });
});

function sendEmail(){
    if(confirm('Deseja realmente enviar o email?')){
        if(confirm('Com boleto?')){

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
        else{

            fetch('/send?noView', {
                method: 'GET',
            }).then(response=>{
                response.json().then(json=>{
                    let message = json.message;
                    if(json.somaComissoes) message = message + `\nHá R$ ${json.somaComissoes} em comissões atrasadas.`;

                    alert(message);
                })
            });

        }
    }
}

function uploadTask(files){

    return new Promise((resolve, reject)=>{

        let formData = new FormData();
        formData.append('file', files[0]);

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