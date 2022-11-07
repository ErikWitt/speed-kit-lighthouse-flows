import fs from 'fs';
import open from 'open';
import puppeteer from 'puppeteer';
import {startFlow} from 'lighthouse/lighthouse-core/fraggle-rock/api.js';

const start = 'https://www.engelhorn.de/'
const home = 'https://www.engelhorn.de/de-de/damen/';
const pdp = 'https://www.engelhorn.de/de-de/weekend-max-mara-damen-minirock-ricamo-braun-V1077884F.html';
const plp = 'https://www.engelhorn.de/de-de/damen/bekleidung/roecke/';

async function captureReport(activateSpeedKit) {
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


  // Go to start page and accept cookies
  const startUrl = new URL(start);
  startUrl.searchParams.append(activateSpeedKit ? 'enableSpeedKit' : 'disableSpeedKit', '1')
  await page.goto(startUrl.toString(), {waitUntil: 'load'});
  const confirmationSelector = '#cmpbntyestxt';
  await page.waitForSelector(confirmationSelector);
  await page.click(confirmationSelector);

  // Run lighthouse tests
  const flow = await startFlow(page, { name: 'Comparisson' });
  await navigate(flow, home, 'home page');
  await navigate(flow, plp, 'listing page');
  await navigate(flow, pdp, 'product page');

  // Generate reports
  await browser.close();
  const report = await flow.generateReport();
  const filename = `flow.report-${activateSpeedKit ? 'SK' : 'noSK'}-.html`;
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
  await captureReport(true);
  await captureReport(false);
}

runReports();
