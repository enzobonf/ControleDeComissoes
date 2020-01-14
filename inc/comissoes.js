var conn = require('./db');
var moment = require('moment');

module.exports = {

    select(late, limit = 20){

        return new Promise((resolve, reject)=>{

            let dateNow = moment.parseZone().format("YYYY-MM-DD");

            conn.query(`
                SELECT * FROM Comissoes ${(late) ? 'WHERE DATA_RECEBIMENTO < ? and SITUACAO = 0' : ''}
                ORDER BY DATA_RECEBIMENTO DESC
                LIMIT ${limit}`, [
                    dateNow,
                ],(err, results)=>{
            
                if(err){
                    reject(err);
                }
                7
                resolve(results);

            });

        });   
    }

}