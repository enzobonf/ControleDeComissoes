var conn = require('./db');
var moment = require('moment');

module.exports = {

    select(late, req = ''){

        return new Promise((resolve, reject)=>{

            let dateNow = moment.parseZone().format("YYYY-MM-DD");

            let limit = 20;
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
    }

}