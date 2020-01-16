var conn = require('./db');

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
                WHERE LOGIN_USUARIO = ?
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
                SELECT id, name, email FROM tb_users ORDER BY name`,
            (err, results)=>{
            
                if(err){
                    reject(err);
                }
                
                resolve(results);

            });
        });
    },

    save(fields){

        return new Promise((resolve, reject)=>{

            let query, params = [
                fields.name,
                fields.email
            ];

            if(parseInt(fields.id) > 0){
                query = `
                    UPDATE tb_users
                    SET
                        name = ?,
                        email = ?
                    WHERE id = ?
                `;
                params.push(fields.id);
            }
            else{
                query = `
                    INSERT INTO tb_users (name, email, password)
                    VALUES(?, ?, ?)
                `;
                params.push(fields.password);
            }

            conn.query(query, params, (err, results)=>{

                if(err){
                    console.log(err);
                    reject(err);
                }
                else{
                    resolve(results);
                }

            });

        });   
    },

    delete(id){

        return new Promise((resolve, reject)=>{

            conn.query(`
                DELETE FROM tb_users WHERE id = ?
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
                    UPDATE tb_users
                    SET password = ?
                    WHERE id = ?
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