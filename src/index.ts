import "dotenv/config";

import {
  type LeaderboardCategory,
  type LeaderboardEntry,
  type LeaderboardTimePeriod,
  type Position,
  type Trade,
  getLeaderboard,
  getPositions,
  getTrades,
  getUserValue,
} from "./api/polymarket.js";

const LEADERBOARD_LIMIT = Number(process.env.LEADERBOARD_LIMIT ?? 10);
const POSITIONS_LIMIT = Number(process.env.POSITIONS_LIMIT ?? 5);
const RECENT_TRADES_LIMIT = Number(process.env.RECENT_TRADES_LIMIT ?? 8);
const MIN_PNL = Number(process.env.MIN_PNL ?? 250);
const CATEGORY = (process.env.CATEGORY ?? "OVERALL") as LeaderboardCategory;
const TIME_PERIOD = (process.env.TIME_PERIOD ?? "MONTH") as LeaderboardTimePeriod;

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatDate(timestamp: number) {
  const milliseconds = timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;

  return new Date(milliseconds).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getEfficiencyScore(trader: LeaderboardEntry) {
  if (trader.vol === 0) {
    return 0;
  }

  return (trader.pnl / trader.vol) * 100;
}

function summarizePosition(position: Position) {
  return [
    position.title,
    `[${position.outcome}]`,
    `size=${position.size.toFixed(2)}`,
    `avg=${formatUsd(position.avgPrice)}`,
    `cur=${formatUsd(position.curPrice)}`,
    `openPnL=${formatPercent(position.percentPnl)}`,
  ].join(" | ");
}

function summarizeTrade(trade: Trade) {
  return [
    formatDate(trade.timestamp),
    trade.side,
    trade.title,
    `[${trade.outcome}]`,
    `price=${formatUsd(trade.price)}`,
    `size=${trade.size.toFixed(2)}`,
  ].join(" | ");
}

async function buildTraderReport(trader: LeaderboardEntry) {
  const [positionsResult, tradesResult, valueResult] = await Promise.allSettled([
    getPositions(trader.proxyWallet, { limit: POSITIONS_LIMIT, sortBy: "CURRENT" }),
    getTrades(trader.proxyWallet, { limit: RECENT_TRADES_LIMIT, side: "BUY" }),
    getUserValue(trader.proxyWallet),
  ]);

  const positions =
    positionsResult.status === "fulfilled"
      ? [...positionsResult.value].sort((a, b) => b.currentValue - a.currentValue)
      : [];

  const trades =
    tradesResult.status === "fulfilled"
      ? [...tradesResult.value].sort((a, b) => b.timestamp - a.timestamp)
      : [];

  const portfolioValue =
    valueResult.status === "fulfilled" ? valueResult.value.value : 0;

  return {
    trader,
    positions,
    trades,
    portfolioValue,
    warnings: [
      positionsResult.status === "rejected" ? "positions unavailable" : null,
      tradesResult.status === "rejected" ? "recent trades unavailable" : null,
      valueResult.status === "rejected" ? "portfolio value unavailable" : null,
    ].filter((warning): warning is string => warning !== null),
  };
}

async function main() {
  const leaderboard = await getLeaderboard({
    category: CATEGORY,
    timePeriod: TIME_PERIOD,
    orderBy: "PNL",
    limit: LEADERBOARD_LIMIT,
  });

  const candidates = leaderboard
    .filter((trader) => trader.pnl >= MIN_PNL)
    .sort((a, b) => getEfficiencyScore(b) - getEfficiencyScore(a));

  if (candidates.length === 0) {
    console.log("No traders matched the current filters.");
    return;
  }

  console.log(
    `Tracking ${candidates.length} traders from ${CATEGORY} (${TIME_PERIOD}) leaderboard with minimum pnl ${formatUsd(MIN_PNL)}.`,
  );
  console.log(
    "This is a research feed, not an auto-copy engine. Public PnL can be stale, incomplete, or hedged elsewhere.",
  );
  console.log("");

  const reports = await Promise.all(candidates.map((trader) => buildTraderReport(trader)));

  for (const report of reports) {
    const traderName = report.trader.userName || report.trader.xUsername || "Anonymous";

    console.log(
      `#${report.trader.rank} ${traderName} (${report.trader.proxyWallet})`,
    );
    console.log(
      [
        `pnl=${formatUsd(report.trader.pnl)}`,
        `vol=${formatUsd(report.trader.vol)}`,
        `efficiency=${formatPercent(getEfficiencyScore(report.trader))}`,
        `portfolio=${formatUsd(report.portfolioValue)}`,
      ].join(" | "),
    );

    if (report.warnings.length > 0) {
      console.log(`warnings=${report.warnings.join(", ")}`);
    }

    if (report.positions.length > 0) {
      console.log("Top open positions:");
      for (const position of report.positions.slice(0, POSITIONS_LIMIT)) {
        console.log(`  - ${summarizePosition(position)}`);
      }
    } else {
      console.log("Top open positions: none returned");
    }

    if (report.trades.length > 0) {
      console.log("Recent buys:");
      for (const trade of report.trades.slice(0, RECENT_TRADES_LIMIT)) {
        console.log(`  - ${summarizeTrade(trade)}`);
      }
    } else {
      console.log("Recent buys: none returned");
    }

    console.log("");
  }
}

main().catch((error) => {
  console.error("Error running tracker:", error);
  process.exitCode = 1;
});
