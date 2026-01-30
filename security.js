// Warhammer 40K Arena - Security Layer
const Security = {
    // Simple hash function for state integrity (for demo - use SHA-256 in production)
    async generateHash(data) {
        const text = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    },

    // Validate state integrity
    async validateStateIntegrity(state) {
        const currentHash = await this.generateHash(state);
        return currentHash === state.stateHash;
    },

    // Sanitize input to prevent injection
    sanitizeInput(input) {
        // Remove potentially dangerous characters
        if (typeof input !== 'string') return input;

        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '');
    },

    // Validate faction selection
    validateFactionSelection(factionId) {
        const validFactions = Object.keys(Factions);
        return validFactions.includes(factionId);
    },

    // Validate unit ownership
    validateUnitOwnership(unit, playerNumber) {
        return unit.player === playerNumber;
    },

    // Validate move is legal
    validateMove(unit, from, to, state) {
        const errors = [];

        // Check: unit belongs to current player
        if (unit.player !== state.currentPlayer) {
            errors.push("Unit does not belong to current player");
        }

        // Check: unit is at from position
        if (unit.position.row !== from.row || unit.position.col !== from.col) {
            errors.push("Unit is not at the specified from position");
        }

        // Check: destination is within movement range
        const distance = Math.sqrt(
            Math.pow(to.row - from.row, 2) + Math.pow(to.col - from.col, 2)
        );
        const maxMove = unit.move / 2; // Simplified: 2" = 1 grid cell
        if (distance > maxMove) {
            errors.push(`Move distance ${distance.toFixed(2)} exceeds max ${maxMove}`);
        }

        // Check: destination is not occupied
        if (state.battlefield[to.row][to.col]) {
            errors.push("Destination is occupied");
        }

        // Check: destination is not terrain
        if (state.terrain.some(t => t.row === to.row && t.col === to.col)) {
            errors.push("Cannot move through terrain");
        }

        // Check: path is not blocked (simplified - just check adjacent cells)
        const dr = Math.sign(to.row - from.row);
        const dc = Math.sign(to.col - from.col);
        let r = from.row + dr;
        let c = from.col + dc;
        while (r !== to.row || c !== to.col) {
            if (state.battlefield[r][c]) {
                errors.push("Path is blocked");
                break;
            }
            if (r !== to.row) r += dr;
            if (c !== to.col) c += dc;
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    // Validate combat action
    validateCombat(attacker, target, type, state) {
        const errors = [];

        // Check: attacker belongs to current player
        if (attacker.player !== state.currentPlayer) {
            errors.push("Attacker does not belong to current player");
        }

        // Check: target is enemy
        if (target.player === attacker.player) {
            errors.push("Cannot attack own unit");
        }

        // Check: target is alive
        if (target.currentWounds <= 0) {
            errors.push("Target is already destroyed");
        }

        // Check: within range
        const distance = Math.sqrt(
            Math.pow(target.position.row - attacker.position.row, 2) +
            Math.pow(target.position.col - attacker.position.col, 2)
        );
        const range = type === 'shooting' ? 6 : 2; // Simplified ranges
        if (distance > range) {
            errors.push(`Target is out of range (${distance.toFixed(2)} > ${range})`);
        }

        // Check: attacker hasn't already attacked this turn
        if (attacker.hasAttacked) {
            errors.push("Unit has already attacked this turn");
        }

        // Check: line of sight for shooting
        if (type === 'shooting' && !this.hasLineOfSight(attacker, target, state)) {
            errors.push("No line of sight to target");
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    // Check line of sight
    hasLineOfSight(from, to, state) {
        const { row: r1, col: c1 } = from.position;
        const { row: r2, col: c2 } = to.position;

        const dr = Math.sign(r2 - r1);
        const dc = Math.sign(c2 - c1);

        let r = r1 + dr;
        let c = c1 + dc;

        while (r !== r2 || c !== c2) {
            if (state.terrain.some(t => t.row === r && t.col === c)) {
                return false;
            }
            if (r !== r2) r += dr;
            if (c !== c2) c += dc;
        }

        return true;
    },

    // Validate turn timeout
    validateTurnTimeout(state) {
        if (!state.turnStartedAt) return true;

        const elapsed = Date.now() - state.turnStartedAt;
        return elapsed < state.turnTimeout;
    },

    // Rate limiting (simple in-memory implementation)
    rateLimits: new Map(),

    checkRateLimit(agentId, action, limit = 10, window = 60000) {
        const key = `${agentId}:${action}`;
        const now = Date.now();
        const history = this.rateLimits.get(key) || [];

        // Remove old entries
        const recent = history.filter(t => now - t < window);

        if (recent.length >= limit) {
            return {
                allowed: false,
                resetAt: recent[0] + window
            };
        }

        recent.push(now);
        this.rateLimits.set(key, recent);

        return {
            allowed: true,
            remaining: limit - recent.length
        };
    },

    // Sanitize battle state update
    sanitizeStateUpdate(newState, currentState) {
        const sanitized = JSON.parse(JSON.stringify(currentState));

        // Only allow changes to specific fields
        const allowedFields = [
            'turn', 'round', 'phase', 'currentPlayer',
            'selectedUnit', 'validMoves', 'validTargets',
            'battlefield', 'players', 'moveHistory',
            'combatHistory', 'stateHash', 'lastUpdate',
            'turnStartedAt'
        ];

        allowedFields.forEach(field => {
            if (newState[field] !== undefined) {
                sanitized[field] = newState[field];
            }
        });

        // Validate players structure
        if (sanitized.players) {
            [1, 2].forEach(playerNum => {
                const player = sanitized.players[playerNum];
                if (player) {
                    // Don't allow changing faction after game starts
                    if (currentState.turn > 1 && player.faction !== currentState.players[playerNum].faction) {
                        player.faction = currentState.players[playerNum].faction;
                    }
                }
            });
        }

        return sanitized;
    },

    // Validate game state transition
    validateStateTransition(oldState, newState) {
        const errors = [];

        // Check: turn can only increase by 1
        if (newState.turn < oldState.turn || newState.turn > oldState.turn + 1) {
            errors.push(`Invalid turn transition: ${oldState.turn} -> ${newState.turn}`);
        }

        // Check: round can only increase when turn changes
        if (newState.turn > oldState.turn && newState.round < oldState.round) {
            errors.push(`Invalid round transition`);
        }

        // Check: phase must be valid
        const validPhases = ['deployment', 'movement', 'shooting', 'combat', 'morale'];
        if (!validPhases.includes(newState.phase)) {
            errors.push(`Invalid phase: ${newState.phase}`);
        }

        // Check: current player must be 1 or 2
        if (newState.currentPlayer !== 1 && newState.currentPlayer !== 2) {
            errors.push(`Invalid player: ${newState.currentPlayer}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    // Generate JWT-like token for agent authentication
    generateAgentToken(agentId, gameId) {
        const payload = {
            agentId,
            gameId,
            timestamp: Date.now()
        };
        const encoded = btoa(JSON.stringify(payload));
        return encoded;
    },

    // Validate agent token
    validateAgentToken(token, gameId) {
        try {
            const decoded = atob(token);
            const payload = JSON.parse(decoded);

            if (payload.gameId !== gameId) {
                return { valid: false, error: "Game ID mismatch" };
            }

            // Check token age (max 24 hours)
            if (Date.now() - payload.timestamp > 86400000) {
                return { valid: false, error: "Token expired" };
            }

            return { valid: true, agentId: payload.agentId };
        } catch (e) {
            return { valid: false, error: "Invalid token" };
        }
    },

    // Audit log
    auditLog: [],

    async logAudit(action, actor, details) {
        const entry = {
            timestamp: Date.now(),
            action,
            actor,
            details,
            hash: await this.generateHash({ timestamp: Date.now(), action, actor })
        };

        this.auditLog.push(entry);

        // Keep only last 1000 entries
        if (this.auditLog.length > 1000) {
            this.auditLog.shift();
        }

        return entry;
    },

    // Get audit log
    getAuditLog() {
        return [...this.auditLog];
    },

    // Clear audit log
    clearAuditLog() {
        this.auditLog = [];
    }
};
