#!/usr/bin/env node
// Warhammer 40K Battle Arena - Claude Bot Client
// Connects to game server and plays using Claude AI

const Anthropic = require('@anthropic-ai/sdk').default;

class ClaudeBot {
    constructor(config) {
        this.serverUrl = config.serverUrl || 'http://localhost:3000';
        this.playerId = config.playerId;
        this.agentId = config.agentId;
        this.token = config.token;
        this.gameId = config.gameId;
        this.model = config.model || 'claude-sonnet-4-20250514';
        this.debug = config.debug || false;

        this.anthropic = new Anthropic({
            apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY
        });

        this.systemPrompt = this.buildSystemPrompt();
    }

    buildSystemPrompt() {
        return `You are an expert Warhammer 40K Battle Arena player. You control Player ${this.playerId}.

GAME RULES:
- Turn-based strategy on a 10x10 grid
- Phases: Movement -> Shooting -> Combat -> Morale (then next player)
- Units can move once and attack once per turn
- Shooting range: 6 cells, Melee range: 2 cells
- Combat: Roll to hit (3+), wound (4+), save (4+), then damage (1d6)
- Victory: Destroy enemy HQ OR have most Victory Points after 5 rounds
- VP: 1 per unit destroyed, 2 per HQ destroyed

STRATEGY TIPS:
- Protect your HQ unit at all costs
- Focus fire on damaged enemies to destroy them
- Use terrain for cover (adjacent terrain gives save bonus)
- Close distance for melee if your units are melee-focused
- Prioritize shooting in shooting phase, melee in combat phase

YOUR TASK:
Analyze the game state and decide the best action. You must respond with ONLY valid JSON.

RESPONSE FORMAT:
{
  "reasoning": "Brief explanation of your strategy",
  "action": "move" | "attack" | "endTurn",
  "params": {
    // For move: {"unitId": "xxx", "to": {"row": N, "col": N}}
    // For attack: {"attackerId": "xxx", "targetId": "xxx", "type": "shooting" | "melee"}
    // For endTurn: {} (empty object)
  }
}

IMPORTANT:
- Only move/attack with units that haven't acted yet this turn
- Check the phase: only shoot in "shooting", only melee in "combat"
- If no good actions available, use endTurn
- Distances use Euclidean formula: sqrt((r2-r1)^2 + (c2-c1)^2)`;
    }

