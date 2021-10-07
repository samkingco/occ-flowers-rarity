const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const GIFEncoder = require("gifencoder");
const PNG = require("png-js");

// Set low framerate for now, faster rendering speed
const GIF_FPS = 25;
const GIF_DUR = 1;
const ORIG_DUR = 8;
const SLOWDOWN_FACTOR = 10;
const FRAME_TIME = (1 / GIF_FPS) * 1000;
const GIF_DIMENSION = 500;

function decode(png) {
  return new Promise((r) => {
    png.decode((pixels) => r(pixels));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  // Load the data
  const flowersData = fs.readFileSync(
    path.join(process.cwd(), "./output/flowers.json")
  );
  const flowers = JSON.parse(flowersData);

  const imagesData = fs.readFileSync(
    path.join(process.cwd(), "./output/images.json")
  );
  const images = JSON.parse(imagesData);

  const data = [];
  for (const [tokenId, attributes] of Object.entries(flowers)) {
    if (attributes.spin) {
      data.push({
        tokenId,
        image: images[tokenId],
      });
    }
  }

  // Start browser to convert svg to png
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 0,
  });

  const page = await browser.newPage();
  await page.setViewport({
    height: GIF_DIMENSION,
    width: GIF_DIMENSION,
  });

  // Generate gif files
  for (const token of data) {
    // Set up a new gif encoder
    const encoder = new GIFEncoder(GIF_DIMENSION, GIF_DIMENSION);
    encoder
      .createWriteStream()
      .pipe(
        fs.createWriteStream(
          path.join(process.cwd(), `gifs/${token.tokenId}.gif`)
        )
      );

    console.log(`Generating gif for flower #${token.tokenId}`);

    // Grab the base64 data and parse out the SVG file
    const base64 = token.image;
    let svg = Buffer.from(base64.substring(26), "base64").toString();
    // Slow down the animation so puppeteer has time to get and save screenshots
    svg = svg.split('dur="8s"').join(`dur="${ORIG_DUR * SLOWDOWN_FACTOR}s"`);
    // Render the svg to the headless browser
    await page.setContent(
      `<!DOCTYPE html><style>* { margin: 0; padding: 0; }</style>${svg}`,
      { waitUntil: "domcontentloaded" }
    );

    // Start the encoder
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(FRAME_TIME);
    encoder.setQuality(10);

    // Store frames for encoding later
    // This helps to not lag puppeteer if we delay encoding
    const pngFrames = [];

    // Grab a screenshot of each frame
    for (let frame = 0; frame < GIF_FPS * GIF_DUR; frame++) {
      const pngBuffer = page.screenshot({
        clip: { width: GIF_DIMENSION, height: GIF_DIMENSION, x: 0, y: 0 },
      });
      pngFrames.push(pngBuffer);
      await sleep(FRAME_TIME * SLOWDOWN_FACTOR);
    }

    for (const pngFrame of pngFrames) {
      const frame = await pngFrame;
      const png = new PNG(frame);
      await decode(png).then((pixels) => encoder.addFrame(pixels));
    }

    encoder.finish();
    console.log(`Done with ${token.tokenId}`);
  }

  // Clean up the headless browser
  await browser.close();

  console.log("Saved all the flower gifs into gifs folder");
})().catch((err) => {
  console.error(err);
});
