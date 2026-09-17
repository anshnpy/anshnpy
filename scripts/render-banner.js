const fs = require("fs");
const puppeteer = require("puppeteer");

const WIDTH = 1400;
const HEIGHT = 380;
const TOTAL = 96;

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewport({
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1
  });

  for (let i = 0; i < TOTAL; i++) {
    const n = String(i).padStart(3, "0");
    const svgPath = `file://${process.cwd()}/dist/banner/frame-${n}.svg`;

    await page.goto(svgPath, {
      waitUntil: "load"
    });

    await page.screenshot({
      path: `dist/banner/frame-${n}.png`,
      type: "png"
    });

    if ((i + 1) % 12 === 0) {
      console.log(`Rendered ${i + 1}/${TOTAL}`);
    }
  }

  await browser.close();

  console.log("All PNG frames rendered.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
