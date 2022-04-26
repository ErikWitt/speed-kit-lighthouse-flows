import fs from 'fs';
import open from 'open';
import puppeteer from 'puppeteer';
import {startFlow} from 'lighthouse/lighthouse-core/fraggle-rock/api.js';

const start = 'https://www.engelhorn.de/'
const home = 'https://www.engelhorn.de/de-de/damen/';
const pdp = 'https://www.engelhorn.de/de-de/raffaello-rossi-damen-joggerpants-candy-less-pipe-blau-V1075013E.html';
const plp = 'https://www.engelhorn.de/de-de/damen/marken/r/raffaello-rossi/';

async function captureReport(testId, group) {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    ignoreHTTPErrors: true,
    defaultViewport: {
      width: 390,
      height: 844,
      isMobile: true,
    }
  });
  const page = await browser.newPage();

  await page.setCookie({
    name: 'baqend-speedkit-ab-test-info',
    value: `%7B%22group%22%3A%22${group}%22%2C%22testId%22%3A%22${testId}%22%7D`,
    domain: 'www.engelhorn.de'
  });
  // Go to start page and accept cookies
  await page.goto(start, {waitUntil: 'load'});
  const confirmationSelector = '#cmpwelcomebtnyes .cmpboxbtn';
  await page.waitForSelector(confirmationSelector);
  await page.click(confirmationSelector);

  // Run lighthouse tests
  const flow = await startFlow(page, { name: 'Engelhorn comparisson' });
  await navigate(flow, home, 'home page');
  await navigate(flow, plp, 'listing page');
  await navigate(flow, pdp, 'product page');

  // Generate reports
  await browser.close();
  const report = await flow.generateReport();
  const filename = `flow.report-${testId}-${group}-.html`;
  fs.writeFileSync(filename, report);
  await open(filename, {wait: false});
}

async function navigate(flow, page, name) {
  const startLoad = Date.now();
  await flow.navigate(page, {
    stepName: name,
    skipAboutBlank: true,
    configContext: {
      settingsOverrides: {
        disableStorageReset: true,
        maxWaitForLoad: 10000,
        screenEmulation: { disabled: true },
        formFactor: 'mobile',
      },
    },
  });
  console.log(`${Date.now() - startLoad}s to load ${page}`);
}

async function runReports() {
  await captureReport('100vs0', 'A');
  await captureReport('100vs0', 'B');
}

runReports();
