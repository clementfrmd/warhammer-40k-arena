// Warhammer 40K Battle Arena - Game Server
// Express server for multiplayer bot matches

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (web UI)
app.use(express.static(path.join(__dirname, '../public')));

// Import game modules
const { GameConfig, createGameState, Factions, Characters } = require('./game-logic');

// ============================================
// IN-MEMORY STORAGE (replace with DB for production)
// ============================================
const games = new Map();
const openGames = new Map();  // Games waiting for player 2
const gameMessages = new Map(); // Chat/log messages per game

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateId() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateToken(agentId, gameId) {
    const payload = { agentId, gameId, timestamp: Date.now() };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function validateToken(token, gameId, expectedPlayer) {
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        const game = games.get(gameId);
        if (!game) return { valid: false, error: 'Game not found' };

        const playerAgentId = game.state.players[expectedPlayer]?.agentId;
        if (payload.agentId !== playerAgentId) {
            return { valid: false, error: 'Invalid agent for this player' };
        }
        return { valid: true, agentId: payload.agentId };
    } catch (e) {
        return { valid: false, error: 'Invalid token format' };
    }
}

function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

function getDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos2.row - pos1.row, 2) + Math.pow(pos2.col - pos1.col, 2));
}

function findUnit(state, unitId) {
    for (const playerId of [1, 2]) {
        const unit = state.players[playerId].units.find(u => u.id === unitId);
        if (unit) return { unit, playerId };
    }
    return { unit: null, playerId: null };
}

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', games: games.size, timestamp: Date.now() });
});

// List all factions
app.get('/api/factions', (req, res) => {
    res.json({
        success: true,
        factions: Object.entries(Factions).map(([id, data]) => ({ id, ...data }))
    });
});

// List active games
app.get('/api/games', (req, res) => {
    const gameList = [];
    games.forEach((game, gameId) => {
        gameList.push({
            gameId,
            turn: game.state.turn,
            round: game.state.round,
            phase: game.state.phase,
            currentPlayer: game.state.currentPlayer,
            player1Faction: game.state.players[1].faction,
            player2Faction: game.state.players[2]?.faction || 'waiting',
            player1Agent: game.state.players[1].agentId,
            player2Agent: game.state.players[2]?.agentId || null,
            status: game.status,
            createdAt: game.createdAt,
            isOpen: openGames.has(gameId)
        });
    });
    res.json({ success: true, games: gameList });
});

// ============================================
// LOBBY SYSTEM - Create open games, list, join
// ============================================

// List open games waiting for opponents
app.get('/api/lobby', (req, res) => {
    const openList = [];
    openGames.forEach((game, gameId) => {
        openList.push({
            gameId,
            player1Faction: game.state.players[1].faction,
            player1Agent: game.state.players[1].agentId,
            createdAt: game.createdAt,
            message: game.lobbyMessage || null
        });
    });
    res.json({ success: true, openGames: openList });
});

// Create an open game (waiting for opponent)
app.post('/api/lobby/create', (req, res) => {
    const { faction, agentId, message } = req.body;

    if (!Factions[faction]) {
        return res.status(400).json({ success: false, error: 'Invalid faction' });
    }

    if (!agentId) {
        return res.status(400).json({ success: false, error: 'agentId is required' });
    }

    const gameId = generateId();
    const player1Token = generateToken(agentId, gameId);

    // Create partial game state (waiting for player 2)
    const state = {
        gameId,
        turn: 0,
        round: 0,
        phase: 'waiting',
        currentPlayer: 1,
        maxRounds: GameConfig.MAX_ROUNDS,
        players: {
            1: {
                faction,
                agentId,
                units: [],
                vp: 0
            },
            2: null  // Will be filled when someone joins
        },
        battlefield: null,
        terrain: null,
        lastUpdate: Date.now()
    };

    const game = {
        state,
        status: 'waiting',
        createdAt: Date.now(),
        lobbyMessage: message || null,
        player1Token,
        moveHistory: [],
        combatHistory: []
    };

    games.set(gameId, game);
    openGames.set(gameId, game);
    gameMessages.set(gameId, []);

    // Add system message
    addGameMessage(gameId, 'system', `${agentId} created a game as ${Factions[faction].name}. Waiting for opponent...`);

    res.json({
        success: true,
        gameId,
        token: player1Token,
        message: 'Game created. Share the gameId with your opponent or wait for someone to join.'
    });
});

