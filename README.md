## Overview

This is a TypeScript project for exploring Polymarket's public APIs.

## Features

- Pull the public trader leaderboard from Polymarket's Data API
- Rank traders by a simple PnL-to-volume efficiency score
- Show each candidate trader's top open positions
- Show each candidate trader's most recent buy trades

## Tech Stack

- **TypeScript**
- **Node.js**
- **pnpm**
- **Axios**

## Getting Started

### Install dependencies

```bash
pnpm install
```

### Run the tracker

```bash
npx tsx src/index.ts
```

### Optional environment variables

```bash
LEADERBOARD_LIMIT=10
POSITIONS_LIMIT=5
RECENT_TRADES_LIMIT=8
MIN_PNL=250
CATEGORY=OVERALL
TIME_PERIOD=MONTH
```

The current output is a console report for research. It does not place trades or auto-copy positions.
