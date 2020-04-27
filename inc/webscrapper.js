const puppeteer = require('puppeteer');
/* const prompt = require('prompt-async');

let schema = {
    properties: {
      token: {
        pattern: /^[0-9]{6}$/,
        message: 'O token deve ter 6 dígitos contendo apenas números',
        required: true
      }
    }
}; */


const getInput = (value/* , array */)=>{

    /*let idIndex  = (array[0].values).indexOf(value);
    return '#' + array[0].ids[idIndex];*/

    if(value.match(/^[0-9]+$/)){
        
        if(value ==- '0') value = '1' + value;
        return `#tecladoNormal > div:nth-child(1) > input:nth-child(${value})`;

    }
    else{

        switch(value){

            case 'n':
                return '#tecladoNormal > div.grid-100.mobile-grid-100.tablet-grid-100.grid-parent.prefix-10.tablet-prefix-10.mobile-prefix-10 > input:nth-child(7)';
            case 'z':
                return '#tecladoNormal > div.grid-100.mobile-grid-100.tablet-grid-100.grid-parent.prefix-10.tablet-prefix-10.mobile-prefix-10 > input:nth-child(2)';
    
        }

    }

};

const login = async (page, conta, senha, token)=>{

    /* const browser = await puppeteer.launch({
        slowMo: 100,
        headless: true
    }); */


    /* const page = await browser.newPage(); */
    await page.setUserAgent('5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
    await page.goto('https://internetbanking.bancointer.com.br/login.jsf');

    await page.waitFor('input[name=loginv20170605]');
    await console.log('digitando número da conta');
    await page.type('input[name=loginv20170605]', conta);
    //await page.type('input[name=senha]', pass, {delay: 185});

    await page.click('#panelPrincipal > div.grid-40.mobile-grid-50.tablet-grid-40 input[type=submit]');
    await page.waitFor('#panelGeralv20170605 > div.grid-30.mobile-grid-100.tablet-grid-50.topo20.topo30-tablet a');
    await page.click('#panelGeralv20170605 > div.grid-30.mobile-grid-100.tablet-grid-50.topo20.topo30-tablet a');

    await page.waitFor('#panelTeclado > div.grid-100.mobile-grid-100.tablet-grid-100.grid-parent.barraPanel.ocultarJanela > div.grid-90.mobile-grid-90.tablet-grid-90 > h2');

    let inputsArray = [];

    await inputsArray.push({ids: await page.evaluate(() => Array.from(document.querySelectorAll('.btsResgate'), e => e.id)), 
                    values: await page.evaluate(() => Array.from(document.querySelectorAll('.btsResgate'), e => e.value))});

    await console.log('digitando senha no teclado virtual');
    for(let i = 0; i < senha.length; i++){

        await page.click(getInput(senha[i]/* , inputsArray */));
        await page.waitFor(150);

    }

    await page.click('#panelTeclado > div.bgTeclado.grid-100.mobile-grid-100.tablet-grid-100.formularioLogin > div.grid-100.mobile-grid-100.tablet-grid-100.grid-parent > div.grid-25.mobile-grid-30.tablet-grid-25.grid-parent > input');
    await page.waitFor('#codigoAutorizacaoAOTP');
    
    /* await prompt.start();
    let {token} = await prompt.get(schema); */

    await page.type('#codigoAutorizacaoAOTP', token, {delay: 100});

    await console.log('Efetuando login');
    await page.click('#confirmarCodigoTransacaoAOTP');

    await page.waitFor('#frmSaldos > div > div.grid-100.boxResultadosSaldo.topo10-mobile > a');

    await console.log('Login efetuado!');

    //await browser.close();


};

const getSaldo = async (page)=>{

    await page.click('#frmSaldos > div > div.grid-100.boxResultadosSaldo.topo10-mobile > a');
    await page.waitFor('#frmSaldos > div > div.grid-100.mobile-grid-100.tablet-grid-100.grid-parent > div:nth-child(4) > table > tbody > tr > td:nth-child(2) > span > span');
    let element = await page.$('#frmSaldos > div > div.grid-100.mobile-grid-100.tablet-grid-100.grid-parent > div:nth-child(4) > table > tbody > tr > td:nth-child(2) > span > span');

    let saldo = await page.evaluate(element => element.textContent, element);

    await console.log('Seu saldo atual é de:', saldo);

};

const gerarBoleto = async (page, valor, vencimento)=>{

    /* let arrayVencimento = vencimento.split('/');
    
    let dia = arrayVencimento[0];
    let mes = arrayVencimento[1];
    let ano = arrayVencimento[2]; */

    vencimento = await vencimento.replace(new RegExp('/', 'g'), '');

    console.log('Carregando página inicial');
    await page.goto('https://internetbanking.bancointer.com.br/contacorrente/pagueFacil.jsf');
    await page.waitFor('#edtVlrBoleto');
    console.log('Página inicial carregada');

    await page.evaluate(()=>document.querySelector('#edtVlrBoleto').value = '');
    console.log('Digitando valor do boleto');
    await page.type('#edtVlrBoleto', valor, {delay: 100});
    
    console.log('Digitando data do boleto');
    await page.evaluate(element => {
        $(element).removeAttr('readonly');
        $(element).val('');
    }, '#dataVencimento_input');
    

    for(let i = 0; i < vencimento.length; i++){

        setTimeout(async () => {

            await page.evaluate(element => $(element).removeAttr('readonly'), '#dataVencimento_input');
            await page.type('#dataVencimento_input', vencimento[i]);

        }, 400);
        

    }

    await page.evaluate(element => $(element).blur(), '#dataVencimento_input');

    await page.waitFor(1000);

    console.log('Gerando boleto...');
    await page.click('#linkEmitir');
    
    await page.waitFor(500);
    await page.waitFor('#pngMsgSucesso > div > h2');
    await console.log(`Boleto no valor de R$ ${valor} com vencimento para ${vencimento} gerado com sucesso!`);

    let codigoElement = await page.$('#codigoBarrasBoleto');

    let codigoBarras = await page.evaluate(element => element.textContent, codigoElement);

    console.log('Código de barras:', codigoBarras);
    return codigoBarras;


}

async function init(headless = true){

    const browser = await puppeteer.launch({
        //executablePath: 'C:\\Users\\Enzo\\Documents\\Cursos Udemy\\JS\\Teste-Web-Scrapping\\node_modules\\puppeteer\\.local-chromium\\win64-737027\\chrome-win\\chrome.exe',
        slowMo: 50,
        headless,
        args: ['--no-sandbox', '--disable-gpu']
    });
    
    console.log('Navegador iniciado');

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    /* await login(page, '147382');
    await getSaldo(page);
    await gerarBoleto(page, '20,00', '30/04/2020');
 */
    return page;


};

module.exports.init = init;
module.exports.login = login;
module.exports.gerarBoleto = gerarBoleto;
module.exports.getSaldo = getSaldo;