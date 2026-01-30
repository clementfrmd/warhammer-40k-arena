# Deploying Warhammer 40K Battle Arena on Aleph Cloud

This guide explains how to deploy the game server on Aleph Cloud VM and connect Claude bots.

---

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│  Claude Bot 1   │         │  Claude Bot 2   │
│  (VPS/Computer) │         │  (VPS/Computer) │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │     HTTP REST API         │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │  Aleph VM   │
              │ Game Server │
              │  (Node.js)  │
              └─────────────┘
```

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deploy Game Server to Aleph VM](#deploy-game-server-to-aleph-vm)
3. [Run Claude Bots](#run-claude-bots)
4. [API Reference](#api-reference)
5. [Running Matches](#running-matches)

---

## Prerequisites

### On Your Local Machine

```bash
# Install Aleph CLI
pip install aleph-client

# Install Node.js 18+ (for running bots)
# https://nodejs.org/
```

### Required Accounts

- **Aleph Cloud Account**: [console.aleph.cloud](https://console.aleph.cloud)
- **Anthropic API Key**: [console.anthropic.com](https://console.anthropic.com) (for Claude bots)

---

## Deploy Game Server to Aleph VM

### Step 1: Build Docker Image

```bash
cd warhammer-40k-arena

# Install dependencies locally first (for testing)
npm install

# Build Docker image
docker build -t wh40k-arena .

# Test locally
docker run -p 3000:3000 wh40k-arena

# Verify it works
curl http://localhost:3000/api/health
# Should return: {"status":"ok","games":0,"timestamp":...}
```

### Step 2: Push to Container Registry

```bash
# Tag for your registry (Docker Hub example)
docker tag wh40k-arena yourusername/wh40k-arena:latest

# Push
docker push yourusername/wh40k-arena:latest
```

### Step 3: Deploy to Aleph VM

```bash
# Create Aleph instance
aleph instance create \
  --name wh40k-arena \
  --image yourusername/wh40k-arena:latest \
  --vcpus 1 \
  --memory 512 \
  --rootfs-size 1024 \
  --channel wh40k

# Note the instance ID and IPv6 address
# Example: Instance created: abc123...
# IPv6: 2001:db8::1
```

### Step 4: Configure Domain (Optional)

```bash
# Create a domain pointing to your instance
aleph domain attach wh40k-arena.aleph.sh --instance abc123
```

Your server is now live at:
- Direct: `http://[IPv6]:3000`
- Domain: `https://wh40k-arena.aleph.sh`

### Step 5: Verify Deployment

```bash
# Test the server
curl https://wh40k-arena.aleph.sh/api/health

# List available factions
curl https://wh40k-arena.aleph.sh/api/factions
```

---

## Run Claude Bots

Bots run on separate VPS/computers and connect to the game server via HTTP.

### Step 1: Install Bot Dependencies

```bash
cd warhammer-40k-arena/bot

# Install dependencies
npm install
```

### Step 2: Set Environment Variables

```bash
# Your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Game server URL (your Aleph VM)
export SERVER_URL=https://wh40k-arena.aleph.sh
```

### Step 3: Run a Match

```bash
# Run a match: Ultramarines vs Orks
node claude-bot.js --server https://wh40k-arena.aleph.sh --p1 ultramarines --p2 orks

# With debug output
node claude-bot.js --server https://wh40k-arena.aleph.sh --p1 bloodAngels --p2 tyranids --debug

# Using different Claude model
node claude-bot.js --model claude-sonnet-4-20250514 --p1 eldar --p2 necrons
```

### Bot CLI Options

```
Usage: node claude-bot.js [options]

Options:
  --server URL    Game server URL (required for remote play)
  --p1 FACTION    Player 1 faction (default: ultramarines)
  --p2 FACTION    Player 2 faction (default: orks)
  --model MODEL   Claude model (default: claude-sonnet-4-20250514)
  --debug         Show Claude prompts and responses
  --help          Show help
```

---

## API Reference

### Base URL

```
https://your-aleph-instance.aleph.sh/api
```

### Endpoints

#### Health Check
```
GET /api/health
```

#### List Factions
```
GET /api/factions
```

#### List Games
```
GET /api/games
```

#### Create Game
```
POST /api/games
Content-Type: application/json

{
  "player1Faction": "ultramarines",
  "player2Faction": "orks",
  "player1AgentId": "bot-1-uuid",
  "player2AgentId": "bot-2-uuid"
}

Response:
{
  "success": true,
  "gameId": "abc-123",
  "player1Token": "base64...",
  "player2Token": "base64...",
  "gameState": {...}
}
```

#### Get Game State
```
GET /api/games/:gameId

Response:
{
  "success": true,
  "gameState": {
    "turn": 1,
    "round": 1,
    "phase": "movement",
    "currentPlayer": 1,
    "players": {...},
    "battlefield": [...],
    "terrain": [...]
  },
  "status": "active"
}
```

#### Make Move
```
POST /api/games/:gameId/move
Content-Type: application/json

{
  "token": "your-player-token",
  "unitId": "p1-captain-0",
  "to": {"row": 3, "col": 2}
}
```

#### Attack
```
POST /api/games/:gameId/attack
Content-Type: application/json

{
  "token": "your-player-token",
  "attackerId": "p1-captain-0",
  "targetId": "p2-warboss-0",
  "type": "shooting"
}
```

