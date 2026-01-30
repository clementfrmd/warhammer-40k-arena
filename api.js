// Warhammer 40K Arena - API Layer for Multi-Agent Support
const API = {
    baseUrl: '/api', // Configure for your server

    // Initialize new game
    async initGame(config) {
        const gameId = crypto.randomUUID ? crypto.randomUUID() : `game-${Date.now()}`;
        const gameState = {
            gameId,
            turn: 1,
            round: 1,
            phase: 'deployment',
            currentPlayer: 1,
            maxRounds: 5,
            players: {
                1: {
                    faction: config.player1Faction,
                    units: [],
                    vp: 0,
                    agentId: config.player1AgentId
                },
                2: {
                    faction: config.player2Faction,
                    units: [],
                    vp: 0,
                    agentId: config.player2AgentId
                }
            },
            battlefield: Array(10).fill(null).map(() => Array(10).fill(null)),
            terrain: [
                { row: 2, col: 4 },
                { row: 3, col: 5 },
                { row: 7, col: 2 },
                { row: 6, col: 7 }
            ],
            moveHistory: [],
            combatHistory: [],
            stateHash: null,
            lastUpdate: Date.now(),
            turnStartedAt: Date.now(),
            turnTimeout: 300000
        };

        gameState.stateHash = await Security.generateHash(gameState);

        return {
            success: true,
            gameState,
            gameId
        };
    },

    // Get current game state
    async getGameState(gameId) {
        const state = await this.loadGameState(gameId);
        if (!state) {
            return { success: false, error: "Game not found" };
        }

        // Validate state integrity
        const isValid = await Security.validateStateIntegrity(state);
        if (!isValid) {
            return { success: false, error: "State integrity check failed" };
        }

        return {
            success: true,
            gameState: state
        };
    },

    // Make a move
    async makeMove(gameId, agentId, moveData) {
        // Rate limiting
        const rateCheck = Security.checkRateLimit(agentId, 'move', 10, 60000);
        if (!rateCheck.allowed) {
            return {
                success: false,
                error: "Rate limit exceeded. Please wait.",
                resetAt: rateCheck.resetAt
            };
        }

        // Get current state
        const currentState = await this.getGameState(gameId);
        if (!currentState.success) {
            return currentState;
        }

        const state = currentState.gameState;

        // Validate agent is current player
        if (state.players[state.currentPlayer].agentId !== agentId) {
            return { success: false, error: "Not your turn" };
        }

        // Validate turn timeout
        if (!Security.validateTurnTimeout(state)) {
            return { success: false, error: "Turn timeout exceeded" };
        }

        // Sanitize inputs
        const unitId = Security.sanitizeInput(moveData.unitId);
        const from = moveData.from;
        const to = moveData.to;

        // Find unit
        const unit = state.players[state.currentPlayer].units.find(u => u.id === unitId);
        if (!unit) {
            return { success: false, error: "Unit not found" };
        }

        // Validate move
        const moveValidation = Security.validateMove(unit, from, to, state);
        if (!moveValidation.valid) {
            return {
                success: false,
                error: "Invalid move",
                details: moveValidation.errors
            };
        }

        // Execute move
        state.battlefield[from.row][from.col] = null;
        state.battlefield[to.row][to.col] = unit;
        unit.position = { row: to.row, col: to.col };

        // Record in history
        state.moveHistory.push({
            turn: state.turn,
            player: state.currentPlayer,
            unitId,
            from,
            to,
            timestamp: Date.now()
        });

        // Update state
        state.lastUpdate = Date.now();
        state.stateHash = await Security.generateHash(state);

        // Save state
        await this.saveGameState(gameId, state);

        // Log audit
        await Security.logAudit('move', agentId, {
            gameId,
            unitId,
            from,
            to
        });

        return {
            success: true,
            gameState: state,
            moveRecorded: state.moveHistory[state.moveHistory.length - 1]
        };
    },

    // Attack enemy unit
    async attackUnit(gameId, agentId, attackData) {
        // Rate limiting
        const rateCheck = Security.checkRateLimit(agentId, 'attack', 5, 60000);
        if (!rateCheck.allowed) {
            return {
                success: false,
                error: "Rate limit exceeded",
                resetAt: rateCheck.resetAt
            };
        }

        // Get current state
        const currentState = await this.getGameState(gameId);
        if (!currentState.success) {
            return currentState;
        }

        const state = currentState.gameState;

        // Validate agent is current player
        if (state.players[state.currentPlayer].agentId !== agentId) {
            return { success: false, error: "Not your turn" };
        }

        // Find units
        const attacker = state.players[state.currentPlayer].units.find(
            u => u.id === attackData.attackerId
        );
        if (!attacker) {
            return { success: false, error: "Attacker not found" };
        }

        const defender = state.players[state.currentPlayer === 1 ? 2 : 1].units.find(
            u => u.id === attackData.targetId
        );
        if (!defender) {
            return { success: false, error: "Target not found" };
        }

        // Validate attack
        const combatValidation = Security.validateCombat(
            attacker,
            defender,
            attackData.type,
            state
        );
        if (!combatValidation.valid) {
            return {
                success: false,
                error: "Invalid attack",
                details: combatValidation.errors
            };
        }

        // Execute combat
        const hitRoll = Math.floor(Math.random() * 6) + 1;
        const hitSuccess = hitRoll >= 3;

        let damage = 0;
        let saved = false;

        if (hitSuccess) {
            const woundRoll = Math.floor(Math.random() * 6) + 1;
            const woundSuccess = woundRoll >= 4;

            if (woundSuccess) {
                const saveRoll = Math.floor(Math.random() * 6) + 1;
                const saveSuccess = saveRoll >= 4;

                if (!saveSuccess) {
                    damage = Math.floor(Math.random() * 6) + 1;
                    defender.currentWounds -= damage;
                } else {
                    saved = true;
                }
            }
        }

        // Record combat
        const combatRecord = {
            turn: state.turn,
            player: state.currentPlayer,
            attackerId: attacker.id,
            targetId: defender.id,
            type: attackData.type,
            hitRoll,
            woundRoll: hitSuccess ? Math.floor(Math.random() * 6) + 1 : null,
            saveRoll: hitSuccess ? Math.floor(Math.random() * 6) + 1 : null,
            damage,
            saved,
            timestamp: Date.now()
        };

        state.combatHistory.push(combatRecord);

        // Check if unit destroyed
        if (defender.currentWounds <= 0) {
            state.players[state.currentPlayer === 1 ? 2 : 1].vp +=
                defender.type === 'HQ' ? 2 : 1;

            // Remove unit from battlefield
            state.battlefield[defender.position.row][defender.position.col] = null;

            // Remove from player's units
            state.players[state.currentPlayer === 1 ? 2 : 1].units =
                state.players[state.currentPlayer === 1 ? 2 : 1].units.filter(
                    u => u.id !== defender.id
                );
        }

        // Mark attacker as having attacked
        attacker.hasAttacked = true;

        // Update state
        state.lastUpdate = Date.now();
        state.stateHash = await Security.generateHash(state);

        // Save state
        await this.saveGameState(gameId, state);

        // Log audit
        await Security.logAudit('attack', agentId, {
            gameId,
            attackerId: attacker.id,
            targetId: defender.id,
            type: attackData.type,
            damage
        });

        return {
            success: true,
            gameState: state,
            combatResult: combatRecord,
            unitDestroyed: defender.currentWounds <= 0
        };
    },

    // End turn
    async endTurn(gameId, agentId) {
        const currentState = await this.getGameState(gameId);
        if (!currentState.success) {
            return currentState;
        }

        const state = currentState.gameState;

        // Validate agent is current player
        if (state.players[state.currentPlayer].agentId !== agentId) {
            return { success: false, error: "Not your turn" };
        }

        // Switch player
        state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;

        // Advance phase
        const phases = ['movement', 'shooting', 'combat', 'morale'];
        const currentIndex = phases.indexOf(state.phase);
        const nextIndex = (currentIndex + 1) % phases.length;

        if (nextIndex === 0) {
            state.turn++;
            state.phase = 'movement';
        } else {
            state.phase = phases[nextIndex];
        }

        // Advance round every 2 turns
        if (state.turn % 2 === 1) {
            state.round = Math.floor(state.turn / 2) + 1;
        }

        // Reset unit attack flags
        state.players[1].units.forEach(u => u.hasAttacked = false);
        state.players[2].units.forEach(u => u.hasAttacked = false);

        // Update turn timeout
        state.turnStartedAt = Date.now();

        // Update state
        state.lastUpdate = Date.now();
        state.stateHash = await Security.generateHash(state);

        // Save state
        await this.saveGameState(gameId, state);

        // Log audit
        await Security.logAudit('endTurn', agentId, { gameId });

        return {
            success: true,
            gameState: state
        };
    },

    // Get game state for file storage (simulated - replace with real DB/API)
    async loadGameState(gameId) {
        // In a real implementation, this would load from a database or API
        // For now, return null (needs server-side storage)
        return null;
    },

    // Save game state
    async saveGameState(gameId, state) {
        // In a real implementation, this would save to a database or API
        // For now, do nothing (needs server-side storage)
        console.log(`[API] Saving state for game ${gameId}`);
    },

    // Generate battle report
    async generateBattleReport(gameId) {
        const currentState = await this.getGameState(gameId);
        if (!currentState.success) {
            return currentState;
        }

        const state = currentState.gameState;
        const player1 = state.players[1];
        const player2 = state.players[2];

        const winner = player1.vp > player2.vp ? 1 :
                       player2.vp > player1.vp ? 2 : 0;

        const report = {
            gameId,
            winner,
            rounds: state.round,
            turns: state.turn,
            completed: winner !== null,
            players: {
                1: {
                    faction: player1.faction,
                    unitsRemaining: player1.units.length,
                    victoryPoints: player1.vp,
                    totalWounds: player1.units.reduce((sum, u) => sum + u.currentWounds, 0)
                },
                2: {
                    faction: player2.faction,
                    unitsRemaining: player2.units.length,
                    victoryPoints: player2.vp,
                    totalWounds: player2.units.reduce((sum, u) => sum + u.currentWounds, 0)
                }
            },
            moveHistory: state.moveHistory,
            combatHistory: state.combatHistory,
            generatedAt: Date.now()
        };

        return {
            success: true,
            report
        };
    },

    // Get audit log
    async getAuditLog(gameId, agentId) {
        return {
            success: true,
            auditLog: Security.getAuditLog().filter(
                entry => entry.details.gameId === gameId
            )
        };
    }
};
