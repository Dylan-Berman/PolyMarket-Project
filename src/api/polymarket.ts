import axios from "axios";

const BASE_URL = "https://gamma-api.polymarket.com"
export async function getMarkets() {
  const response = await axios.get(`${BASE_URL}/markets`);
  return response.data;
}