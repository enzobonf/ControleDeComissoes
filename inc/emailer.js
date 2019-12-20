const nodemailer = require('nodemailer');

module.exports = {

    sendEmail(subject, text, html, to){

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:{
                user: 'enzobonfx@gmail.com',
                pass: '3nz02002'
            }
        });

        const mailOptions = {
            from: 'Enzo',
            to,
            subject,
            html: text + '<p>' + html
        };

        return new Promise((resolve, reject)=>{

            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    reject(error);
                } else {
                    resolve(info.response);
                }
            });

        });

    }

}