import { getMarkets } from "./api/polymarket.js";

async function main() {
  const markets = await getMarkets();

  for (const market of markets.slice(0, 5)) {
    console.log("Question:", market.question);
    console.log("Volume:", market.volume);
    console.log("----");
  }
}

main().catch((error) => {
  console.error("Error running app:", error);
});