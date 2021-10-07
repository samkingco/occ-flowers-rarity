const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const GIFEncoder = require("gifencoder");
const PNG = require("png-js");
const inkjet = require("inkjet");
const cliProgress = require("cli-progress");

// Set low framerate for now, faster rendering speed
const GIF_FPS = 10;
const GIF_DUR = 8;
const TOTAL_FRAMES = GIF_FPS * GIF_DUR;
const SLOWDOWN_FACTOR = 10;
const FRAME_TIME = (1 / GIF_FPS) * 1000;
const GIF_DIMENSION = 500;

const minimalPuppeteerArgs = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
];

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
    if (tokenId === "108") {
      // if (attributes.spin) {
      data.push({
        tokenId,
        image: images[tokenId],
      });
    }
  }

  // Start headless browser to convert svg to png
  const browser = await puppeteer.launch({
    headless: true,
    args: minimalPuppeteerArgs,
  });

  // Open the headless browser page
  const page = await browser.newPage();
  await page.setViewport({
    height: GIF_DIMENSION,
    width: GIF_DIMENSION,
  });

  // Generate gif files
  for (const token of data) {
    // Set logging things
    const renderProgress = new cliProgress.SingleBar();
    const encodeProgress = new cliProgress.SingleBar();

    // Set up a new gif encoder
    const encoder = new GIFEncoder(GIF_DIMENSION, GIF_DIMENSION);
    encoder
      .createWriteStream()
      .pipe(
        fs.createWriteStream(
          path.join(process.cwd(), `gifs/${token.tokenId}.gif`)
        )
      );

    // Start the encoder
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(FRAME_TIME);
    encoder.setQuality(10);

    // Grab the base64 data and parse out the SVG file
    const base64 = token.image;
    let svg = Buffer.from(base64.substring(26), "base64").toString();

    // Slow down animation so puppeteer has time to get and save screenshots
    svg = svg.split('dur="8s"').join(`dur="${GIF_DUR * SLOWDOWN_FACTOR}s"`);

    // Render the svg to the headless browser
    await page.setContent(
      `<!DOCTYPE html><style>* { margin: 0; padding: 0; }</style>${svg}`
    );

    // Delay the start of the recording to wait for loading, we can't use the
    // `page.waitForSelector` because it doesn't work with `page.setContent`
    await sleep(1000);

    // Logging
    console.log(`Rendering flower #${token.tokenId}`);
    renderProgress.start(TOTAL_FRAMES, 0);

    // Store frames for encoding later
    // This helps to not lag puppeteer if we delay encoding
    const frames = [];

    // Grab a screenshot of each frame
    for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
      renderProgress.update(frame + 1);
      const frameBuffer = page.screenshot({
        clip: { width: GIF_DIMENSION, height: GIF_DIMENSION, x: 0, y: 0 },
        type: "jpeg",
        quality: 100,
      });
      frames.push(frameBuffer);
      await sleep(FRAME_TIME * SLOWDOWN_FACTOR);
    }

    // Logging
    renderProgress.stop();
    console.log(`Generating gif for flower #${token.tokenId}`);
    encodeProgress.start(frames.length, 0);

    for (let i = 0; i < frames.length; i++) {
      encodeProgress.update(i + 1);
      const frame = await frames[i];
      inkjet.decode(frame, (err, { data }) => {
        if (!err) {
          encoder.addFrame(data);
        }
      });

      // For when using PNG instead of JPG
      // const png = new PNG(frame);
      // await decode(png).then((pixels) => encoder.addFrame(pixels)});
    }

    encoder.finish();
    encodeProgress.stop();
  }

  // Clean up the headless browser
  await browser.close();

  console.log("Saved all the flower gifs into gifs folder");
})().catch((err) => {
  console.error(err);
});
