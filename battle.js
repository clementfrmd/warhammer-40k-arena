// Warhammer 40K Battle Arena - Battle Management
const Battle = {
    // Deploy units to starting positions
    deployUnits() {
        const players = Game.state.players;

        // Player 1: Left side (cols 0-2)
        players[1].units.forEach((unit, index) => {
            const row = 2 + (index % 6);
            const col = 0;
            if (row < 10 && !Game.state.battlefield[row][col]) {
                Game.state.battlefield[row][col] = unit;
                unit.position = { row, col };
            }
        });

        // Player 2: Right side (cols 7-9)
        players[2].units.forEach((unit, index) => {
            const row = 2 + (index % 6);
            const col = 9;
            if (row < 10 && !Game.state.battlefield[row][col]) {
                Game.state.battlefield[row][col] = unit;
                unit.position = { row, col };
            }
        });

        Game.updateBattlefieldDisplay();
        Game.log('Units deployed! The battle begins!', 'movement');
    },

    // Calculate line of sight for shooting
    hasLineOfSight(attacker, target) {
        const { row: r1, col: c1 } = attacker.position;
        const { row: r2, col: c2 } = target.position;

        // Simple check: no blocking terrain in direct line
        const dr = Math.sign(r2 - r1);
        const dc = Math.sign(c2 - c1);

        let r = r1 + dr;
        let c = c1 + dc;

        while (r !== r2 || c !== c2) {
            if (Game.isTerrain(r, c)) {
                return false;
            }
            if (r !== r2) r += dr;
            if (c !== c2) c += dc;
        }

        return true;
    },

    // Calculate cover bonus
    getCoverBonus(unit) {
        const { row, col } = unit.position;

        // Check adjacent cells for terrain
        const adjacent = [
            [row-1, col], [row+1, col],
            [row, col-1], [row, col+1]
        ];

        let inCover = false;
        adjacent.forEach(([r, c]) => {
            if (r >= 0 && r < 10 && c >= 0 && c < 10 && Game.isTerrain(r, c)) {
                inCover = true;
            }
        });

        return inCover ? -1 : 0; // -1 AP = +1 to save
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
        // Simplified: Control center of battlefield
        const centerRow = 4;
        const centerCol = 5;
        const centerUnit = Game.state.battlefield[centerRow][centerCol];

        if (centerUnit) {
            Game.state.players[centerUnit.player].vp += 1;
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
        const grid = [];
        for (let row = 0; row < 10; row++) {
            grid[row] = [];
            for (let col = 0; col < 10; col++) {
                const unit = Game.state.battlefield[row][col];
                if (unit) {
                    grid[row][col] = {
                        name: unit.name,
                        player: unit.player,
                        type: unit.type,
                        wounds: unit.currentWounds,
                        maxWounds: unit.wounds
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
