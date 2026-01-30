# Deploying Warhammer 40K Battle Arena on Aleph Cloud

This guide explains how to deploy the game on Aleph Cloud and set up Claude AI bots to play.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deploying to Aleph Cloud](#deploying-to-aleph-cloud)
3. [Claude Bot Integration](#claude-bot-integration)
4. [API Reference for Bots](#api-reference-for-bots)
5. [Running Bot Matches](#running-bot-matches)

---

## Prerequisites

### What You Need

- **Aleph Cloud Account**: Sign up at [aleph.cloud](https://aleph.cloud)
- **Aleph CLI**: Install the Aleph command-line tool
- **Node.js 18+**: For running bot scripts locally (optional)
- **Anthropic API Key**: For Claude bot integration

### Install Aleph CLI

```bash
# Using pip
pip install aleph-client

# Or using pipx (recommended)
pipx install aleph-client
```

---

## Deploying to Aleph Cloud

### Option 1: Static Website Deployment (Recommended)

The game is a pure HTML/CSS/JS application, perfect for static hosting.

#### Step 1: Prepare Your Files

Ensure all files are in a single directory:

```
warhammer-40k-arena/
├── index.html
├── styles.css
├── game.js
├── battle.js
├── characters.js
├── factions.js
├── security.js
└── api.js
```

#### Step 2: Deploy to Aleph IPFS

```bash
# Navigate to your project directory
cd warhammer-40k-arena

# Upload to Aleph's decentralized storage
aleph file upload . --channel wh40k-arena

# You'll receive an IPFS hash like:
# QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Step 3: Pin and Create Domain

```bash
# Pin the content for persistence
aleph file pin QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Create a custom domain (optional)
aleph domain create wh40k-arena.aleph.sh --target QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Your game will be accessible at:
- IPFS: `https://ipfs.aleph.cloud/ipfs/QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Custom: `https://wh40k-arena.aleph.sh`

### Option 2: Compute Instance (For Backend API)

If you need a backend server for multiplayer:

#### Step 1: Create a Dockerfile

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

#### Step 2: Deploy Compute Instance

```bash
# Create compute instance
aleph instance create \
  --name wh40k-arena \
  --image nginx:alpine \
  --cpu 1 \
  --memory 512 \
  --disk 1024

# Deploy your code
aleph instance deploy wh40k-arena ./
```

---

## Claude Bot Integration

The game includes a full API layer (`api.js`) designed for AI agents to play.

### How Bots Play

1. **Initialize Game**: Create a new game with two agent IDs
2. **Get State**: Fetch current battlefield and unit positions
3. **Make Moves**: Send move/attack commands via API
4. **End Turn**: Signal turn completion

### Setting Up a Claude Bot

#### Step 1: Create Bot Script

Create `claude-bot.js`:

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Game state context for Claude
const SYSTEM_PROMPT = `You are playing Warhammer 40K Battle Arena.
You control Player {PLAYER_NUM} with faction {FACTION}.

GAME RULES:
- Each turn: Movement -> Shooting -> Combat -> Morale
- Units can move once and attack once per turn
- Shooting range: 6 cells, Melee range: 2 cells
- Combat: Roll to hit (3+), wound (4+), save (4+)
- Victory: Destroy enemy HQ or have most VP after 5 rounds

AVAILABLE ACTIONS:
1. move(unitId, toRow, toCol) - Move a unit
2. attack(attackerId, targetId, type) - Attack enemy (type: 'shooting' or 'melee')
3. endTurn() - End your turn

Respond with JSON: {"action": "move|attack|endTurn", "params": {...}}`;

class ClaudeBot {
  constructor(playerId, agentId, gameId) {
    this.playerId = playerId;
    this.agentId = agentId;
    this.gameId = gameId;
  }

  async getMove(gameState) {
    const prompt = this.formatGameState(gameState);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT.replace('{PLAYER_NUM}', this.playerId)
                          .replace('{FACTION}', gameState.players[this.playerId].faction),
      messages: [{ role: 'user', content: prompt }]
    });

    return JSON.parse(response.content[0].text);
  }

  formatGameState(state) {
    return `
Current Turn: ${state.turn}, Round: ${state.round}, Phase: ${state.phase}
You are Player ${this.playerId} (${state.currentPlayer === this.playerId ? 'YOUR TURN' : 'waiting'})

Your Units:
${state.players[this.playerId].units.map(u =>
  `- ${u.name} (${u.type}) at (${u.position?.row}, ${u.position?.col}) - ${u.currentWounds}/${u.wounds} wounds`
).join('\n')}

Enemy Units:
${state.players[this.playerId === 1 ? 2 : 1].units.map(u =>
  `- ${u.name} (${u.type}) at (${u.position?.row}, ${u.position?.col}) - ${u.currentWounds}/${u.wounds} wounds`
).join('\n')}

Victory Points: You ${state.players[this.playerId].vp} - Enemy ${state.players[this.playerId === 1 ? 2 : 1].vp}

What is your action?`;
  }
}

export default ClaudeBot;
```

#### Step 2: Create Game Runner

Create `run-match.js`:

```javascript
import ClaudeBot from './claude-bot.js';

// Simulated API (in browser, use the actual API object)
class GameAPI {
  constructor() {
    this.state = null;
  }

  async initGame(config) {
    // Call the actual API.initGame()
    const result = await API.initGame(config);
    this.state = result.gameState;
    return result;
  }

  async makeMove(gameId, agentId, moveData) {
    return await API.makeMove(gameId, agentId, moveData);
  }

  async attackUnit(gameId, agentId, attackData) {
    return await API.attackUnit(gameId, agentId, attackData);
  }

  async endTurn(gameId, agentId) {
    return await API.endTurn(gameId, agentId);
  }
}

async function runMatch() {
  const api = new GameAPI();

  // Initialize game
  const game = await api.initGame({
    player1Faction: 'ultramarines',
    player2Faction: 'orks',
    player1AgentId: 'claude-bot-1',
    player2AgentId: 'claude-bot-2'
  });

  const bot1 = new ClaudeBot(1, 'claude-bot-1', game.gameId);
  const bot2 = new ClaudeBot(2, 'claude-bot-2', game.gameId);

  // Game loop
  while (game.gameState.round <= game.gameState.maxRounds) {
    const currentBot = game.gameState.currentPlayer === 1 ? bot1 : bot2;

    // Get bot's decision
    const decision = await currentBot.getMove(game.gameState);

    // Execute action
    switch (decision.action) {
      case 'move':
        await api.makeMove(game.gameId, currentBot.agentId, decision.params);
        break;
      case 'attack':
        await api.attackUnit(game.gameId, currentBot.agentId, decision.params);
        break;
      case 'endTurn':
        await api.endTurn(game.gameId, currentBot.agentId);
        break;
    }

    // Check for victory
    if (checkVictory(game.gameState)) break;
  }

  console.log('Match complete!', Battle.generateBattleReport());
}

runMatch();
```

---

## API Reference for Bots

### Initialize Game

```javascript
const result = await API.initGame({
  player1Faction: 'ultramarines',  // See factions.js for options
  player2Faction: 'orks',
  player1AgentId: 'agent-uuid-1',
  player2AgentId: 'agent-uuid-2'
});
// Returns: { success: true, gameId: 'xxx', gameState: {...} }
```

### Get Game State

```javascript
const result = await API.getGameState(gameId);
// Returns: { success: true, gameState: {...} }
```

### Make a Move

```javascript
const result = await API.makeMove(gameId, agentId, {
  unitId: 'p1-captain-0',
  from: { row: 2, col: 0 },
  to: { row: 3, col: 2 }
});
// Returns: { success: true, gameState: {...}, moveRecorded: {...} }
```

### Attack a Unit

```javascript
const result = await API.attackUnit(gameId, agentId, {
  attackerId: 'p1-captain-0',
  targetId: 'p2-warboss-0',
  type: 'shooting'  // or 'melee'
});
// Returns: { success: true, gameState: {...}, combatResult: {...}, unitDestroyed: false }
```

### End Turn

```javascript
const result = await API.endTurn(gameId, agentId);
// Returns: { success: true, gameState: {...} }
```

### Get Battle Report

```javascript
const result = await API.generateBattleReport(gameId);
// Returns: { success: true, report: {...} }
```

---

## Running Bot Matches

### Local Browser Testing

1. Open `index.html` in a browser
2. Open Developer Console (F12)
3. Run bot commands directly:

```javascript
// Initialize a bot game
const game = await API.initGame({
  player1Faction: 'bloodAngels',
  player2Faction: 'tyranids',
  player1AgentId: 'bot1',
  player2AgentId: 'bot2'
});

// Make moves programmatically
await API.makeMove(game.gameId, 'bot1', {
  unitId: game.gameState.players[1].units[0].id,
  from: game.gameState.players[1].units[0].position,
  to: { row: 3, col: 1 }
});
```

### Headless Bot Matches (Node.js)

For running matches without a browser:

1. Extract game logic to a Node.js module
2. Use jsdom for DOM simulation (if needed)
3. Run matches via CLI or as a service

```bash
# Install dependencies
npm install @anthropic-ai/sdk

# Set API key
export ANTHROPIC_API_KEY=your-key-here

# Run match
node run-match.js
```

### Tournament Mode

For running multiple bot matches:

```javascript
async function runTournament(factions, numMatches) {
  const results = [];

  for (let i = 0; i < numMatches; i++) {
    const f1 = factions[Math.floor(Math.random() * factions.length)];
    const f2 = factions[Math.floor(Math.random() * factions.length)];

    const result = await runMatch(f1, f2);
    results.push(result);
  }

  return results;
}

// Run 10 matches with random factions
const allFactions = Object.keys(Factions);
runTournament(allFactions, 10);
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

### Common Issues

**Q: API returns "Game not found"**
A: Ensure you're using the correct gameId from initGame()

**Q: "Not your turn" error**
A: Check that your agentId matches the current player's agentId

**Q: Rate limit exceeded**
A: Wait 60 seconds between rapid commands (10 moves/min, 5 attacks/min)

**Q: State integrity failed**
A: Don't modify game state directly; use API methods only

### Support

- GitHub Issues: Report bugs and feature requests
- Aleph Discord: Community support for hosting questions

---

## License

MIT License - See LICENSE file for details.

For the Emperor! (or your chosen faction)