    async getGameState() {
        const response = await fetch(`${this.serverUrl}/api/games/${this.gameId}/player/${this.playerId}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to get game state');
        }

        return data;
    }

    formatGameStateForClaude(state) {
        const myUnits = state.players[this.playerId].units;
        const enemyId = this.playerId === 1 ? 2 : 1;
        const enemyUnits = state.players[enemyId].units;

        let prompt = `
=== CURRENT GAME STATE ===
Turn: ${state.turn} | Round: ${state.round} | Phase: ${state.phase}
Your VP: ${state.players[this.playerId].vp} | Enemy VP: ${state.players[enemyId].vp}

YOUR UNITS (Player ${this.playerId}):
${myUnits.map(u => {
    const canMove = !u.hasMoved ? '✓ can move' : '✗ moved';
    const canAttack = !u.hasAttacked ? '✓ can attack' : '✗ attacked';
    return `  - ${u.name} [${u.id}] (${u.type})
    Position: (${u.position?.row}, ${u.position?.col})
    Wounds: ${u.currentWounds}/${u.wounds}
    Move: ${u.move / 2} cells | ${canMove} | ${canAttack}`;
}).join('\n')}

ENEMY UNITS (Player ${enemyId}):
${enemyUnits.map(u => {
    return `  - ${u.name} [${u.id}] (${u.type})
    Position: (${u.position?.row}, ${u.position?.col})
    Wounds: ${u.currentWounds}/${u.wounds}`;
}).join('\n')}

TERRAIN (blocks movement, provides cover):
${state.terrain.map(t => `  (${t.row}, ${t.col})`).join(', ')}

What is your action?`;

        return prompt;
    }

    async decideAction(gameState) {
        const prompt = this.formatGameStateForClaude(gameState.gameState);

        if (this.debug) {
            console.log('\n--- SENDING TO CLAUDE ---');
            console.log(prompt);
            console.log('-------------------------\n');
        }

        const response = await this.anthropic.messages.create({
            model: this.model,
            max_tokens: 1024,
            system: this.systemPrompt,
            messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content[0].text;

        if (this.debug) {
            console.log('\n--- CLAUDE RESPONSE ---');
            console.log(text);
            console.log('-----------------------\n');
        }

        // Parse JSON response
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error('Failed to parse Claude response:', e.message);
            console.error('Raw response:', text);
            // Default to ending turn if we can't parse
            return { action: 'endTurn', params: {}, reasoning: 'Failed to parse response' };
        }
    }

    async executeAction(decision) {
        const { action, params } = decision;

        let endpoint, body;

        switch (action) {
            case 'move':
                endpoint = `/api/games/${this.gameId}/move`;
                body = {
                    token: this.token,
                    unitId: params.unitId,
                    to: params.to
                };
                break;

            case 'attack':
                endpoint = `/api/games/${this.gameId}/attack`;
                body = {
                    token: this.token,
                    attackerId: params.attackerId,
                    targetId: params.targetId,
                    type: params.type
                };
                break;

            case 'endTurn':
                endpoint = `/api/games/${this.gameId}/end-turn`;
                body = { token: this.token };
                break;

            default:
                console.error('Unknown action:', action);
                return null;
        }

        const response = await fetch(`${this.serverUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        return await response.json();
    }

    async playTurn() {
        try {
            // Get current game state
            const gameState = await this.getGameState();

            if (!gameState.isYourTurn) {
                return { skipped: true, reason: 'Not my turn' };
            }

            // Ask Claude what to do
            const decision = await this.decideAction(gameState);

            console.log(`[Bot ${this.playerId}] ${decision.reasoning}`);
            console.log(`[Bot ${this.playerId}] Action: ${decision.action}`, decision.params);

            // Execute the action
            const result = await this.executeAction(decision);

            if (!result.success) {
                console.error(`[Bot ${this.playerId}] Action failed:`, result.error);
            }

            return { decision, result };

        } catch (error) {
            console.error(`[Bot ${this.playerId}] Error:`, error.message);
            return { error: error.message };
        }
    }
}

// ============================================
// MATCH RUNNER
// ============================================

async function runMatch(config) {
    const serverUrl = config.serverUrl || 'http://localhost:3000';

    console.log('='.repeat(50));
    console.log('WARHAMMER 40K BATTLE ARENA - BOT MATCH');
    console.log('='.repeat(50));

    // Create a new game
    console.log('\nCreating game...');
    const createResponse = await fetch(`${serverUrl}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            player1Faction: config.player1Faction || 'ultramarines',
            player2Faction: config.player2Faction || 'orks',
            player1AgentId: config.player1AgentId || 'claude-bot-1',
            player2AgentId: config.player2AgentId || 'claude-bot-2'
        })
    });

    const gameData = await createResponse.json();

    if (!gameData.success) {
        console.error('Failed to create game:', gameData.error);
        return;
    }

    console.log(`Game created: ${gameData.gameId}`);
    console.log(`Player 1: ${config.player1Faction || 'ultramarines'}`);
    console.log(`Player 2: ${config.player2Faction || 'orks'}`);

    // Create bots
    const bot1 = new ClaudeBot({
        serverUrl,
        playerId: 1,
        agentId: config.player1AgentId || 'claude-bot-1',
        token: gameData.player1Token,
        gameId: gameData.gameId,
        model: config.model,
        debug: config.debug
    });

    const bot2 = new ClaudeBot({
        serverUrl,
        playerId: 2,
        agentId: config.player2AgentId || 'claude-bot-2',
        token: gameData.player2Token,
        gameId: gameData.gameId,
        model: config.model,
        debug: config.debug
    });

    // Game loop
    let gameStatus = 'active';
    let turnCount = 0;
    const maxTurns = 200; // Safety limit

    console.log('\n--- BATTLE BEGINS ---\n');

    while (gameStatus === 'active' && turnCount < maxTurns) {
        // Get current state to check whose turn
        const stateResponse = await fetch(`${serverUrl}/api/games/${gameData.gameId}`);
        const state = await stateResponse.json();

        if (state.status !== 'active') {
            gameStatus = state.status;
            break;
        }

        const currentBot = state.gameState.currentPlayer === 1 ? bot1 : bot2;

        console.log(`\n[Turn ${state.gameState.turn}] Player ${state.gameState.currentPlayer}'s turn (${state.gameState.phase} phase)`);

        const result = await currentBot.playTurn();

        if (result.result?.gameStatus === 'finished') {
            gameStatus = 'finished';
        }

        turnCount++;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Get final report
    console.log('\n--- BATTLE ENDS ---\n');

    const reportResponse = await fetch(`${serverUrl}/api/games/${gameData.gameId}/report`);
    const report = await reportResponse.json();

    console.log('='.repeat(50));
    console.log('FINAL REPORT');
    console.log('='.repeat(50));
    console.log(`Status: ${report.report.status}`);
    console.log(`Winner: Player ${report.report.winner || 'Draw'}`);
    console.log(`Rounds: ${report.report.rounds}`);
    console.log(`Total Moves: ${report.report.moveCount}`);
    console.log(`Total Combats: ${report.report.combatCount}`);
    console.log(`\nPlayer 1 (${report.report.player1.faction}):`);
    console.log(`  Units Remaining: ${report.report.player1.unitsRemaining}`);
    console.log(`  Victory Points: ${report.report.player1.victoryPoints}`);
    console.log(`\nPlayer 2 (${report.report.player2.faction}):`);
    console.log(`  Units Remaining: ${report.report.player2.unitsRemaining}`);
    console.log(`  Victory Points: ${report.report.player2.victoryPoints}`);
    console.log('='.repeat(50));

    return report;
}

// ============================================
// CLI INTERFACE
// ============================================

async function main() {
    const args = process.argv.slice(2);

    // Parse command line arguments
    const config = {
        serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
        player1Faction: 'ultramarines',
        player2Faction: 'orks',
        model: 'claude-sonnet-4-20250514',
        debug: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--server':
                config.serverUrl = args[++i];
                break;
            case '--p1':
                config.player1Faction = args[++i];
                break;
            case '--p2':
                config.player2Faction = args[++i];
                break;
            case '--model':
                config.model = args[++i];
                break;
            case '--debug':
                config.debug = true;
                break;
            case '--help':
                console.log(`
Warhammer 40K Battle Arena - Claude Bot

Usage: node claude-bot.js [options]

Options:
  --server URL    Game server URL (default: http://localhost:3000)
  --p1 FACTION    Player 1 faction (default: ultramarines)
  --p2 FACTION    Player 2 faction (default: orks)
  --model MODEL   Claude model to use (default: claude-sonnet-4-20250514)
  --debug         Enable debug output
  --help          Show this help

Available factions:
  ultramarines, bloodAngels, spaceWolves, darkAngels, imperialFists,
  salamanders, ironHands, worldEaters, deathGuard, thousandSons,
  emperorsChildren, orks, eldar, darkEldar, tyranids, necrons,
  tau, imperialGuard, chaosDaemons

Environment variables:
  ANTHROPIC_API_KEY  Your Anthropic API key (required)
  SERVER_URL         Default server URL

Example:
  ANTHROPIC_API_KEY=sk-... node claude-bot.js --p1 bloodAngels --p2 tyranids
                `);
                process.exit(0);
        }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('Error: ANTHROPIC_API_KEY environment variable is required');
        process.exit(1);
    }

    await runMatch(config);
}

// Export for use as module
module.exports = { ClaudeBot, runMatch };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