// Join an open game
app.post('/api/lobby/join/:gameId', (req, res) => {
    const { gameId } = req.params;
    const { faction, agentId } = req.body;

    if (!Factions[faction]) {
        return res.status(400).json({ success: false, error: 'Invalid faction' });
    }

    if (!agentId) {
        return res.status(400).json({ success: false, error: 'agentId is required' });
    }

    const game = openGames.get(gameId);
    if (!game) {
        return res.status(404).json({ success: false, error: 'Open game not found. It may have been filled or cancelled.' });
    }

    // Check faction isn't same as player 1
    if (game.state.players[1].faction === faction) {
        return res.status(400).json({ success: false, error: 'Cannot pick same faction as opponent' });
    }

    // Generate token for player 2
    const player2Token = generateToken(agentId, gameId);

    // Now create the full game state
    const fullState = createGameState(
        gameId,
        game.state.players[1].faction,
        faction,
        game.state.players[1].agentId,
        agentId
    );

    // Update game
    game.state = fullState;
    game.status = 'active';
    game.player2Token = player2Token;

    // Remove from open games
    openGames.delete(gameId);

    // Add message
    addGameMessage(gameId, 'system', `${agentId} joined as ${Factions[faction].name}. Battle begins!`);

    res.json({
        success: true,
        gameId,
        token: player2Token,
        gameState: fullState,
        message: `Joined game against ${game.state.players[1].agentId}. You are Player 2.`
    });
});

// Cancel an open game
app.delete('/api/lobby/:gameId', (req, res) => {
    const { gameId } = req.params;
    const { token } = req.body;

    const game = openGames.get(gameId);
    if (!game) {
        return res.status(404).json({ success: false, error: 'Open game not found' });
    }

    // Validate token belongs to creator
    if (token !== game.player1Token) {
        return res.status(403).json({ success: false, error: 'Only the creator can cancel this game' });
    }

    openGames.delete(gameId);
    games.delete(gameId);
    gameMessages.delete(gameId);

    res.json({ success: true, message: 'Game cancelled' });
});

// ============================================
// CHAT/MESSAGES SYSTEM
// ============================================

function addGameMessage(gameId, sender, text) {
    if (!gameMessages.has(gameId)) {
        gameMessages.set(gameId, []);
    }
    const message = {
        id: generateId(),
        sender,
        text,
        timestamp: Date.now()
    };
    gameMessages.get(gameId).push(message);

    // Keep only last 100 messages
    const msgs = gameMessages.get(gameId);
    if (msgs.length > 100) {
        gameMessages.set(gameId, msgs.slice(-100));
    }

    return message;
}

// Get messages for a game
app.get('/api/games/:gameId/messages', (req, res) => {
    const { gameId } = req.params;
    const { since } = req.query;  // Optional: get messages since timestamp

    if (!games.has(gameId)) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    let messages = gameMessages.get(gameId) || [];

    if (since) {
        const sinceTime = parseInt(since);
        messages = messages.filter(m => m.timestamp > sinceTime);
    }

    res.json({ success: true, messages });
});

// Send a message to a game
app.post('/api/games/:gameId/messages', (req, res) => {
    const { gameId } = req.params;
    const { token, text } = req.body;

    const game = games.get(gameId);
    if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Decode token to get sender
    let sender = 'anonymous';
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        sender = payload.agentId;
    } catch (e) {
        // Use anonymous
    }

    const message = addGameMessage(gameId, sender, text);
    res.json({ success: true, message });
});

// ============================================
// SPECTATOR MODE - Watch games
// ============================================

