import axios from "axios";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DATA_BASE_URL = "https://data-api.polymarket.com";

const gammaApi = axios.create({
  baseURL: GAMMA_BASE_URL,
  timeout: 15_000,
});

const dataApi = axios.create({
  baseURL: DATA_BASE_URL,
  timeout: 15_000,
});

export type LeaderboardCategory =
  | "OVERALL"
  | "POLITICS"
  | "SPORTS"
  | "CRYPTO"
  | "CULTURE"
  | "MENTIONS"
  | "WEATHER"
  | "ECONOMICS"
  | "TECH"
  | "FINANCE";

export type LeaderboardTimePeriod = "DAY" | "WEEK" | "MONTH" | "ALL";
export type LeaderboardOrderBy = "PNL" | "VOL";
export type TradeSide = "BUY" | "SELL";

export interface Market {
  question: string;
  volume: number | string;
}

export interface LeaderboardEntry {
  rank: string;
  proxyWallet: string;
  userName?: string;
  vol: number;
  pnl: number;
  profileImage?: string;
  xUsername?: string;
  verifiedBadge?: boolean;
}

export interface Position {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon?: string;
  eventSlug?: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome?: string;
  oppositeAsset?: string;
  endDate?: string;
}

export interface Trade {
  proxyWallet: string;
  side: TradeSide;
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title: string;
  slug: string;
  icon?: string;
  eventSlug?: string;
  outcome: string;
  outcomeIndex: number;
  name?: string;
  pseudonym?: string;
  bio?: string;
  profileImage?: string;
  profileImageOptimized?: string;
  transactionHash?: string;
}

export interface UserValue {
  user: string;
  value: number;
}

export async function getMarkets() {
  const response = await gammaApi.get<Market[]>("/markets");
  return response.data;
}

export async function getLeaderboard(options?: {
  category?: LeaderboardCategory;
  timePeriod?: LeaderboardTimePeriod;
  orderBy?: LeaderboardOrderBy;
  limit?: number;
  offset?: number;
  user?: string;
}) {
  const response = await dataApi.get<LeaderboardEntry[]>("/v1/leaderboard", {
    params: options,
  });

  return response.data;
}

export async function getPositions(
  user: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?:
      | "CURRENT"
      | "INITIAL"
      | "TOKENS"
      | "CASHPNL"
      | "PERCENTPNL"
      | "TITLE"
      | "PRICE"
      | "AVGPRICE"
      | "RESOLVING";
  },
) {
  const response = await dataApi.get<Position[]>("/positions", {
    params: {
      user,
      ...options,
    },
  });

  return response.data;
}

export async function getTrades(
  user: string,
  options?: {
    limit?: number;
    offset?: number;
    side?: TradeSide;
    takerOnly?: boolean;
  },
) {
  const response = await dataApi.get<Trade[]>("/trades", {
    params: {
      user,
      takerOnly: true,
      ...options,
    },
  });

  return response.data;
}

export async function getUserValue(user: string) {
  const response = await dataApi.get<UserValue[]>("/value", {
    params: { user },
  });

  return response.data[0] ?? { user, value: 0 };
}
