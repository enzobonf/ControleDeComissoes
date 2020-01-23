var conn = require('./db');
var moment = require('moment');

module.exports = {

    render(req, res, error){
        res.render('login', {
            body: req.body,
            error
        });
    },

    login(user, password){

        return new Promise((resolve, reject)=>{
            
            conn.query(`
                SELECT Usuarios.NOME_USUARIO, Usuarios.LOGIN_USUARIO, Usuarios.SENHA_USUARIO, 
                Usuarios.STATUS_USUARIO, Nivel_Acesso.NOME_NIVEL 
                FROM Usuarios 
                inner join Nivel_Acesso 
                ON Usuarios.ID_NIVEL = Nivel_Acesso.ID_NIVEL 
                WHERE LOGIN_USUARIO = ?;
            `,[
                user
            ], (err, results)=>{

                if(err){
                    reject(err);
                }
                else{

                    if(!results.length > 0){
                        reject("Usuário ou senha incorretos.")
                    }
                    else{

                        let row = results[0];

                        if(row.SENHA_USUARIO !== password){
                            reject("Usuário ou senha incorretos");
                        }
                        else if(row.STATUS_USUARIO !== 'Ativo'){
                            reject("Usuário inativo");
                        }
                        else{
                            resolve(row);
                        }

                    }

                }

            });

        });

    },

    getUsers(){

        return new Promise((resolve, reject)=>{
            conn.query(`
                SELECT Usuarios.ID_USUARIO, Usuarios.NOME_USUARIO, Usuarios.LOGIN_USUARIO,
                Usuarios.STATUS_USUARIO, Usuarios.DATA_CADASTRO, Usuarios.ID_NIVEL, Nivel_Acesso.NOME_NIVEL 
                FROM Usuarios 
                inner join Nivel_Acesso 
                ON Usuarios.ID_NIVEL = Nivel_Acesso.ID_NIVEL;
                SELECT ID_NIVEL, NOME_NIVEL FROM Nivel_Acesso`,
            (err, results)=>{

                if(err){
                    reject(err);
                }
                else{
                    resolve(results);
                }
                

            });
        });
    },

    save(fields){

        return new Promise((resolve, reject)=>{

            let query, params = [
                fields.NOME_USUARIO,
                fields.LOGIN_USUARIO,
                fields.STATUS_USUARIO,
                fields.ID_NIVEL
            ];

            if(parseInt(fields.ID_USUARIO) > 0){
                query = `
                    UPDATE Usuarios
                    SET
                        NOME_USUARIO = ?,
                        LOGIN_USUARIO = ?,
                        STATUS_USUARIO = ?,
                        ID_NIVEL = ?
                    WHERE ID_USUARIO = ?
                `;
                params.push(fields.ID_USUARIO);
            }
            else{
                query = `
                    INSERT INTO Usuarios (NOME_USUARIO, LOGIN_USUARIO, STATUS_USUARIO, ID_NIVEL, DATA_CADASTRO, SENHA_USUARIO)
                    VALUES(?, ?, ?, ?, ?, ?)
                `;
                params.push(moment().tz('America/Bahia').format('YYYY-MM-DD'));
                params.push(fields.SENHA_USUARIO);
            }

            conn.query('SELECT * FROM Usuarios WHERE LOGIN_USUARIO = ?', fields.LOGIN_USUARIO, (err, results)=>{
                if(err){
                    reject(err.message);
                }
                else if(results.length > 0 && results[0].ID_USUARIO !== parseInt(fields.ID_USUARIO)){
                    reject('Este login já está em uso!');
                }
                else{
                    conn.query(query, params, (err, results)=>{

                        if(err){
                            console.log(err);
                            reject(err.message);
                        }
                        else{
                            resolve(results);
                        }
        
                    });
                }

            });       

        });   
    },

    delete(id){

        return new Promise((resolve, reject)=>{

            conn.query(`
                DELETE FROM Usuarios WHERE ID_USUARIO = ?
            `, [
                id
            ], (err, results)=>{

                if(err){
                    reject(err);
                }
                else{
                    resolve(results);
                }

            });

        });

    },

    changePassword(req){

        return new Promise((resolve, reject)=>{

            if(!req.fields.password){
                reject('Preencha a senha!');
            }
            else if(req.fields.password !== req.fields.passwordConfirm){
                reject('Confirme a senha corretamente!');
            }
            else{

                conn.query(`
                    UPDATE Usuarios
                    SET SENHA_USUARIO = ?
                    WHERE ID_USUARIO = ?
                `, [
                    req.fields.password,
                    req.fields.id
                ], (err, results)=>{

                    if(err){
                        reject(err.message);
                    }
                    else{
                        resolve(results);
                    }

                });

            }

        });

    }

};