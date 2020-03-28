this.inputFiles = document.querySelector('#files');

this.inputFiles.addEventListener('change', event=>{
    uploadTask(event.target.files).then(response=>{
        console.log(response);
    });
});

function sendEmail(){
    if(confirm('Deseja realmente enviar o email?')){
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

function uploadTask(files){

    return new Promise((resolve, reject)=>{

        let formData = new FormData();
        formData.append('file', files[0]);

        fetch('/cadastroOCR', {
            method: 'POST',
            body: formData
        }).then(response=>response.json().then(json=>{
            (json.redirect) ? window.location.href = json.redirect : alert(json.error);
        })).catch(err=>{
            alert('Ocorreu um erro!');
        });

        alert('Aguarde\nEnviando arquivo para o servidor!');
    });

}

function selectImageOCR(){

    (userLevel === 'Administrador') ? this.inputFiles.click() : alert('Você não tem permissão para isso!');

}