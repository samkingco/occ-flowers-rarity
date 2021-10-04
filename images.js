const fs = require("fs");
const path = require("path");
const { contract, tokenIds } = require("./contract");

(async () => {
  // Collect the data from the contract
  const data = await Promise.all(
    tokenIds.map(async (tokenId) => {
      console.log(`Finding flower #${tokenId}`);

      const tokenURI = await contract.tokenURI(tokenId);
      const json = Buffer.from(tokenURI.substring(29), "base64").toString();
      const result = JSON.parse(json);

      console.log(`Successfully saw flower #${tokenId}`);

      return {
        tokenId,
        image: result.image,
      };
    })
  );

  const images = data.reduce((map, token) => {
    map[token.tokenId] = token.image;
    return map;
  }, {});

  fs.writeFileSync(
    path.join(process.cwd(), "./output/images.json"),
    JSON.stringify(images, null, 2)
  );

  console.log("Saved all the flower images into output/images.json");
})().catch((err) => {
  console.error(err);
});