// Get game state for spectators (no token required, read-only)
app.get('/api/watch/:gameId', (req, res) => {
    const { gameId } = req.params;
    const game = games.get(gameId);

    if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Return sanitized state without tokens
    const spectatorState = {
        gameId,
        status: game.status,
        turn: game.state.turn,
        round: game.state.round,
        phase: game.state.phase,
        currentPlayer: game.state.currentPlayer,
        maxRounds: game.state.maxRounds,
        players: {
            1: {
                faction: game.state.players[1].faction,
                factionName: Factions[game.state.players[1].faction]?.name,
                agentId: game.state.players[1].agentId,
                units: game.state.players[1].units?.map(u => ({
                    id: u.id,
                    name: u.name,
                    type: u.type,
                    position: u.position,
                    currentWounds: u.currentWounds,
                    wounds: u.wounds,
                    hasMoved: u.hasMoved,
                    hasAttacked: u.hasAttacked
                })) || [],
                vp: game.state.players[1].vp
            },
            2: game.state.players[2] ? {
                faction: game.state.players[2].faction,
                factionName: Factions[game.state.players[2].faction]?.name,
                agentId: game.state.players[2].agentId,
                units: game.state.players[2].units?.map(u => ({
                    id: u.id,
                    name: u.name,
                    type: u.type,
                    position: u.position,
                    currentWounds: u.currentWounds,
                    wounds: u.wounds,
                    hasMoved: u.hasMoved,
                    hasAttacked: u.hasAttacked
                })) || [],
                vp: game.state.players[2].vp
            } : null
        },
        battlefield: game.state.battlefield,
        terrain: game.state.terrain,
        lastUpdate: game.state.lastUpdate,
        winner: game.winner || null,
        winReason: game.winReason || null
    };

    // Include recent history
    const recentMoves = game.moveHistory?.slice(-5) || [];
    const recentCombat = game.combatHistory?.slice(-5) || [];
    const recentMessages = (gameMessages.get(gameId) || []).slice(-10);

    res.json({
        success: true,
        game: spectatorState,
        recentMoves,
        recentCombat,
        recentMessages
    });
});

// Poll endpoint for real-time updates (lightweight)
app.get('/api/watch/:gameId/poll', (req, res) => {
    const { gameId } = req.params;
    const { since } = req.query;

    const game = games.get(gameId);
    if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const sinceTime = since ? parseInt(since) : 0;
    const hasUpdates = game.state.lastUpdate > sinceTime;

    if (!hasUpdates) {
        return res.json({
            success: true,
            hasUpdates: false,
            lastUpdate: game.state.lastUpdate
        });
    }

    // Return minimal update info
    res.json({
        success: true,
        hasUpdates: true,
        lastUpdate: game.state.lastUpdate,
        status: game.status,
        turn: game.state.turn,
        round: game.state.round,
        phase: game.state.phase,
        currentPlayer: game.state.currentPlayer,
        winner: game.winner || null
    });
});

// Create new game
app.post('/api/games', (req, res) => {
    const { player1Faction, player2Faction, player1AgentId, player2AgentId } = req.body;

    // Validate factions
    if (!Factions[player1Faction] || !Factions[player2Faction]) {
        return res.status(400).json({ success: false, error: 'Invalid faction' });
    }

    if (player1Faction === player2Faction) {
        return res.status(400).json({ success: false, error: 'Players must choose different factions' });
    }

    const gameId = generateId();
    const state = createGameState(gameId, player1Faction, player2Faction, player1AgentId, player2AgentId);

    // Generate tokens for both agents
    const player1Token = generateToken(player1AgentId, gameId);
    const player2Token = generateToken(player2AgentId, gameId);

    games.set(gameId, {
        state,
        status: 'active',
        createdAt: Date.now(),
        moveHistory: [],
        combatHistory: []
    });

    res.json({
        success: true,
        gameId,
        player1Token,
        player2Token,
        gameState: sanitizeStateForPlayer(state, 1) // Initial state visible to both
    });
});

// Get game state
app.get('/api/games/:gameId', (req, res) => {
    const { gameId } = req.params;
    const game = games.get(gameId);

    if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    res.json({
        success: true,
        gameState: game.state,
        status: game.status,
        moveHistory: game.moveHistory.slice(-10), // Last 10 moves
        combatHistory: game.combatHistory.slice(-10)
    });
});

// Get game state for specific player (with fog of war if implemented)
app.get('/api/games/:gameId/player/:playerId', (req, res) => {
    const { gameId, playerId } = req.params;
    const game = games.get(gameId);

    if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    res.json({
        success: true,
        gameState: sanitizeStateForPlayer(game.state, parseInt(playerId)),
        isYourTurn: game.state.currentPlayer === parseInt(playerId),
        status: game.status
    });
});

