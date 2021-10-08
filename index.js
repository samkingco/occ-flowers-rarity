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

      console.log(`Successfully picked flower #${tokenId}`);

      // Flatten and normalise attrs
      const attributes = result.attributes.reduce((allAttrs, attr) => {
        const type = camelCase(attr.trait_type).replace("bG", "bg");
        let value = attr.value;
        if (attr.value === "True") {
          value = true;
        } else if (value === "False") {
          value = false;
        }
        allAttrs[type] = value;
        return allAttrs;
      }, {});

      return {
        tokenId,
        attributes,
        image: result.image,
      };
    })
  );

  const flowers = {};
  for (const { tokenId, ...tokenData } of data) {
    flowers[tokenId] = tokenData;
  }

  fs.writeFileSync(
    path.join(process.cwd(), "./output/flowers.json"),
    JSON.stringify(flowers, null, 2)
  );

  console.log("Picked all the flowers data into output/flowers.json");
})().catch((err) => {
  console.error(err);
});

function camelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index == 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "")
    .replace(".", "");
}
