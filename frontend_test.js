const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: 'videos/'
    }
  });
  const page = await context.newPage();

  await page.goto('file:///app/index.html');
  await page.waitForTimeout(1000); // Give the game time to load

  await page.screenshot({ path: 'screenshot.png' });

  await browser.close();
})();