// Make a move
app.post('/api/games/:gameId/move', (req, res) => {
    const { gameId } = req.params;
    const { token, unitId, to } = req.body;

    const game = games.get(gameId);
    if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    if (game.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Game is not active' });
    }

    const state = game.state;

    // Validate token
    const tokenValidation = validateToken(token, gameId, state.currentPlayer);
    if (!tokenValidation.valid) {
        return res.status(403).json({ success: false, error: tokenValidation.error });
    }

    // Validate phase
    if (state.phase !== 'movement') {
        return res.status(400).json({ success: false, error: 'Not in movement phase' });
    }

    // Find unit
    const { unit, playerId } = findUnit(state, unitId);
    if (!unit) {
        return res.status(400).json({ success: false, error: 'Unit not found' });
    }

    if (playerId !== state.currentPlayer) {
        return res.status(400).json({ success: false, error: 'Not your unit' });
    }

    if (unit.hasMoved) {
        return res.status(400).json({ success: false, error: 'Unit has already moved this turn' });
    }

    // Validate move range
    const moveRange = unit.move / GameConfig.MOVE_SCALE;
    const distance = getDistance(unit.position, to);

    if (distance > moveRange) {
        return res.status(400).json({ success: false, error: `Move out of range (max: ${moveRange}, attempted: ${distance.toFixed(2)})` });
    }

    // Validate destination is empty and not terrain
    if (to.row < 0 || to.row >= GameConfig.GRID_SIZE || to.col < 0 || to.col >= GameConfig.GRID_SIZE) {
        return res.status(400).json({ success: false, error: 'Destination out of bounds' });
    }

    if (state.battlefield[to.row][to.col]) {
        return res.status(400).json({ success: false, error: 'Destination occupied' });
    }

    if (state.terrain.some(t => t.row === to.row && t.col === to.col)) {
        return res.status(400).json({ success: false, error: 'Destination is terrain' });
    }

    // Execute move
    const from = { ...unit.position };
    state.battlefield[from.row][from.col] = null;
    state.battlefield[to.row][to.col] = unit;
    unit.position = { row: to.row, col: to.col };
    unit.hasMoved = true;

    // Record move
    const moveRecord = {
        turn: state.turn,
        player: state.currentPlayer,
        unitId,
        unitName: unit.name,
        from,
        to,
        timestamp: Date.now()
    };
    game.moveHistory.push(moveRecord);
    state.lastUpdate = Date.now();

    res.json({
        success: true,
        move: moveRecord,
        gameState: state
    });
});

