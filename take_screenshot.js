const puppeteer = require('puppeteer');
const fs = require('fs');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  await page.goto('http://localhost:3000');

  const circuitState = fs.readFileSync('circuit.json', 'utf8');

  await page.evaluate((state) => {
    localStorage.setItem('livespice-circuit-storage', state);
  }, circuitState);

  await page.reload({ waitUntil: 'networkidle0' });

  await wait(2000);

  // Find and click the "Run Sim" button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Run Sim')) {
      await btn.click();
      break;
    }
  }

  // Wait for the simulation to run and the chart to render
  await wait(3000);

  // Wait for the oscilloscope window to be visible
  await page.waitForSelector('.waveform-plot', { timeout: 10000 }).catch(() => console.log('Could not find waveform plot'));
  
  await wait(2000);

  await page.screenshot({ path: '/home/amnahid/.gemini/antigravity/brain/bd4e051e-a9f0-4b4f-87bf-ea093215d00f/screenshot.png' });

  await browser.close();
})();
