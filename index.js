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
        const type = slugify(attr.trait_type);
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
        [tokenId]: {
          ...attributes,
        },
      };
    })
  );

  fs.writeFileSync(
    path.join(process.cwd(), "./output/flowers.json"),
    JSON.stringify(data, null, 2)
  );

  console.log("Picked all the flowers data into output/flowers.json");
})().catch((err) => {
  console.error(err);
});

function slugify(string) {
  return string
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
