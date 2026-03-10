import axios from "axios";

async function main() {
  const response = await axios.get(
    "https://gamma-api.polymarket.com/markets"
  );

  const markets = response.data;

  console.log("Markets:", markets.length);
  console.log(markets[0]);
}

main();