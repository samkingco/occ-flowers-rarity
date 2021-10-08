const fs = require("fs");
const path = require("path");

function outputJSON(filename, data) {
  fs.writeFileSync(
    path.join(process.cwd(), filename),
    JSON.stringify(data, null, 2)
  );
}

(async () => {
  const data = fs.readFileSync(
    path.join(process.cwd(), "./output/flowers.json")
  );
  const flowers = JSON.parse(data);
  const TOTAL_FLOWERS = 4096;

  // Calculate attribute occurrences
  let occurrences = {};
  for (let i = 0; i < TOTAL_FLOWERS; i++) {
    const attributes = flowers[(i + 1).toString()].attributes;

    // Add up number of occurrences of each attribute
    for (const [key, value] of Object.entries(attributes)) {
      occurrences[key] = {
        ...occurrences[key],
        [value]:
          occurrences[key] && occurrences[key][value]
            ? occurrences[key][value] + 1
            : 1,
      };
    }
  }

  // Output occurrences
  outputJSON("./output/occurrences.json", occurrences);

  // Calculate occurrence scores
  let rarityOccurrence = [];
  for (let i = 0; i < TOTAL_FLOWERS; i++) {
    let score = 0;
    const attributes = flowers[(i + 1).toString()].attributes;

    // Increase the score by adding up the number of occurrences
    // for each of the flowers attrubutes. Lower score = more rare attributes.
    for (const [key, value] of Object.entries(attributes)) {
      score += occurrences[key][value];
    }
    rarityOccurrence.push({ tokenId: i + 1, score });
  }

  // Sort by score
  rarityOccurrence = rarityOccurrence.sort((a, b) => a.score - b.score);
  // Sort by index of score
  rarityOccurrence = rarityOccurrence.map((flower, i) => ({
    ...flower,
    rarest: i + 1,
  }));

  // Print flower rarity by occurrence score
  outputJSON("./output/rarity-occurrence.json", rarityOccurrence);

  // Calculate pure probability
  let rarityProbability = [];
  for (let i = 0; i < TOTAL_FLOWERS; i++) {
    let scores = [];
    const attributes = flowers[(i + 1).toString()].attributes;

    for (const [key, value] of Object.entries(attributes)) {
      // Collect probability of individual attribute occurrences
      scores.push(occurrences[key][value] / TOTAL_FLOWERS);
    }

    // Multiply probabilites P(A and B) = P(A) * P(B)
    const p = scores.reduce((a, b) => a * b);
    rarityProbability.push({ tokenId: i + 1, score: p });
  }

  // Sort by probability
  rarityProbability = rarityProbability.sort((a, b) => a.score - b.score);
  // Sort by index of probability
  rarityProbability = rarityProbability.map((flower, i) => ({
    ...flower,
    score: Math.abs(Math.log(flower.score)),
    rarest: i + 1,
  }));

  // Print flower rarity by probability score
  outputJSON("./output/rarity-probability.json", rarityProbability);

  // Calculate using rarity tools formula
  let rarityScore = [];
  for (let i = 0; i < TOTAL_FLOWERS; i++) {
    let scores = [];
    const attributes = flowers[(i + 1).toString()].attributes;

    for (const [key, value] of Object.entries(attributes)) {
      // Collect probability of individual attribute occurrences
      scores.push(1 / (occurrences[key][value] / TOTAL_FLOWERS));
    }

    const score = scores.reduce((a, b) => a + b);
    rarityScore.push({ tokenId: i + 1, score });
  }

  // Sort by score
  rarityScore = rarityScore.sort((a, b) => b.score - a.score);
  // Sort by index of score
  rarityScore = rarityScore.map((flower, i) => ({
    ...flower,
    rarest: i + 1,
  }));

  // Print flower rarity tools formula score
  outputJSON("./output/rarity-rt-formula.json", rarityScore);
})();
