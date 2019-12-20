var conn = require('./db');
var moment = require('moment');

module.exports = {

    selectLates(){

        return new Promise((resolve, reject)=>{

            let dateNow = moment.parseZone().format("YYYY-MM-DD");

            conn.query(`
                SELECT * FROM comissoes WHERE DATA_RECEBIMENTO < '${dateNow}' and SITUACAO = 0`,
            (err, results)=>{
            
                if(err){
                    reject(err);
                }
                
                resolve(results);

            });

        });   
    }

}