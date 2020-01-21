const nodemailer = require('nodemailer');
const credentials = require('./credentials.json');

module.exports = {

    sendEmail(subject, text, html, to){

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:{
                user: credentials.email,
                pass: credentials.password
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