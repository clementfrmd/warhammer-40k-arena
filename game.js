// Warhammer 40K Battle Arena - Core Game Logic
const Game = {
    state: {
        turn: 1,
        round: 1,
        phase: 'deployment', // deployment, movement, shooting, combat, morale
        currentPlayer: 1,
        maxRounds: 5,
        players: {
            1: { faction: null, units: [], vp: 0 },
            2: { faction: null, units: [], vp: 0 }
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
        this.log("Welcome to the Warhammer 40K Battle Arena! ⚔️");
    },

    // Setup 10x10 battlefield
    setupBattlefield() {
        const grid = document.getElementById('battlefieldGrid');
        grid.innerHTML = '';
        this.state.battlefield = [];

        for (let row = 0; row < 10; row++) {
            this.state.battlefield[row] = [];
            for (let col = 0; col < 10; col++) {
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
        const index = row * 10 + col;
        const cell = document.querySelector(`.grid .cell:nth-child(${index + 1})`);
        if (cell) {
            cell.classList.add('terrain');
            this.state.terrain.push({ row, col });
        }
    },

    // Show faction selection modal
    showFactionSelection() {
        const modal = document.getElementById('setupModal');
        const selection = document.getElementById('factionSelection');
        selection.innerHTML = '';

        const factions = getAllFactions();
        factions.forEach(faction => {
            const div = document.createElement('div');
            div.className = 'faction-option';
            div.onclick = () => this.selectFaction(faction.id, div);
            div.innerHTML = `
                <h4>${faction.icon} ${faction.name}</h4>
                <p>${faction.bonus}</p>
            `;
            selection.appendChild(div);
        });

        modal.style.display = 'block';
    },

    // Select faction
    selectFaction(factionId, element) {
        // Remove previous selection
        document.querySelectorAll('.faction-option').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');

        if (!this.state.players[1].faction) {
            this.state.players[1].faction = factionId;
            this.log(`Player 1 selects ${Factions[factionId].name}!`);
        } else if (!this.state.players[2].faction) {
            this.state.players[2].faction = factionId;
            this.log(`Player 2 selects ${Factions[factionId].name}!`);
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

        // If selecting a unit
        if (clickedCell && clickedCell.player === this.state.currentPlayer) {
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
            const index = row * 10 + col;
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
        const moveRange = this.state.selectedUnit.move / 2; // Simplified: 2" = 1 grid cell

        for (let r = Math.max(0, row - moveRange); r <= Math.min(9, row + moveRange); r++) {
            for (let c = Math.max(0, col - moveRange); c <= Math.min(9, col + moveRange); c++) {
                if (!this.state.battlefield[r][c] && !this.isTerrain(r, c)) {
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
        const range = this.state.phase === 'shooting' ? 6 : 2; // Simplified ranges

        for (let r = Math.max(0, row - range); r <= Math.min(9, row + range); r++) {
            for (let c = Math.max(0, col - range); c <= Math.min(9, col + range); c++) {
                const target = this.state.battlefield[r][c];
                if (target && target.player !== this.state.currentPlayer) {
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
            const index = row * 10 + col;
            const cell = document.querySelector(`.grid .cell:nth-child(${index + 1})`);
            if (cell) cell.classList.add('valid-move');
        });
    },

    // Highlight valid targets
    highlightValidTargets() {
        this.state.validTargets.forEach(({ row, col }) => {
            const index = row * 10 + col;
            const cell = document.querySelector(`.grid .cell:nth-child(${index + 1})`);
            if (cell) cell.classList.add('valid-target');
        });
    },

    // Move unit
    moveUnit(row, col) {
        const unit = this.state.selectedUnit;
        const { row: oldRow, col: oldCol } = unit.position;

        // Update battlefield
        this.state.battlefield[oldRow][oldCol] = null;
        this.state.battlefield[row][col] = unit;
        unit.position = { row, col };

        this.log(`${unit.name} moves!`, 'movement');
        this.deselectUnit();
        this.updateBattlefieldDisplay();
    },

    // Action: Move
    actionMove() {
        if (this.state.phase !== 'movement') {
            alert('Not in movement phase!');
            return;
        }
        this.calculateValidMoves();
        this.calculateValidTargets();
    },

    // Action: Shoot
    actionShoot() {
        if (this.state.phase !== 'shooting') {
            alert('Not in shooting phase!');
            return;
        }
        this.calculateValidTargets();
    },

    // Action: Charge
    actionCharge() {
        if (this.state.phase !== 'movement') {
            alert('Charge only in movement phase!');
            return;
        }
        // Simplified: Charge is like move but to enemy
        this.state.phase = 'combat';
        this.calculateValidTargets();
        this.updateTurnIndicator();
    },

    // Attack unit
    attackUnit(row, col) {
        const attacker = this.state.selectedUnit;
        const defender = this.state.battlefield[row][col];

        if (!attacker || !defender) return;

        // Roll to hit
        const hitRoll = this.rollDice();
        const hitSuccess = hitRoll >= 3; // Simplified BS 4+

        if (hitSuccess) {
            // Roll to wound
            const woundRoll = this.rollDice();
            const woundSuccess = woundRoll >= 4; // Simplified

            if (woundSuccess) {
                // Roll save
                const saveRoll = this.rollDice();
                const saveSuccess = saveRoll >= 4; // Simplified 4+ save

                if (!saveSuccess) {
                    // Deal damage
                    const damage = this.rollDice();
                    defender.currentWounds -= damage;

                    this.log(`${attacker.name} hits ${defender.name} for ${damage} damage!`, 'combat');
                    this.showDiceResults([hitRoll, woundRoll, saveRoll, damage]);

                    // Check if unit destroyed
                    if (defender.currentWounds <= 0) {
                        this.destroyUnit(defender);
                    }
                } else {
                    this.log(`${defender.name} makes the save!`, 'combat');
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

        this.updateBattlefieldDisplay();
    },

    // Destroy unit
    destroyUnit(unit) {
        const { row, col } = unit.position;
        this.state.battlefield[row][col] = null;

        // Remove from player's units
        const player = this.state.players[unit.player];
        player.units = player.units.filter(u => u.id !== unit.id);
        player.vp += unit.type === 'HQ' ? 2 : 1;

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
    endTurn() {
        this.deselectUnit();

        // Switch player
        this.state.currentPlayer = this.state.currentPlayer === 1 ? 2 : 1;

        // Advance phase
        if (this.state.currentPlayer === 1) {
            this.advancePhase();
        }

        this.updateTurnIndicator();
        this.log(`Turn ${this.state.turn}: Player ${this.state.currentPlayer}'s turn`);
    },

    // Advance game phase
    advancePhase() {
        const phases = ['movement', 'shooting', 'combat', 'morale'];
        const currentIndex = phases.indexOf(this.state.phase);
        const nextIndex = (currentIndex + 1) % phases.length;

        if (nextIndex === 0) {
            this.state.turn++;
            this.state.phase = 'movement';
        } else {
            this.state.phase = phases[nextIndex];
        }

        // Advance round every 2 turns
        if (this.state.turn % 2 === 1) {
            this.state.round = Math.floor(this.state.turn / 2) + 1;
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
        document.getElementById('currentPlayer').textContent = `Player ${this.state.currentPlayer}`;
        document.getElementById('roundNumber').textContent = this.state.round;
    },

    // Update player panels
    updatePlayerPanels() {
        for (let i = 1; i <= 2; i++) {
            const player = this.state.players[i];
            const faction = Factions[player.faction];
            document.getElementById(`player${i}Faction`).textContent = faction ? `${faction.icon} ${faction.name}` : 'Not Selected';
            document.getElementById(`player${i}VP`).textContent = player.vp;

            const unitsList = document.getElementById(`player${i}Units`);
            unitsList.innerHTML = '';
            player.units.forEach(unit => {
                const div = document.createElement('div');
                div.className = 'unit-item';
                div.innerHTML = `<span>${unit.name}</span><span>${unit.currentWounds}/${unit.wounds} W</span>`;
                unitsList.appendChild(div);
            });
        }
    },

    // Update battlefield display
    updateBattlefieldDisplay() {
        document.querySelectorAll('.cell').forEach((cell, index) => {
            const row = Math.floor(index / 10);
            const col = index % 10;
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
