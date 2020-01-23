var conn = require('./db');
var moment = require('moment');

module.exports = {

    getParams(req, params){

        return Object.assign({},{
            menus: req.menus, 
            user: req.session.user
        }, params);

    },

    getMenus(req){

        let menus =  [
            {
                text: 'Tela Inicial',
                href: '/',
                icon: 'home',
                active: false
            },
            {
                text: 'Comissões',
                href: '/comissoes',
                icon: 'calendar-check-o',
                active: false
            },
            {
                text: 'Usuários',
                href: '/users',
                icon: 'users',
                active: false
            },
            {
                text: 'Enviar email',
                href: '#',
                icon: 'envelope',
                active: false,
                onclick: 'sendEmail()'
            }
        ]

        menus.map(menu=>{

            if(menu.href === `${req.url}`) menu.active = true;

        });

        return menus;

    },


    dashboard(){

        return new Promise((resolve, reject)=>{

            let dateNow = moment.parseZone().format("YYYY-MM-DD");

            conn.query(`
                SELECT
                    (SELECT IFNULL(SUM(VALOR_COMISSAO), 0) from Comissoes WHERE DATA_RECEBIMENTO < ? and SITUACAO = 0) AS atrasadas,
                    (SELECT IFNULL(SUM(VALOR_COMISSAO), 0) from Comissoes WHERE DATA_RECEBIMENTO >= ? and SITUACAO = 0) AS emaberto,
                    (SELECT IFNULL(SUM(VALOR_COMISSAO), 0) from Comissoes WHERE SITUACAO = 1) AS pagas,
                    (SELECT IFNULL(SUM(VALOR_PEDIDO), 0) from Comissoes) AS totalpedidos;
            `, [dateNow, dateNow], (err, results)=>{

                if(err){
                    reject(err);
                }
                else{
                    resolve(results[0]);
                }

            });

        });


    },

    select(late, req = ''){

        return new Promise((resolve, reject)=>{

            let dateNow = moment.parseZone().format("YYYY-MM-DD");

            let limit = 10;
            let year = false;
            let month = false;

            let params = [];

            if(late) params.push(dateNow);

            if(req !== ''){
                if(req.query.limit) limit = req.query.limit;
                if(req.query.year){ 

                    year = req.query.year;
                    params.push(year);

                }
                if(req.query.month){

                    if(!req.query.year){
                        year = new Date().getFullYear().toString();
                        params.push(year);
                    }

                    month = req.query.month;
                    params.push(month);

                }
            }
            
            var query = conn.query(`
                SELECT * FROM Comissoes 
                ${(late) ? 'WHERE DATA_RECEBIMENTO < ? and SITUACAO = 0' : ''}
                ${(year !== false) ? 'WHERE YEAR(DATA_RECEBIMENTO) = ?' : ''}
                ${(month !== false) ? 'AND MONTH(DATA_RECEBIMENTO) = ? ' : ''}
                ORDER BY DATA_RECEBIMENTO DESC
                LIMIT ${limit}`, params,(err, results)=>{

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

            //let date = fields.date.split('/');
        
            //fields.date = `${date[2]}-${date[1]}-${date[0]}`;*/
            let query, params = [
                fields.ID_PEDIDO,
                fields.VALOR_PEDIDO,
                fields.VALOR_COMISSAO,
                fields.FORMA_PAGAMENTO,
                fields.DATA_RECEBIMENTO,
                fields.SITUACAO
            ];

            if(parseInt(fields.ID_COMISSAO) > 0){
                query = `
                    UPDATE Comissoes
                    SET
                        ID_PEDIDO = ?,
                        VALOR_PEDIDO = ?,
                        VALOR_COMISSAO = ?,
                        FORMA_PAGAMENTO = ?,
                        DATA_RECEBIMENTO = ?,
                        SITUACAO = ?
                    WHERE ID_COMISSAO = ?
                `;
                params.push(fields.ID_COMISSAO);
            }
            else{
                query = `
                    INSERT INTO Comissoes (ID_PEDIDO, VALOR_PEDIDO, VALOR_COMISSAO, FORMA_PAGAMENTO, DATA_RECEBIMENTO, SITUACAO)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
            }

            conn.query(query, params, (err, results)=>{

                if(err){
                    reject(err);
                }
                else{
                    resolve(results);
                }

            });

        });


    },

    marcarPaga(id){
        
        return new Promise((resolve, reject)=>{

            conn.query(`
                UPDATE Comissoes SET SITUACAO = 1 WHERE ID_COMISSAO = ?
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

    delete(id){

        return new Promise((resolve, reject)=>{

            conn.query(`
                DELETE FROM Comissoes WHERE ID_COMISSAO = ?
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

    chart(req){

        return new Promise((resolve, reject)=>{

            conn.query(`
            SELECT
                CONCAT(YEAR(DATA_RECEBIMENTO), '-', MONTH(DATA_RECEBIMENTO)) AS date,
                SUM(VALOR_COMISSAO) AS total
                FROM Comissoes
            WHERE
                DATA_RECEBIMENTO BETWEEN ? AND ?
            GROUP BY YEAR(DATA_RECEBIMENTO), MONTH(DATA_RECEBIMENTO)
            ORDER BY YEAR(DATA_RECEBIMENTO) ASC, MONTH(DATA_RECEBIMENTO) ASC;
            `, [
                req.query.start,
                req.query.end
            ], (err, results)=>{

                if(err){
                    reject(err);
                }
                else{

                    let months = [];
                    let values = [];

                    results.forEach(row=>{

                        months.push(moment(row.date).format('MMM YYYY'));
                        values.push(row.total);

                    });

                    resolve({
                        months,
                        values
                    });

                }

            })

        });

    }

}