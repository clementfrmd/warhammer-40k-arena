// Openhammer 40K - AI Agent Battle Arena - Core Game Logic

// Game Configuration Constants
const GameConfig = {
    // Battlefield dimensions
    GRID_SIZE: 10,

    // Combat rules
    HIT_THRESHOLD: 3,        // Roll this or higher to hit
    WOUND_THRESHOLD: 4,      // Roll this or higher to wound
    SAVE_THRESHOLD: 4,       // Roll this or higher to save
    MIN_SAVE_THRESHOLD: 2,   // Minimum save value (with cover)

    // Movement (in grid cells, unit.move / MOVE_SCALE = grid cells)
    MOVE_SCALE: 2,           // 2" = 1 grid cell

    // Attack ranges (in grid cells)
    SHOOTING_RANGE: 6,
    MELEE_RANGE: 2,

    // Victory points
    VP_UNIT_DESTROYED: 1,
    VP_HQ_DESTROYED: 2,

    // Game length
    MAX_ROUNDS: 5,

    // Turn timeout (5 minutes in ms)
    TURN_TIMEOUT: 300000,

    // Rate limits
    MOVES_PER_MINUTE: 10,
    ATTACKS_PER_MINUTE: 5
};

const Game = {
    state: {
        turn: 1,
        round: 1,
        phase: 'deployment', // deployment, movement, shooting, combat, morale
        currentPlayer: 1,
        maxRounds: GameConfig.MAX_ROUNDS,
        players: {
            1: { faction: null, units: [], vp: 0, agentId: null },
            2: { faction: null, units: [], vp: 0, agentId: null }
        },
        selectedUnit: null,
        validMoves: [],
        validTargets: [],
        battlefield: [],
        terrain: []
    },

    // Initialize game
    init() {
        this.setupBattlefield();
        this.showFactionSelection();
        this.log("Welcome to Openhammer 40K - AI Agent Battle Arena!");
    },

    // Load game state from remote API response
    loadRemoteState(remoteState) {
        // Map remote state to local state format
        this.state.turn = remoteState.turn || 1;
        this.state.round = remoteState.round || 1;
        this.state.phase = remoteState.phase || 'movement';
        this.state.currentPlayer = remoteState.currentPlayer || 1;
        this.state.maxRounds = remoteState.maxRounds || GameConfig.MAX_ROUNDS;

        // Load players
        if (remoteState.players) {
            for (const playerId of [1, 2]) {
                const remotePlayer = remoteState.players[playerId];
                if (remotePlayer) {
                    this.state.players[playerId] = {
                        faction: remotePlayer.faction,
                        agentId: remotePlayer.agentId,
                        units: remotePlayer.units || [],
                        vp: remotePlayer.vp || 0
                    };
                }
            }
        }

        // Load battlefield
        if (remoteState.battlefield) {
            this.state.battlefield = remoteState.battlefield;
        } else {
            // Rebuild battlefield from units
            this.rebuildBattlefield();
        }

        // Load terrain
        if (remoteState.terrain) {
            this.state.terrain = remoteState.terrain;
        }

        // Update display
        this.setupBattlefieldGrid();
        this.updateBattlefieldDisplay();
        this.updatePlayerPanels();
        this.updateTurnIndicator();
    },

    // Rebuild battlefield grid from unit positions
    rebuildBattlefield() {
        // Initialize empty battlefield
        this.state.battlefield = [];
        for (let row = 0; row < GameConfig.GRID_SIZE; row++) {
            this.state.battlefield[row] = [];
            for (let col = 0; col < GameConfig.GRID_SIZE; col++) {
                this.state.battlefield[row][col] = null;
            }
        }

        // Place units on battlefield
        for (const playerId of [1, 2]) {
            const units = this.state.players[playerId].units;
            if (units) {
                units.forEach(unit => {
                    if (unit.position && unit.position.row !== undefined && unit.position.col !== undefined) {
                        unit.player = playerId;
                        this.state.battlefield[unit.position.row][unit.position.col] = unit;
                    }
                });
            }
        }
    },

    // Setup battlefield grid (just the DOM elements)
    setupBattlefieldGrid() {
        const grid = document.getElementById('battlefieldGrid');
        grid.innerHTML = '';

        for (let row = 0; row < GameConfig.GRID_SIZE; row++) {
            for (let col = 0; col < GameConfig.GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.onclick = () => this.handleCellClick(row, col);
                grid.appendChild(cell);
            }
        }
    },

    // Handle remote game end
    handleRemoteGameEnd(gameState) {
        const modal = document.getElementById('victoryModal');
        const message = document.getElementById('victoryMessage');
        const stats = document.getElementById('victoryStats');

        if (gameState.winner === 0) {
            message.textContent = "It's a draw!";
        } else if (gameState.winner) {
            const winner = gameState.players[gameState.winner];
            const winnerFaction = Factions[winner.faction]?.name || winner.faction;
            const isYou = typeof Lobby !== 'undefined' && Lobby.playerNumber === gameState.winner;

            if (isYou) {
                message.textContent = `VICTORY! You (${winnerFaction}) Won!`;
                message.style.color = 'var(--success)';
            } else {
                message.textContent = `DEFEAT! ${winner.agentId} (${winnerFaction}) Won!`;
                message.style.color = 'var(--danger)';
            }
        }

        // Show stats
        if (stats && gameState.players) {
            const p1 = gameState.players[1];
            const p2 = gameState.players[2];
            stats.innerHTML = `
                <div style="display: flex; justify-content: space-around; margin: 20px 0;">
                    <div>
                        <strong>${p1.agentId || 'Player 1'}</strong><br>
                        VP: ${p1.vp || 0}<br>
                        Units: ${p1.units?.length || 0}
                    </div>
                    <div>
                        <strong>${p2?.agentId || 'Player 2'}</strong><br>
                        VP: ${p2?.vp || 0}<br>
                        Units: ${p2?.units?.length || 0}
                    </div>
                </div>
                <p style="color: var(--text-secondary);">Reason: ${gameState.winReason || 'Game ended'}</p>
            `;
        }

        modal.style.display = 'block';
        this.log(`Game Over! ${message.textContent}`, 'victory');
    },

    // Check if this is a remote game
    isRemoteGame() {
        return typeof Lobby !== 'undefined' && Lobby.isRemoteGame;
    },

    // Check if it's the local player's turn
    isMyTurn() {
        if (!this.isRemoteGame()) return true;  // Local play - always your turn
        return typeof Lobby !== 'undefined' && this.state.currentPlayer === Lobby.playerNumber;
    },

    // Setup battlefield grid
    setupBattlefield() {
        const grid = document.getElementById('battlefieldGrid');
        grid.innerHTML = '';
        this.state.battlefield = [];

        for (let row = 0; row < GameConfig.GRID_SIZE; row++) {
            this.state.battlefield[row] = [];
            for (let col = 0; col < GameConfig.GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.onclick = () => this.handleCellClick(row, col);
                grid.appendChild(cell);
                this.state.battlefield[row][col] = null;
            }
        }

        // Add some terrain
        this.addTerrain(2, 4);
        this.addTerrain(3, 5);
        this.addTerrain(7, 2);
        this.addTerrain(6, 7);
    },

    // Add terrain to battlefield
    addTerrain(row, col) {
        const index = row * GameConfig.GRID_SIZE + col;
        const cell = document.querySelector(`.grid .cell:nth-child(${index + 1})`);
        if (cell) {
            cell.classList.add('terrain');
            this.state.terrain.push({ row, col });
        }
    },

    // Show faction selection modal - now handled by FactionSelect module
    showFactionSelection() {
        const modal = document.getElementById('setupModal');
        if (typeof FactionSelect !== 'undefined') {
            FactionSelect.init();
        }
        modal.style.display = 'block';
    },

    // Select faction - now delegated to FactionSelect module
    selectFaction(factionId, element) {
        if (typeof FactionSelect !== 'undefined') {
            FactionSelect.selectFaction(factionId, element);
        }
    },

    // Start game after faction selection
    startGame() {
        if (!this.state.players[1].faction || !this.state.players[2].faction) {
            alert('Please select factions for both players!');
            return;
        }

        document.getElementById('setupModal').style.display = 'none';

        // Create units for both players
        this.createPlayerUnits(1);
        this.createPlayerUnits(2);

        // Update UI
        this.updatePlayerPanels();
        this.updateTurnIndicator();

        this.log("Battle begins! Deploy your units!");
        this.state.phase = 'movement';
    },

    // Create units for a player
    createPlayerUnits(player) {
        const faction = this.state.players[player].faction;
        const units = [];

        // Add hero
        const heroes = Characters[`${faction}Heroes`];
        if (heroes) {
            const heroType = Object.keys(heroes)[0]; // First hero
            const hero = { ...heroes[heroType] };
            hero.id = `p${player}-${heroType}`;
            hero.player = player;
            hero.currentWounds = hero.wounds;
            hero.position = null;
            units.push(hero);
        }

        // Add some units
        const factionUnits = Characters[`${faction}Units`];
        if (factionUnits) {
            Object.keys(factionUnits).slice(0, 2).forEach((unitType, index) => {
                const unit = { ...factionUnits[unitType] };
                unit.id = `p${player}-${unitType}-${index}`;
                unit.player = player;
                unit.currentWounds = unit.wounds * (unit.count || 1);
                unit.position = null;
                units.push(unit);
            });
        }

        this.state.players[player].units = units;
    },

    // Handle cell click
    handleCellClick(row, col) {
        const clickedCell = this.state.battlefield[row][col];

        // In remote games, check if it's our turn
        if (this.isRemoteGame() && !this.isMyTurn()) {
            // Allow viewing unit info but not actions
            if (clickedCell) {
                this.showUnitInfo(clickedCell);
            }
            return;
        }

        // Determine which player's units we can control
        const controllablePlayer = this.isRemoteGame()
            ? (typeof Lobby !== 'undefined' ? Lobby.playerNumber : this.state.currentPlayer)
            : this.state.currentPlayer;

        // If selecting a unit (only our own units)
        if (clickedCell && clickedCell.player === controllablePlayer) {
            this.selectUnit(clickedCell);
            return;
        }

        // If moving to valid position
        if (this.state.selectedUnit && this.isValidMove(row, col)) {
            this.moveUnit(row, col);
            return;
        }

        // If attacking valid target
        if (this.state.selectedUnit && this.isValidTarget(row, col)) {
            this.attackUnit(row, col);
            return;
        }

        // Deselect
        this.deselectUnit();
    },

    // Select unit
    selectUnit(unit) {
        this.state.selectedUnit = unit;
        this.highlightSelectedUnit();
        this.showUnitInfo(unit);
        this.calculateValidMoves();
        this.calculateValidTargets();
    },

    // Deselect unit
    deselectUnit() {
        this.state.selectedUnit = null;
        this.state.validMoves = [];
        this.state.validTargets = [];
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'valid-move', 'valid-target');
        });
        document.getElementById('selectedUnitInfo').innerHTML = '<p>No unit selected</p>';
    },

    // Highlight selected unit
    highlightSelectedUnit() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected');
        });

        if (this.state.selectedUnit && this.state.selectedUnit.position) {
            const { row, col } = this.state.selectedUnit.position;
            const index = row * GameConfig.GRID_SIZE + col;
            const cell = document.querySelector(`.grid .cell:nth-child(${index + 1})`);
            if (cell) cell.classList.add('selected');
        }
    },

    // Show unit info
    showUnitInfo(unit) {
        const info = document.getElementById('selectedUnitInfo');
        info.innerHTML = `
            <strong>${unit.name}</strong><br>
            Wounds: ${unit.currentWounds}/${unit.wounds}<br>
            Move: ${unit.move}" | T: ${unit.toughness}<br>
            Save: ${unit.save} | Ld: ${unit.leadership}<br>
            Attacks: ${unit.attacks}<br>
            ${unit.special ? `<em>${unit.special}</em>` : ''}
        `;
    },

    // Calculate valid moves
    calculateValidMoves() {
        if (!this.state.selectedUnit || !this.state.selectedUnit.position) return;

        this.state.validMoves = [];
        const { row, col } = this.state.selectedUnit.position;
        const moveRange = this.state.selectedUnit.move / GameConfig.MOVE_SCALE;

        for (let r = Math.max(0, row - Math.ceil(moveRange)); r <= Math.min(GameConfig.GRID_SIZE - 1, row + Math.ceil(moveRange)); r++) {
            for (let c = Math.max(0, col - Math.ceil(moveRange)); c <= Math.min(GameConfig.GRID_SIZE - 1, col + Math.ceil(moveRange)); c++) {
                // Use Euclidean distance for proper circular range
                const distance = Math.sqrt(Math.pow(r - row, 2) + Math.pow(c - col, 2));
                if (distance <= moveRange && !this.state.battlefield[r][c] && !this.isTerrain(r, c)) {
                    this.state.validMoves.push({ row: r, col: c });
                }
            }
        }

        this.highlightValidMoves();
    },

    // Calculate valid targets
    calculateValidTargets() {
        this.state.validTargets = [];
        if (!this.state.selectedUnit || !this.state.selectedUnit.position) return;

        const { row, col } = this.state.selectedUnit.position;
        const range = this.state.phase === 'shooting' ? GameConfig.SHOOTING_RANGE : GameConfig.MELEE_RANGE;

        for (let r = Math.max(0, row - range); r <= Math.min(GameConfig.GRID_SIZE - 1, row + range); r++) {
            for (let c = Math.max(0, col - range); c <= Math.min(GameConfig.GRID_SIZE - 1, col + range); c++) {
                // Use Euclidean distance for proper circular range
                const distance = Math.sqrt(Math.pow(r - row, 2) + Math.pow(c - col, 2));
                const target = this.state.battlefield[r][c];
                if (distance <= range && target && target.player !== this.state.currentPlayer) {
                    this.state.validTargets.push({ row: r, col: c });
                }
            }
        }

        this.highlightValidTargets();
    },

    // Check if position is valid move
    isValidMove(row, col) {
        return this.state.validMoves.some(m => m.row === row && m.col === col);
    },

    // Check if position is valid target
    isValidTarget(row, col) {
        return this.state.validTargets.some(t => t.row === row && t.col === col);
    },

    // Check if terrain
    isTerrain(row, col) {
        return this.state.terrain.some(t => t.row === row && t.col === col);
    },

    // Highlight valid moves
    highlightValidMoves() {
        this.state.validMoves.forEach(({ row, col }) => {
            const index = row * GameConfig.GRID_SIZE + col;
            const cell = document.querySelector(`.grid .cell:nth-child(${index + 1})`);
            if (cell) cell.classList.add('valid-move');
        });
    },

    // Highlight valid targets
    highlightValidTargets() {
        this.state.validTargets.forEach(({ row, col }) => {
            const index = row * GameConfig.GRID_SIZE + col;
            const cell = document.querySelector(`.grid .cell:nth-child(${index + 1})`);
            if (cell) cell.classList.add('valid-target');
        });
    },

    // Move unit
    async moveUnit(row, col) {
        const unit = this.state.selectedUnit;

        // Check if unit has already moved this turn
        if (unit.hasMoved) {
            this.log(`${unit.name} has already moved this turn!`, 'combat');
            return;
        }

        // Remote game - send move via API
        if (this.isRemoteGame()) {
            if (!this.isMyTurn()) {
                this.log("It's not your turn!", 'combat');
                return;
            }

            try {
                const response = await fetch(`/api/games/${Lobby.currentGameId}/move`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: Lobby.playerToken,
                        unitId: unit.id,
                        to: { row, col }
                    })
                });

                const data = await response.json();

                if (!data.success) {
                    this.log(`Move failed: ${data.error}`, 'combat');
                    return;
                }

                // Update local state from server response
                if (data.gameState) {
                    this.loadRemoteState(data.gameState);
                }

                this.log(`${unit.name} moves!`, 'movement');
            } catch (error) {
                this.log(`Move error: ${error.message}`, 'combat');
                return;
            }
        } else {
            // Local game - update directly
            const { row: oldRow, col: oldCol } = unit.position;

            // Update battlefield
            this.state.battlefield[oldRow][oldCol] = null;
            this.state.battlefield[row][col] = unit;
            unit.position = { row, col };
            unit.hasMoved = true;

            this.log(`${unit.name} moves!`, 'movement');
            this.updateBattlefieldDisplay();
        }

        this.deselectUnit();
    },

    // Action: Move
    actionMove() {
        if (this.isRemoteGame() && !this.isMyTurn()) {
            this.log("It's not your turn!", 'combat');
            return;
        }
        if (this.state.phase !== 'movement') {
            this.log('Not in movement phase!', 'combat');
            return;
        }
        this.calculateValidMoves();
        this.calculateValidTargets();
    },

    // Action: Shoot
    actionShoot() {
        if (this.isRemoteGame() && !this.isMyTurn()) {
            this.log("It's not your turn!", 'combat');
            return;
        }
        if (this.state.phase !== 'shooting') {
            this.log('Not in shooting phase!', 'combat');
            return;
        }
        this.calculateValidTargets();
    },

    // Action: Charge
    actionCharge() {
        if (this.isRemoteGame() && !this.isMyTurn()) {
            this.log("It's not your turn!", 'combat');
            return;
        }
        if (this.state.phase !== 'movement') {
            this.log('Charge only in movement phase!', 'combat');
            return;
        }
        // Simplified: Charge is like move but to enemy
        this.state.phase = 'combat';
        this.calculateValidTargets();
        this.updateTurnIndicator();
    },

    // Attack unit
    async attackUnit(row, col) {
        const attacker = this.state.selectedUnit;
        const defender = this.state.battlefield[row][col];

        if (!attacker || !defender) return;

        // Check if unit has already attacked this turn
        if (attacker.hasAttacked) {
            this.log(`${attacker.name} has already attacked this turn!`, 'combat');
            return;
        }

        // Remote game - send attack via API
        if (this.isRemoteGame()) {
            if (!this.isMyTurn()) {
                this.log("It's not your turn!", 'combat');
                return;
            }

            const attackType = this.state.phase === 'shooting' ? 'shooting' : 'melee';

            try {
                const response = await fetch(`/api/games/${Lobby.currentGameId}/attack`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: Lobby.playerToken,
                        attackerId: attacker.id,
                        targetId: defender.id,
                        type: attackType
                    })
                });

                const data = await response.json();

                if (!data.success) {
                    this.log(`Attack failed: ${data.error}`, 'combat');
                    return;
                }

                // Show combat results
                const combat = data.combat;
                if (combat) {
                    const rolls = [combat.hitRoll];
                    if (combat.woundRoll) rolls.push(combat.woundRoll);
                    if (combat.saveRoll) rolls.push(combat.saveRoll);
                    if (combat.damage) rolls.push(combat.damage);
                    this.showDiceResults(rolls);

                    if (!combat.hitSuccess) {
                        this.log(`${attacker.name} misses!`, 'combat');
                    } else if (!combat.woundSuccess) {
                        this.log(`${attacker.name} fails to wound!`, 'combat');
                    } else if (combat.saveSuccess) {
                        this.log(`${defender.name} makes the save!`, 'combat');
                    } else {
                        this.log(`${attacker.name} hits ${defender.name} for ${combat.damage} damage!`, 'combat');
                        if (combat.unitDestroyed) {
                            this.log(`${defender.name} has been destroyed!`, 'victory');
                        }
                    }
                }

                // Update local state from server response
                if (data.gameState) {
                    this.loadRemoteState(data.gameState);
                }

                // Check for game end
                if (data.gameStatus === 'finished') {
                    await Lobby.loadGameState();
                }
            } catch (error) {
                this.log(`Attack error: ${error.message}`, 'combat');
                return;
            }
        } else {
            // Local game - execute combat locally
            // Roll to hit
            const hitRoll = this.rollDice();
            const hitSuccess = hitRoll >= GameConfig.HIT_THRESHOLD;

            if (hitSuccess) {
                // Roll to wound
                const woundRoll = this.rollDice();
                const woundSuccess = woundRoll >= GameConfig.WOUND_THRESHOLD;

                if (woundSuccess) {
                    // Roll save - apply cover bonus if defender is in cover
                    const coverBonus = typeof Battle !== 'undefined' ? Battle.getCoverBonus(defender) : 0;
                    const saveRoll = this.rollDice();
                    const saveTarget = Math.max(GameConfig.MIN_SAVE_THRESHOLD, GameConfig.SAVE_THRESHOLD + coverBonus);
                    const saveSuccess = saveRoll >= saveTarget;

                    if (!saveSuccess) {
                        // Deal damage
                        const damage = this.rollDice();
                        defender.currentWounds -= damage;

                        const coverText = coverBonus ? ' (in cover)' : '';
                        this.log(`${attacker.name} hits ${defender.name} for ${damage} damage!${coverText}`, 'combat');
                        this.showDiceResults([hitRoll, woundRoll, saveRoll, damage]);

                        // Check if unit destroyed
                        if (defender.currentWounds <= 0) {
                            this.destroyUnit(defender);
                        }
                    } else {
                        const coverText = coverBonus ? ' (cover helped!)' : '';
                        this.log(`${defender.name} makes the save!${coverText}`, 'combat');
                        this.showDiceResults([hitRoll, woundRoll, saveRoll]);
                    }
                } else {
                    this.log(`${attacker.name} fails to wound!`, 'combat');
                    this.showDiceResults([hitRoll, woundRoll]);
                }
            } else {
                this.log(`${attacker.name} misses!`, 'combat');
                this.showDiceResults([hitRoll]);
            }

            // Mark attacker as having attacked this turn
            attacker.hasAttacked = true;
            this.updateBattlefieldDisplay();
        }

        this.deselectUnit();
    },

    // Destroy unit
    destroyUnit(unit) {
        const { row, col } = unit.position;
        this.state.battlefield[row][col] = null;

        // Remove from player's units
        const owner = this.state.players[unit.player];
        owner.units = owner.units.filter(u => u.id !== unit.id);

        // Award VP to the OPPONENT (the one who destroyed the unit)
        const opponent = this.state.players[unit.player === 1 ? 2 : 1];
        opponent.vp += unit.type === 'HQ' ? GameConfig.VP_HQ_DESTROYED : GameConfig.VP_UNIT_DESTROYED;

        this.log(`${unit.name} has been destroyed!`, 'victory');
        this.checkVictoryCondition();
        this.updatePlayerPanels();
    },

    // Check victory condition
    checkVictoryCondition() {
        const player1Units = this.state.players[1].units.filter(u => u.type === 'HQ');
        const player2Units = this.state.players[2].units.filter(u => u.type === 'HQ');

        if (player1Units.length === 0) {
            this.declareVictory(2);
        } else if (player2Units.length === 0) {
            this.declareVictory(1);
        } else if (this.state.round >= this.state.maxRounds) {
            // VP victory
            if (this.state.players[1].vp > this.state.players[2].vp) {
                this.declareVictory(1);
            } else if (this.state.players[2].vp > this.state.players[1].vp) {
                this.declareVictory(2);
            } else {
                this.declareVictory(0); // Draw
            }
        }
    },

    // Declare victory
    declareVictory(winner) {
        const modal = document.getElementById('victoryModal');
        const message = document.getElementById('victoryMessage');

        if (winner === 0) {
            message.textContent = "It's a draw!";
        } else {
            const playerName = `Player ${winner}`;
            const faction = Factions[this.state.players[winner].faction].name;
            message.textContent = `${playerName} (${faction}) Wins!`;
        }

        modal.style.display = 'block';
        this.log(`🏆 ${message.textContent} 🏆`, 'victory');
    },

    // End turn
    async endTurn() {
        this.deselectUnit();

        // Remote game - send end turn via API
        if (this.isRemoteGame()) {
            if (!this.isMyTurn()) {
                this.log("It's not your turn!", 'combat');
                return;
            }

            try {
                const response = await fetch(`/api/games/${Lobby.currentGameId}/end-turn`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: Lobby.playerToken
                    })
                });

                const data = await response.json();

                if (!data.success) {
                    this.log(`End turn failed: ${data.error}`, 'combat');
                    return;
                }

                // Update local state from server response
                if (data.gameState) {
                    this.loadRemoteState(data.gameState);
                }

                this.log(`Turn ${data.turn}: ${data.currentPlayer === Lobby.playerNumber ? 'Your' : "Opponent's"} turn`);

                // Update turn controls
                Lobby.updateTurnControls();

                // Check for game end
                if (data.gameStatus === 'finished') {
                    await Lobby.loadGameState();
                }
            } catch (error) {
                this.log(`End turn error: ${error.message}`, 'combat');
                return;
            }
        } else {
            // Local game - handle turn change locally
            // Switch player
            this.state.currentPlayer = this.state.currentPlayer === 1 ? 2 : 1;

            // Advance phase
            if (this.state.currentPlayer === 1) {
                this.advancePhase();
            }

            // Reset unit action flags for the new player's turn
            this.state.players[this.state.currentPlayer].units.forEach(unit => {
                unit.hasAttacked = false;
                unit.hasMoved = false;
            });

            this.updateTurnIndicator();
            this.log(`Turn ${this.state.turn}: Player ${this.state.currentPlayer}'s turn`);
        }
    },

    // Advance game phase
    advancePhase() {
        const phases = ['deployment', 'movement', 'shooting', 'combat', 'morale'];
        const currentIndex = phases.indexOf(this.state.phase);

        // Handle deployment phase specially - it only happens once at start
        if (this.state.phase === 'deployment') {
            this.state.phase = 'movement';
            return;
        }

        // Normal phase advancement (excluding deployment)
        const gamePhases = ['movement', 'shooting', 'combat', 'morale'];
        const gamePhaseIndex = gamePhases.indexOf(this.state.phase);
        const nextIndex = (gamePhaseIndex + 1) % gamePhases.length;

        if (nextIndex === 0) {
            // New round starts
            this.state.turn++;
            this.state.phase = 'movement';

            // Advance round counter (both players get a turn per round)
            this.state.round = Math.floor((this.state.turn + 1) / 2);

            // Check for game end at max rounds
            if (this.state.round > this.state.maxRounds) {
                this.checkVictoryCondition();
            }
        } else {
            this.state.phase = gamePhases[nextIndex];
        }
    },

    // Reset game
    resetGame() {
        location.reload();
    },

    // Update turn indicator
    updateTurnIndicator() {
        document.getElementById('currentTurn').textContent = this.state.turn;
        document.getElementById('currentPhase').textContent = this.state.phase.charAt(0).toUpperCase() + this.state.phase.slice(1);
        document.getElementById('roundNumber').textContent = this.state.round;

        const playerText = document.getElementById('currentPlayer');
        if (this.isRemoteGame() && typeof Lobby !== 'undefined') {
            const isMyTurn = this.state.currentPlayer === Lobby.playerNumber;
            if (Lobby.isSpectating) {
                playerText.textContent = `Player ${this.state.currentPlayer}`;
                playerText.style.color = '';
            } else if (isMyTurn) {
                playerText.textContent = 'YOUR TURN';
                playerText.style.color = 'var(--success)';
            } else {
                playerText.textContent = "OPPONENT'S TURN";
                playerText.style.color = 'var(--danger)';
            }
        } else {
            playerText.textContent = `Player ${this.state.currentPlayer}`;
            playerText.style.color = '';
        }
    },

    // Update player panels
    updatePlayerPanels() {
        for (let i = 1; i <= 2; i++) {
            const player = this.state.players[i];
            if (!player) continue;

            const faction = Factions[player.faction];
            const factionEl = document.getElementById(`player${i}Faction`);
            const panelHeader = document.querySelector(`#player${i}Panel h3`);

            // Update header with agent name in remote games
            if (panelHeader) {
                if (this.isRemoteGame() && player.agentId) {
                    const isYou = typeof Lobby !== 'undefined' && Lobby.playerNumber === i;
                    panelHeader.textContent = isYou ? `YOU (${player.agentId})` : player.agentId;
                } else {
                    panelHeader.textContent = `PLAYER ${i}`;
                }
            }

            if (faction) {
                factionEl.innerHTML = `<span style="color: ${faction.color}; font-weight: bold;">${faction.icon}</span> ${faction.name}`;
                factionEl.style.borderLeftColor = faction.color;
            } else {
                factionEl.textContent = 'Awaiting Orders...';
            }

            document.getElementById(`player${i}VP`).textContent = player.vp || 0;

            const unitsList = document.getElementById(`player${i}Units`);
            unitsList.innerHTML = '';

            if (player.units) {
                player.units.forEach(unit => {
                    const div = document.createElement('div');
                    div.className = 'unit-item';
                    if (unit.currentWounds <= 0) {
                        div.classList.add('dead');
                    }
                    div.innerHTML = `
                        <span>${unit.type === 'HQ' ? '★ ' : ''}${unit.name}</span>
                        <span>${unit.currentWounds}/${unit.wounds} W</span>
                    `;
                    unitsList.appendChild(div);
                });
            }
        }
    },

    // Update battlefield display
    updateBattlefieldDisplay() {
        document.querySelectorAll('.cell').forEach((cell, index) => {
            const row = Math.floor(index / GameConfig.GRID_SIZE);
            const col = index % GameConfig.GRID_SIZE;
            const unit = this.state.battlefield[row][col];

            cell.textContent = '';
            cell.className = 'cell';

            if (this.isTerrain(row, col)) {
                cell.classList.add('terrain');
            }

            if (unit) {
                cell.classList.add(`player${unit.player}`);
                cell.textContent = unit.type === 'HQ' ? '⭐' : '⚔️';
            }
        });

        this.highlightSelectedUnit();
        this.highlightValidMoves();
        this.highlightValidTargets();
    },

    // Roll dice
    rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    },

    // Show dice results
    showDiceResults(rolls) {
        const results = document.getElementById('diceResults');
        results.innerHTML = rolls.map(r => `🎲 ${r}`).join(' ');
    },

    // Log message
    log(message, type = '') {
        const log = document.getElementById('logContainer');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${this.state.turn}] ${message}`;
        log.insertBefore(entry, log.firstChild);
    }
};
