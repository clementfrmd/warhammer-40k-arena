// Warhammer 40K Battle Arena - Battle Management
// Note: Uses GameConfig constants from game.js when available
const Battle = {
    // Get config value with fallback
    getConfig(key, fallback) {
        return typeof GameConfig !== 'undefined' && GameConfig[key] !== undefined
            ? GameConfig[key]
            : fallback;
    },

    // Deploy units to starting positions
    deployUnits() {
        const players = Game.state.players;
        const gridSize = this.getConfig('GRID_SIZE', 10);

        // Player 1: Left side (col 0)
        players[1].units.forEach((unit, index) => {
            const row = 2 + (index % 6);
            const col = 0;
            if (row < gridSize && !Game.state.battlefield[row][col]) {
                Game.state.battlefield[row][col] = unit;
                unit.position = { row, col };
            }
        });

        // Player 2: Right side (last col)
        players[2].units.forEach((unit, index) => {
            const row = 2 + (index % 6);
            const col = gridSize - 1;
            if (row < gridSize && !Game.state.battlefield[row][col]) {
                Game.state.battlefield[row][col] = unit;
                unit.position = { row, col };
            }
        });

        Game.updateBattlefieldDisplay();
        Game.log('Units deployed! The battle begins!', 'movement');
    },

    // Calculate line of sight for shooting using Bresenham's line algorithm
    hasLineOfSight(attacker, target) {
        const { row: r1, col: c1 } = attacker.position;
        const { row: r2, col: c2 } = target.position;

        // Use Bresenham's line algorithm for accurate line tracing
        const cells = this.getLineCells(r1, c1, r2, c2);

        // Check all cells except start and end for terrain
        for (let i = 1; i < cells.length - 1; i++) {
            if (Game.isTerrain(cells[i].row, cells[i].col)) {
                return false;
            }
        }

        return true;
    },

    // Bresenham's line algorithm - returns all cells along a line
    getLineCells(r1, c1, r2, c2) {
        const cells = [];
        const dr = Math.abs(r2 - r1);
        const dc = Math.abs(c2 - c1);
        const sr = r1 < r2 ? 1 : -1;
        const sc = c1 < c2 ? 1 : -1;
        let err = dr - dc;

        let r = r1;
        let c = c1;

        while (true) {
            cells.push({ row: r, col: c });

            if (r === r2 && c === c2) break;

            const e2 = 2 * err;
            if (e2 > -dc) {
                err -= dc;
                r += sr;
            }
            if (e2 < dr) {
                err += dr;
                c += sc;
            }
        }

        return cells;
    },

    // Calculate cover bonus
    getCoverBonus(unit) {
        if (!unit || !unit.position) return 0;

        const { row, col } = unit.position;
        const gridSize = this.getConfig('GRID_SIZE', 10);

        // Check adjacent cells for terrain
        const adjacent = [
            [row-1, col], [row+1, col],
            [row, col-1], [row, col+1]
        ];

        let inCover = false;
        adjacent.forEach(([r, c]) => {
            if (r >= 0 && r < gridSize && c >= 0 && c < gridSize && Game.isTerrain(r, c)) {
                inCover = true;
            }
        });

        return inCover ? -1 : 0; // -1 to save target = easier to save
    },

    // Calculate distance between units
    getDistance(unit1, unit2) {
        const { row: r1, col: c1 } = unit1.position;
        const { row: r2, col: c2 } = unit2.position;

        return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(c2 - c1, 2));
    },

    // Check morale for a player's units
    checkMorale(player) {
        const units = Game.state.players[player].units;
        units.forEach(unit => {
            // Check if unit took damage this turn (simplified)
            const damageTaken = unit.wounds - unit.currentWounds;
            const threshold = Math.ceil(unit.wounds / 2);

            if (damageTaken >= threshold) {
                const roll = Game.rollDice();
                if (roll > unit.leadership) {
                    // Unit fails morale
                    Game.log(`${unit.name} fails morale check!`, 'combat');
                    // Optional: fallback or retreat
                }
            }
        });
    },

    // Calculate objective control
    calculateObjectives() {
        const gridSize = this.getConfig('GRID_SIZE', 10);
        const vpUnit = this.getConfig('VP_UNIT_DESTROYED', 1);

        // Simplified: Control center of battlefield
        const centerRow = Math.floor(gridSize / 2) - 1;
        const centerCol = Math.floor(gridSize / 2);
        const centerUnit = Game.state.battlefield[centerRow][centerCol];

        if (centerUnit) {
            Game.state.players[centerUnit.player].vp += vpUnit;
            Game.log(`${centerUnit.name} controls the objective!`, 'victory');
        }
    },

    // End of round processing
    endRound() {
        // Check objectives
        this.calculateObjectives();

        // Check victory conditions
        Game.checkVictoryCondition();

        // Update displays
        Game.updatePlayerPanels();
    },

    // Get battle statistics
    getBattleStats() {
        const stats = {
            rounds: Game.state.round,
            turns: Game.state.turn,
            phase: Game.state.phase,
            player1: {
                unitsRemaining: Game.state.players[1].units.length,
                victoryPoints: Game.state.players[1].vp,
                totalWounds: Game.state.players[1].units.reduce((sum, u) => sum + u.currentWounds, 0)
            },
            player2: {
                unitsRemaining: Game.state.players[2].units.length,
                victoryPoints: Game.state.players[2].vp,
                totalWounds: Game.state.players[2].units.reduce((sum, u) => sum + u.currentWounds, 0)
            }
        };

        return stats;
    },

    // Generate battle report
    generateBattleReport() {
        const stats = this.getBattleStats();
        const winner = stats.player1.victoryPoints > stats.player2.victoryPoints ? 'Player 1' :
                      stats.player2.victoryPoints > stats.player1.victoryPoints ? 'Player 2' : 'Draw';

        return `
=== WARHAMMER 40K BATTLE REPORT ===
Rounds: ${stats.rounds}
Winner: ${winner}

PLAYER 1 (${Factions[Game.state.players[1].faction].name}):
- Units Remaining: ${stats.player1.unitsRemaining}
- Victory Points: ${stats.player1.victoryPoints}
- Total Wounds: ${stats.player1.totalWounds}

PLAYER 2 (${Factions[Game.state.players[2].faction].name}):
- Units Remaining: ${stats.player2.unitsRemaining}
- Victory Points: ${stats.player2.victoryPoints}
- Total Wounds: ${stats.player2.totalWounds}

================================
        `;
    },

    // Save battle state (for multiplayer)
    saveBattleState() {
        const state = {
            ...Game.state,
            timestamp: Date.now()
        };

        return JSON.stringify(state);
    },

    // Load battle state (for multiplayer)
    loadBattleState(stateJson) {
        try {
            const state = JSON.parse(stateJson);
            Game.state = state;

            // Update UI
            Game.updateBattlefieldDisplay();
            Game.updateTurnIndicator();
            Game.updatePlayerPanels();

            return true;
        } catch (e) {
            console.error('Failed to load battle state:', e);
            return false;
        }
    },

    // Get battle state for API
    getBattleStateForAPI() {
        return {
            turn: Game.state.turn,
            round: Game.state.round,
            phase: Game.state.phase,
            currentPlayer: Game.state.currentPlayer,
            battlefield: this.serializeBattlefield(),
            players: this.serializePlayers()
        };
    },

    // Serialize battlefield for API
    serializeBattlefield() {
        const gridSize = this.getConfig('GRID_SIZE', 10);
        const grid = [];

        for (let row = 0; row < gridSize; row++) {
            grid[row] = [];
            for (let col = 0; col < gridSize; col++) {
                const unit = Game.state.battlefield[row][col];
                if (unit) {
                    grid[row][col] = {
                        name: unit.name,
                        player: unit.player,
                        type: unit.type,
                        wounds: unit.currentWounds,
                        maxWounds: unit.wounds,
                        position: unit.position,
                        hasMoved: unit.hasMoved || false,
                        hasAttacked: unit.hasAttacked || false
                    };
                } else {
                    grid[row][col] = null;
                }
            }
        }
        return grid;
    },

    // Serialize players for API
    serializePlayers() {
        return {
            1: {
                faction: Game.state.players[1].faction,
                units: Game.state.players[1].units.map(u => ({
                    name: u.name,
                    type: u.type,
                    wounds: u.currentWounds,
                    maxWounds: u.wounds,
                    position: u.position
                })),
                victoryPoints: Game.state.players[1].vp
            },
            2: {
                faction: Game.state.players[2].faction,
                units: Game.state.players[2].units.map(u => ({
                    name: u.name,
                    type: u.type,
                    wounds: u.currentWounds,
                    maxWounds: u.wounds,
                    position: u.position
                })),
                victoryPoints: Game.state.players[2].vp
            }
        };
    }
};

// Auto-deploy on game start
const originalStartGame = Game.startGame;
Game.startGame = function() {
    originalStartGame.call(Game);
    Battle.deployUnits();
};
