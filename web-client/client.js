const puppeteer = require('puppeteer');

const WEB_PORT=parseInt(process.env.WEB_PORT);
const DS_LENGTH=parseInt(process.env.DS_LENGTH);

const args = process.argv;
console.log("args:", args);

puppeteer.launch({
  headless: 'new',
  // `headless: true` (default) enables old Headless;
  // `headless: 'new'` enables new Headless;
  // `headless: false` enables “headful” mode.
})
.then(browser => {

    browser.newPage()
    .then(page => {

        page.waitForRequest(request => request.url().startsWith(`http://localhost:${WEB_PORT}/h5/close`), {timeout: 1000 * 60 * 60 * 8})
        .then(() => {

            setTimeout(() => {

                browser.close();
                console.debug('successfully closed')
            }, 1000);
        })

        page.goto(`http://localhost:${WEB_PORT}/plate.html?sample_no=16`)
        .then(() => {

            page.waitForNavigation()
            // .then(() => browser.close())
        })
    })
})