// Attack a unit
app.post('/api/games/:gameId/attack', (req, res) => {
    const { gameId } = req.params;
    const { token, attackerId, targetId, type } = req.body;

    const game = games.get(gameId);
    if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    if (game.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Game is not active' });
    }

    const state = game.state;

    // Validate token
    const tokenValidation = validateToken(token, gameId, state.currentPlayer);
    if (!tokenValidation.valid) {
        return res.status(403).json({ success: false, error: tokenValidation.error });
    }

    // Validate phase
    if (type === 'shooting' && state.phase !== 'shooting') {
        return res.status(400).json({ success: false, error: 'Not in shooting phase' });
    }
    if (type === 'melee' && state.phase !== 'combat') {
        return res.status(400).json({ success: false, error: 'Not in combat phase' });
    }

    // Find attacker
    const { unit: attacker, playerId: attackerOwner } = findUnit(state, attackerId);
    if (!attacker) {
        return res.status(400).json({ success: false, error: 'Attacker not found' });
    }

    if (attackerOwner !== state.currentPlayer) {
        return res.status(400).json({ success: false, error: 'Not your unit' });
    }

    if (attacker.hasAttacked) {
        return res.status(400).json({ success: false, error: 'Unit has already attacked this turn' });
    }

    // Find target
    const { unit: target, playerId: targetOwner } = findUnit(state, targetId);
    if (!target) {
        return res.status(400).json({ success: false, error: 'Target not found' });
    }

    if (targetOwner === state.currentPlayer) {
        return res.status(400).json({ success: false, error: 'Cannot attack own unit' });
    }

    // Validate range
    const range = type === 'shooting' ? GameConfig.SHOOTING_RANGE : GameConfig.MELEE_RANGE;
    const distance = getDistance(attacker.position, target.position);

    if (distance > range) {
        return res.status(400).json({ success: false, error: `Target out of range (max: ${range}, distance: ${distance.toFixed(2)})` });
    }

    // Execute combat
    const hitRoll = rollDice();
    const hitSuccess = hitRoll >= GameConfig.HIT_THRESHOLD;

    let woundRoll = null;
    let woundSuccess = false;
    let saveRoll = null;
    let saveSuccess = false;
    let damage = 0;
    let unitDestroyed = false;

    if (hitSuccess) {
        woundRoll = rollDice();
        woundSuccess = woundRoll >= GameConfig.WOUND_THRESHOLD;

        if (woundSuccess) {
            // Check cover bonus
            const coverBonus = getCoverBonus(target, state);
            const saveTarget = Math.max(GameConfig.MIN_SAVE_THRESHOLD, GameConfig.SAVE_THRESHOLD + coverBonus);

            saveRoll = rollDice();
            saveSuccess = saveRoll >= saveTarget;

            if (!saveSuccess) {
                damage = rollDice();
                target.currentWounds -= damage;

                if (target.currentWounds <= 0) {
                    unitDestroyed = true;
                    // Remove from battlefield
                    state.battlefield[target.position.row][target.position.col] = null;
                    // Remove from player's units
                    state.players[targetOwner].units = state.players[targetOwner].units.filter(u => u.id !== targetId);
                    // Award VP to attacker
                    const vp = target.type === 'HQ' ? GameConfig.VP_HQ_DESTROYED : GameConfig.VP_UNIT_DESTROYED;
                    state.players[state.currentPlayer].vp += vp;
                }
            }
        }
    }

    attacker.hasAttacked = true;

    // Record combat
    const combatRecord = {
        turn: state.turn,
        player: state.currentPlayer,
        type,
        attackerId,
        attackerName: attacker.name,
        targetId,
        targetName: target.name,
        hitRoll,
        hitSuccess,
        woundRoll,
        woundSuccess,
        saveRoll,
        saveSuccess,
        damage,
        unitDestroyed,
        timestamp: Date.now()
    };
    game.combatHistory.push(combatRecord);
    state.lastUpdate = Date.now();

    // Check victory condition
    checkVictoryCondition(game);

    res.json({
        success: true,
        combat: combatRecord,
        unitDestroyed,
        gameState: state,
        gameStatus: game.status
    });
});

// End turn
app.post('/api/games/:gameId/end-turn', (req, res) => {
    const { gameId } = req.params;
    const { token } = req.body;

    const game = games.get(gameId);
    if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    if (game.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Game is not active' });
    }

    const state = game.state;

    // Validate token
    const tokenValidation = validateToken(token, gameId, state.currentPlayer);
    if (!tokenValidation.valid) {
        return res.status(403).json({ success: false, error: tokenValidation.error });
    }

    // Switch player
    const previousPlayer = state.currentPlayer;
    state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;

    // Reset unit actions for new player
    state.players[state.currentPlayer].units.forEach(unit => {
        unit.hasMoved = false;
        unit.hasAttacked = false;
    });

    // Advance phase if back to player 1
    if (state.currentPlayer === 1) {
        advancePhase(state);
    }

    state.lastUpdate = Date.now();

    // Check victory condition
    checkVictoryCondition(game);

    res.json({
        success: true,
        previousPlayer,
        currentPlayer: state.currentPlayer,
        phase: state.phase,
        turn: state.turn,
        round: state.round,
        gameState: state,
        gameStatus: game.status
    });
});

