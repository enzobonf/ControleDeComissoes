class HcodeGrid{

    constructor(configs){

        configs.listeners = Object.assign({
            afterUpdateClick:(e)=>{
                $('#modal-update').modal('show');
            },
            afterDeleteClick:(e)=>{
                window.location.reload();
            },
            afterFormCreate:(e)=>{
                window.location.reload();
            },
            afterFormUpdate:(e)=>{
                window.location.reload();
            },
            afterFormCreateError:(e)=>{
                alert(e);
                console.error(e);
            },
            afterFormUpdateError:(e)=>{
                alert(e);
                console.error(e);
            },
        }, configs.listeners)

        this.options = Object.assign({}, {
            formCreate: '#modal-create form',
            formUpdate: '#modal-update form',
            btnUpdate: 'btn-update',
            btnDelete: 'btn-delete',
            onUpdateLoad: (form, name, data)=>{

                let input = form.querySelector('[name=' + name + ']');

                if (input) input.value = data[name];

            }
        }, configs);

        this.rows = [...document.querySelectorAll('table tbody tr')];

        this.initForms();
        this.initButtons();
    }

    initForms(){

        this.formCreate = document.querySelector(this.options.formCreate);
        
        if(this.formCreate){
            this.formCreate.save({
                success:()=>{
                    this.fireEvent('afterFormCreate');
                },
                failure:(err)=>{
                    this.fireEvent('afterFormCreateError', [err])
                }
            });

        }

        this.formUpdate = document.querySelector(this.options.formUpdate);

        if(this.formUpdate){
            this.formUpdate.save({
                success:()=>{
                    this.fireEvent('afterFormUpdate');
                },
                failure:(err)=>{
                    this.fireEvent('afterFormUpdateError', [err])
                }
            });

        }
    
    }

    fireEvent(name, args){

        if(typeof this.options.listeners[name] === 'function') this.options.listeners[name].apply(this, args);

    }

    getTrData(e){

        let tr = e.path.find(el=>{

            return (el.tagName.toUpperCase() === 'TR');

        });

        return JSON.parse(tr.dataset.row);
    }

    btnUpdateClick(e){

        this.fireEvent('beforeUpdateClick', [e]);

        let data = this.getTrData(e);

        for(let name in data){

            this.options.onUpdateLoad(this.formUpdate, name, data);

        }

        this.fireEvent('afterUpdateClick', [e]);

    }

    btnDeleteClick(e){

        this.fireEvent('beforeDeleteClick');

        let data = this.getTrData(e);

        if(confirm(eval('`' + this.options.deleteMessage + '`'))){
            fetch(eval('`' + this.options.deleteUrl + '`'), {

                method: 'DELETE'

            }).then(response=>response.json())
            .then(json=>{
                this.fireEvent('afterDeleteClick');
            });
        }

    }

    btnMarcarPagaClick(e){

        let data = this.getTrData(e);

        let formData = new FormData();
        formData.append('ID_COMISSAO', `[${data.ID_COMISSAO}]`);

        if(confirm(eval('`' + this.options.marcarPagaMessage + '`'))){
            fetch(eval('`' + this.options.marcarPagaUrl + '`'), {

                method: 'POST',
                body: formData


            }).then(response=>response.json())
            .then(json=>{
                this.fireEvent('afterDeleteClick');
            });
        }

    }

    initButtons(){

        this.rows.forEach(row=>{

            [...row.querySelectorAll('.btn')].forEach(btn=>{

                btn.addEventListener('click', e=>{
                    if(this.options.userLevel === 'Administrador'){

                        if(e.target.classList.contains(this.options.btnUpdate)){

                            this.btnUpdateClick(e);

                        }
                        else if(e.target.classList.contains(this.options.btnDelete)){

                            this.btnDeleteClick(e);

                        }
                        else if(e.target.classList.contains(this.options.btnMarcarPaga)){

                            this.btnMarcarPagaClick(e);

                        }
                        else{
  
                            this.fireEvent('buttonClick', [e.target, this.getTrData(e), e]);

                        }

                    }
                    else{
                        alert('Você não tem permissão para isso!');
                    }

                });

            });

        });

    }

}