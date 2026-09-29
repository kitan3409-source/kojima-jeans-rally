import { chromium } from '@playwright/test';
console.log('imported');
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });
console.log('launched');
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
for (const [url, name] of [
  ['http://localhost:5173/', '01-top'],
  ['http://localhost:5173/stamps', '02-stamps'],
  ['http://localhost:5173/scan', '03-scan'],
  ['http://localhost:5173/complete', '04-complete'],
  ['http://localhost:5173/admin', '05-admin'],
]) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/${name}.png`, fullPage: true });
  console.log(`done ${name}`);
}
await browser.close();
console.log('All done');
