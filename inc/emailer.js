const nodemailer = require('nodemailer');
//const credentials = require('./credentials.json');
require('dotenv').config();

module.exports = {

    sendEmail(subject, text, html, to){

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:{
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });

        const mailOptions = {
            from: 'Enzo <enzobonfx@gmail.com>',
            to,
            subject,
            html: text + '<p>' + html,
            attachments: [{
                filename: 'qrcode.PNG',
                path: './inc/img/qrcode.PNG',
                cid: 'qrcodeimg'
            }]
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