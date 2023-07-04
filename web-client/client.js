const puppeteer = require('puppeteer');
const {ArgumentParser} = require('./argument-parser');

console.debug('process.argv:', process.argv);

const parser = new ArgumentParser();
parser.add_argument({name: 'hostname', type: 'string', default: 'localhost'})
parser.add_argument({name: 'port', type: 'int', required: true})
parser.add_argument({name: 'ds-length', type: 'int', default: 1024})

const opts = parser.parse_args(process.argv.slice(2));

console.debug('opts:', opts);

const URL_AUTHORITY = `${opts['hostname']}:${opts['port']}`;
const DS_LENGTH = opts['ds-length'] || parseInt(process.env.DS_LENGTH);

puppeteer.launch({
  headless: 'new',
  // `headless: true` (default) enables old Headless;
  // `headless: 'new'` enables new Headless;
  // `headless: false` enables “headful” mode.
})
.then(browser => {

    browser.newPage()
    .then(page => {

        page.waitForRequest(request => request.url().startsWith(`http://${URL_AUTHORITY}/h5/close`), {timeout: 1000 * 60 * 60 * 8})
        .then(() => {

            setTimeout(() => {

                browser.close();
                console.debug('successfully generated and closed')
            }, 1000);
        })

        page.goto(`http://${URL_AUTHORITY}/plate.html?sample_no=${DS_LENGTH}`)
        .then(() => {

            page.waitForNavigation()
        })
    })
})
