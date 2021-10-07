const fs = require("fs");
const path = require("path");
const GIFEncoder = require("gifencoder");
const { convert } = require("convert-svg-to-png");
const { createCanvas, loadImage } = require("canvas");

// Set low framerate for now, faster rendering speed
const GIF_FPS = 10;
const GIF_DUR = 1;

class SvgGif {
  constructor({ width = 500, height = 500, fileName, repeat = 0 }) {
    this.width = width;
    this.height = height;

    this.encoder = new GIFEncoder(width, height);

    this.encoder
      .createReadStream()
      .pipe(
        fs.createWriteStream(path.join(process.cwd(), "./gifs/", fileName))
      );

    // GIF encoder setup
    this.encoder.start();
    this.encoder.setRepeat(repeat); // 0 for repeat, -1 for no-repeat
    this.encoder.setDelay((1 / GIF_FPS) * 1000); // frame delay in ms
    this.encoder.setQuality(10);

    // Canvas for rendering frames to
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext("2d");
  }

  async addFrame(svg) {
    // Convert the svg to png using a headless browser
    const pngData = await convert(svg, {
      width: this.width,
      height: this.height,
    });
    // Convert the png to base64 so we can load it into canvas
    const base64 = `data:image/svg+xml;base64,${pngData.toString("base64")}`;
    // Load and draw the image
    const image = await loadImage(base64);
    this.ctx.drawImage(image, 0, 0, this.width, this.height);
    // Add to the gif
    this.encoder.addFrame(this.ctx);
  }

  finish() {
    this.encoder.finish();
  }
}

(async () => {
  // Load and normalise the data
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

  console.log(data);

  // Generate gif files
  for (const token of data) {
    // Grab the base64 data and parse out the SVG file
    const base64 = token.image;
    let svg = Buffer.from(base64.substring(26), "base64").toString();

    // Start a new svg to gif encoder
    const gif = new SvgGif({
      width: 500,
      height: 500,
      fileName: `${token.tokenId}.gif`,
    });

    console.log(`Generating gif for ${token.tokenId}`);

    // Set up the number of frames
    const framesArr = Array.from(
      { length: GIF_FPS * GIF_DUR },
      (_, i) => i + 1
    );

    // For each frame
    for (const frameNumber of framesArr) {
      const frameTime = 1 / GIF_FPS;
      // Calculate the offset to start the animation
      const offsetMs = Math.round(
        (frameNumber * frameTime + Number.EPSILON) * 1000
      );
      // Change the original SVG to include the new offset
      const frame = svg.split('begin="0s"').join(`begin="${offsetMs}ms"`);
      // Render the frame
      await gif.addFrame(frame, frameNumber);
    }

    // Finish gif rendering
    gif.finish();
    console.log(`Done with ${token.tokenId}`);
  }

  console.log("Saved all the flower gifs into gifs folder");
})().catch((err) => {
  console.error(err);
});