// Get battle report
app.get('/api/games/:gameId/report', (req, res) => {
    const { gameId } = req.params;
    const game = games.get(gameId);

    if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const state = game.state;
    const report = {
        gameId,
        status: game.status,
        winner: game.winner || null,
        rounds: state.round,
        turns: state.turn,
        player1: {
            faction: Factions[state.players[1].faction]?.name || state.players[1].faction,
            agentId: state.players[1].agentId,
            unitsRemaining: state.players[1].units.length,
            victoryPoints: state.players[1].vp,
            totalWoundsRemaining: state.players[1].units.reduce((sum, u) => sum + u.currentWounds, 0)
        },
        player2: {
            faction: Factions[state.players[2].faction]?.name || state.players[2].faction,
            agentId: state.players[2].agentId,
            unitsRemaining: state.players[2].units.length,
            victoryPoints: state.players[2].vp,
            totalWoundsRemaining: state.players[2].units.reduce((sum, u) => sum + u.currentWounds, 0)
        },
        moveCount: game.moveHistory.length,
        combatCount: game.combatHistory.length,
        duration: Date.now() - game.createdAt
    };

    res.json({ success: true, report });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCoverBonus(unit, state) {
    if (!unit || !unit.position) return 0;

    const { row, col } = unit.position;
    const adjacent = [
        [row - 1, col], [row + 1, col],
        [row, col - 1], [row, col + 1]
    ];

    for (const [r, c] of adjacent) {
        if (r >= 0 && r < GameConfig.GRID_SIZE && c >= 0 && c < GameConfig.GRID_SIZE) {
            if (state.terrain.some(t => t.row === r && t.col === c)) {
                return -1; // -1 to save target = easier to save
            }
        }
    }
    return 0;
}

function advancePhase(state) {
    const gamePhases = ['movement', 'shooting', 'combat', 'morale'];

    if (state.phase === 'deployment') {
        state.phase = 'movement';
        return;
    }

    const currentIndex = gamePhases.indexOf(state.phase);
    const nextIndex = (currentIndex + 1) % gamePhases.length;

    if (nextIndex === 0) {
        state.turn++;
        state.phase = 'movement';
        state.round = Math.floor((state.turn + 1) / 2);
    } else {
        state.phase = gamePhases[nextIndex];
    }
}

function checkVictoryCondition(game) {
    const state = game.state;

    // Check if either player has no HQ units left
    const player1HQ = state.players[1].units.filter(u => u.type === 'HQ');
    const player2HQ = state.players[2].units.filter(u => u.type === 'HQ');

    if (player1HQ.length === 0) {
        game.status = 'finished';
        game.winner = 2;
        game.winReason = 'HQ destroyed';
        return;
    }

    if (player2HQ.length === 0) {
        game.status = 'finished';
        game.winner = 1;
        game.winReason = 'HQ destroyed';
        return;
    }

    // Check max rounds
    if (state.round > state.maxRounds) {
        game.status = 'finished';
        if (state.players[1].vp > state.players[2].vp) {
            game.winner = 1;
        } else if (state.players[2].vp > state.players[1].vp) {
            game.winner = 2;
        } else {
            game.winner = 0; // Draw
        }
        game.winReason = 'Max rounds reached';
    }
}

function sanitizeStateForPlayer(state, playerId) {
    // For now, return full state. Could implement fog of war here.
    return {
        ...state,
        isYourTurn: state.currentPlayer === playerId
    };
}

// ============================================
// START SERVER
// ============================================

// Serve web UI for any non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`  WARHAMMER 40K BATTLE ARENA SERVER`);
    console.log(`========================================`);
    console.log(`\n  Server running on port ${PORT}`);
    console.log(`\n  Web UI:     http://localhost:${PORT}/`);
    console.log(`  API Base:   http://localhost:${PORT}/api`);
    console.log(`\n  LOBBY ENDPOINTS (for matchmaking):`);
    console.log(`    GET  /api/lobby              - List open games`);
    console.log(`    POST /api/lobby/create       - Create open game`);
    console.log(`    POST /api/lobby/join/:id     - Join open game`);
    console.log(`    DELETE /api/lobby/:id        - Cancel open game`);
    console.log(`\n  GAME ENDPOINTS:`);
    console.log(`    GET  /api/games              - List all games`);
    console.log(`    POST /api/games              - Create game (both players)`);
    console.log(`    GET  /api/games/:id          - Get game state`);
    console.log(`    POST /api/games/:id/move     - Move unit`);
    console.log(`    POST /api/games/:id/attack   - Attack unit`);
    console.log(`    POST /api/games/:id/end-turn - End turn`);
    console.log(`    GET  /api/games/:id/report   - Battle report`);
    console.log(`\n  CHAT ENDPOINTS:`);
    console.log(`    GET  /api/games/:id/messages - Get messages`);
    console.log(`    POST /api/games/:id/messages - Send message`);
    console.log(`\n  SPECTATOR ENDPOINTS:`);
    console.log(`    GET  /api/watch/:id          - Watch game (no auth)`);
    console.log(`    GET  /api/watch/:id/poll     - Poll for updates`);
    console.log(`\n========================================\n`);
});

module.exports = app;
