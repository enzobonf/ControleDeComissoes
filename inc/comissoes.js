var conn = require('./db');
var moment = require('moment');
var Pagination = require('./pagination');

const getSituationString = (situation) =>{

    switch(situation){
        case 'pagas':
            return ['WHERE SITUACAO = 1', true];
        case 'atrasadas':
            return ['WHERE DATA_RECEBIMENTO < ? and SITUACAO = 0', true];
        case 'emAberto':
            return ['WHERE DATA_RECEBIMENTO >= ? and SITUACAO = 0', true];
        default:
            return ['', false];
    }

};

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
                active: false,
                subMenus: [
                    {
                        text: 'Todas',
                        href: '/comissoes',
                        icon: 'circle',
                        active: false
                    },
                    {
                        text: 'Atrasadas',
                        href: '/comissoes?sit=atrasadas',
                        icon: 'circle',
                        active: false
                    },
                    {
                        text: 'Em aberto',
                        href: '/comissoes?sit=emAberto',
                        icon: 'circle',
                        active: false
                    },
                    {
                        text: 'Pagas',
                        href: '/comissoes?sit=pagas',
                        icon: 'circle',
                        active: false
                    },
                    {
                        text: 'Cadastrar com Arquivo',
                        href: '/cadastroArquivo',
                        onclick: 'selectImageOCR(moment)',
                        icon: 'plus',
                        active: false
                    }
                ]
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
            
            if(menu.href == `${req.url.split('?')[0]}`) menu.active = true;
            if(menu.subMenus){
                menu.subMenus.map(subMenu=>{
                    if(subMenu.href === req.url) {
                        subMenu.active = true;
                        menu.active = true;
                    }
                });
            }

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

    /* select(late, req = ''){

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
                LIMIT ${limit}`, params, (err, results)=>{

                    if(err){
                        reject(err);
                    }
                    else{
                        resolve(results);
                    }

                    
                });

        });   
    }, */

    select(req){

        return new Promise((resolve, reject)=>{

            let dateNow = moment.parseZone().format("YYYY-MM-DD");

            let page = req.query.page;
            let dtStart = req.query.start;
            let dtEnd = req.query.end;

            if(!page) page = 1;

            let params = [];

            let useSituation = getSituationString(req.query.sit)[1];
            let situationQuery = getSituationString(req.query.sit)[0];

            if(useSituation && req.query.sit !== 'pagas'){
                params.push(dateNow);
            }

            if(dtStart && dtEnd && !useSituation) params.push(dtStart, dtEnd);

            let pag = new Pagination(
                `SELECT SQL_CALC_FOUND_ROWS  * FROM Comissoes 
                ${(useSituation) ? situationQuery : ''}
                ${((dtStart && dtEnd) && !useSituation) ? 'WHERE DATA_RECEBIMENTO BETWEEN ? AND ?' : ''}
                ORDER BY DATA_RECEBIMENTO DESC
                LIMIT ?, ?`
            , params);

            pag.getPage(page).then(data=>{

                resolve({
                    data,
                    links: pag.getNavigation(req.query)
                });

            }).catch(err=>{
                reject(err);
            });

        });

    },

    pesquisaPedido(pedido){

        return new Promise((resolve, reject)=>{

            conn.query(`SELECT * FROM Comissoes WHERE ID_PEDIDO = ?
            `, pedido, (err, results)=>{

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

    marcarPaga(ids){
        
        return new Promise((resolve, reject)=>{

            let formatedIds = ids.join(',');

            conn.query(`
                UPDATE Comissoes SET SITUACAO = 1 WHERE ID_COMISSAO IN (${formatedIds})
            `, [
                formatedIds
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

    chart(start, end){

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
                start,
                end
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