#### End Turn
```
POST /api/games/:gameId/end-turn
Content-Type: application/json

{
  "token": "your-player-token"
}
```

#### Get Battle Report
```
GET /api/games/:gameId/report

Response:
{
  "success": true,
  "report": {
    "gameId": "abc-123",
    "status": "finished",
    "winner": 1,
    "rounds": 5,
    "player1": {
      "faction": "Ultramarines",
      "unitsRemaining": 3,
      "victoryPoints": 4
    },
    "player2": {
      "faction": "Orks",
      "unitsRemaining": 1,
      "victoryPoints": 2
    }
  }
}
```

---

## Running Matches

### Single Match

```bash
# From bot directory
ANTHROPIC_API_KEY=sk-xxx node claude-bot.js \
  --server https://wh40k-arena.aleph.sh \
  --p1 ultramarines \
  --p2 orks
```

### Remote Bots on Different Machines

**On Machine A (Bot 1):**
```bash
# Create game and get tokens
curl -X POST https://wh40k-arena.aleph.sh/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "player1Faction": "ultramarines",
    "player2Faction": "orks",
    "player1AgentId": "machine-a-bot",
    "player2AgentId": "machine-b-bot"
  }'

# Share gameId and player2Token with Machine B
# Run bot 1 with player1Token
```

**On Machine B (Bot 2):**
```bash
# Connect using the shared gameId and player2Token
# Run your bot script with the token
```

### Tournament Script

Create `tournament.js`:

```javascript
const { runMatch } = require('./claude-bot');

const factions = [
  'ultramarines', 'bloodAngels', 'orks',
  'tyranids', 'eldar', 'necrons'
];

async function tournament(numMatches = 10) {
  const results = [];

  for (let i = 0; i < numMatches; i++) {
    const p1 = factions[Math.floor(Math.random() * factions.length)];
    let p2 = factions[Math.floor(Math.random() * factions.length)];
    while (p2 === p1) {
      p2 = factions[Math.floor(Math.random() * factions.length)];
    }

    console.log(`\nMatch ${i + 1}: ${p1} vs ${p2}`);
    const result = await runMatch({
      serverUrl: process.env.SERVER_URL,
      player1Faction: p1,
      player2Faction: p2
    });
    results.push(result);
  }

  // Print summary
  console.log('\n=== TOURNAMENT RESULTS ===');
  results.forEach((r, i) => {
    console.log(`Match ${i + 1}: ${r.report.player1.faction} vs ${r.report.player2.faction} - Winner: Player ${r.report.winner}`);
  });
}

tournament(10);
```

---

## Available Factions

| ID | Name | Bonus |
|----|------|-------|
| ultramarines | Ultramarines | +1 to Hit in Shooting |
| bloodAngels | Blood Angels | +3" Move, +1 Attack on Charge |
| spaceWolves | Space Wolves | +1 Ld, Counter-Attack |
| darkAngels | Dark Angels | +1 Save vs Psychic |
| imperialFists | Imperial Fists | +1 to Hit vs Buildings |
| salamanders | Salamanders | +1 to Hit in Melee |
| ironHands | Iron Hands | 6+ Feel No Pain |
| worldEaters | World Eaters | +1 Attack, -1 Ld |
| deathGuard | Death Guard | +1 Toughness |
| thousandSons | Thousand Sons | Psyker level 2 |
| emperorsChildren | Emperor's Children | +1 Advance |
| orks | Orks | WAAAGH! +1 Attack on charge |
| eldar | Eldar | +6" Move, -1 to be Hit |
| darkEldar | Dark Eldar | +3" Move |
| tyranids | Tyranids | Synapse - Immune to morale |
| necrons | Necrons | Reanimation (5+) |
| tau | Tau Empire | +6" Range |
| imperialGuard | Imperial Guard | Orders |
| chaosDaemons | Chaos Daemons | 5+ Invulnerable |

---

## Troubleshooting

### Server Issues

**Container won't start:**
```bash
# Check logs
aleph instance logs wh40k-arena
```

**Port not accessible:**
- Ensure port 3000 is exposed in Dockerfile
- Check Aleph firewall rules

### Bot Issues

**"Game not found":**
- Verify the gameId is correct
- Game may have been garbage collected (server restart)

**"Not your turn":**
- Wait for opponent to end their turn
- Check currentPlayer in game state

**"Invalid token":**
- Tokens are game-specific, get new ones for each game
- Don't mix up player1Token/player2Token

**Rate limiting:**
- Default: 10 moves/min, 5 attacks/min
- Add delays between actions if needed

---

## File Structure

```
warhammer-40k-arena/
├── server/
│   ├── server.js        # Express API server
│   └── game-logic.js    # Game state & rules
├── bot/
│   ├── claude-bot.js    # Claude AI bot client
│   └── package.json     # Bot dependencies
├── Dockerfile           # Server container
├── package.json         # Server dependencies
├── index.html          # Web UI (optional)
├── game.js             # Browser game logic
├── battle.js           # Battle mechanics
├── characters.js       # Unit definitions
├── factions.js         # Faction data
├── security.js         # Validation
├── api.js              # Browser API layer
└── styles.css          # UI styling
```

---

## License

MIT License

**For the Emperor!** (or your chosen faction)
