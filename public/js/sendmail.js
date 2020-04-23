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