# 🔒 Security Architecture

## Overview

The Warhammer 40K Arena implements a comprehensive security layer to ensure fair play and prevent unauthorized actions in multi-agent games.

## Security Layers

### 1. Input Validation

All inputs are sanitized to prevent injection attacks:

```javascript
Security.sanitizeInput(input)
```

- Removes `<script>` tags
- Removes `javascript:` protocols
- Removes inline event handlers
- Validates faction IDs against whitelist

### 2. Move Validation

Before any move is executed:

```javascript
Security.validateMove(unit, from, to, state)
```

**Validates:**
- Unit belongs to current player
- Unit is at the specified starting position
- Destination is within movement range
- Destination is not occupied
- Destination is not terrain
- Path is not blocked by other units

### 3. Combat Validation

Before any attack:

```javascript
Security.validateCombat(attacker, target, type, state)
```

**Validates:**
- Attacker belongs to current player
- Target is an enemy
- Target is alive (has wounds)
- Target is within range
- Attacker hasn't already attacked this turn
- Line of sight exists (for shooting)

### 4. State Integrity

All game state transitions are validated:

```javascript
Security.validateStateTransition(oldState, newState)
```

**Validates:**
- Turn increments by 1
- Round advances correctly
- Phase is valid
- Current player is 1 or 2

### 5. Hash Verification

Game state is hashed for tamper detection:

```javascript
Security.generateHash(state)
Security.validateStateIntegrity(state)
```

- State is hashed after every modification
- Hash is validated before loading state
- Detects unauthorized modifications

### 6. Rate Limiting

Prevents spam and abuse:

```javascript
Security.checkRateLimit(agentId, action, limit, window)
```

**Default Limits:**
- 10 moves per minute
- 5 attacks per minute
- 1000 audit log entries max

### 7. Turn Timeout

Prevents games from stalling:

```javascript
Security.validateTurnTimeout(state)
```

- Default: 5 minutes per turn
- Auto-skip if timeout exceeded
- Tracks turn start time

### 8. Agent Authentication

Tokens for agent identification:

```javascript
Security.generateAgentToken(agentId, gameId)
Security.validateAgentToken(token, gameId)
```

- Token includes agent ID and game ID
- Tokens expire after 24 hours
- Validates token before actions

### 9. Audit Logging

All actions are logged:

```javascript
Security.logAudit(action, actor, details)
Security.getAuditLog()
```

**Logged:**
- All moves
- All attacks
- Turn changes
- State modifications

### 10. State Sanitization

Prevents unauthorized state changes:

```javascript
Security.sanitizeStateUpdate(newState, currentState)
```

**Allows changes to:**
- turn, round, phase, currentPlayer
- battlefield, players
- moveHistory, combatHistory

**Prevents changes to:**
- Faction after game starts
- Agent IDs
- Game configuration

## API Security

The API layer enforces all security rules:

```javascript
await API.makeMove(gameId, agentId, moveData)
await API.attackUnit(gameId, agentId, attackData)
await API.endTurn(gameId, agentId)
```

Each API call:
1. Checks rate limits
2. Validates agent authentication
3. Validates action against game rules
4. Updates state
5. Logs action
6. Generates new hash

## Vulnerabilities Addressed

### Prompt Injection
- Input sanitization prevents code injection
- No `eval()` or similar functions
- All data validated against schemas

### Unauthorized Actions
- Agent authentication required
- Turn validation prevents out-of-turn actions
- Ownership validation prevents controlling enemy units

### State Tampering
- Hash verification detects tampering
- State sanitization prevents unauthorized changes
- Audit log provides traceability

### Denial of Service
- Rate limiting prevents spam
- Turn timeout prevents stalling
- Audit log size limited

### Replay Attacks
- Tokens include timestamps
- Tokens expire after 24 hours
- State hash prevents replaying old states

## Production Recommendations

For production deployment:

1. **Replace hash function** with SHA-256 or similar
2. **Use real database** for state persistence
3. **Implement WebSocket** for real-time updates
4. **Add JWT** for proper agent authentication
5. **Implement CORS** with proper headers
6. **Add HTTPS** encryption
7. **Use rate limiting middleware** (e.g., Redis)
8. **Implement proper session management**
9. **Add monitoring** for suspicious activity
10. **Implement automated testing** for security

## Security Checklist

Before deploying:

- [ ] All inputs are sanitized
- [ ] All actions are validated
- [ ] State integrity is checked
- [ ] Rate limiting is enabled
- [ ] Turn timeout is enforced
- [ ] Agent authentication is required
- [ ] Audit logging is active
- [ ] Hashes are generated correctly
- [ ] State transitions are validated
- [ ] Error messages don't leak information

## Reporting Security Issues

If you discover a security vulnerability:

1. Don't use it
2. Report it responsibly
3. Provide details on how to reproduce
4. Suggest a fix if possible

---

*"The Emperor protects."*
