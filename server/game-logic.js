// Warhammer 40K Battle Arena - Game Logic Module
// Shared game configuration and state management for server

// Game Configuration Constants
const GameConfig = {
    GRID_SIZE: 10,
    HIT_THRESHOLD: 3,
    WOUND_THRESHOLD: 4,
    SAVE_THRESHOLD: 4,
    MIN_SAVE_THRESHOLD: 2,
    MOVE_SCALE: 2,
    SHOOTING_RANGE: 6,
    MELEE_RANGE: 2,
    VP_UNIT_DESTROYED: 1,
    VP_HQ_DESTROYED: 2,
    MAX_ROUNDS: 5,
    TURN_TIMEOUT: 300000,
    MOVES_PER_MINUTE: 10,
    ATTACKS_PER_MINUTE: 5
};

// Factions Data
const Factions = {
    ultramarines: {
        name: "Ultramarines",
        icon: "U",
        color: "#4169E1",
        bonus: "+1 to Hit in Shooting Phase",
        units: ["Tactical Squad", "Intercessors", "Assault Marines", "Terminators"],
        special: "The Glorious Protectors - Reroll 1s to Hit"
    },
    bloodAngels: {
        name: "Blood Angels",
        icon: "B",
        color: "#DC143C",
        bonus: "+3\" Move, +1 Attack on Charge",
        units: ["Death Company", "Sanguinary Guard", "Assault Marines", "Terminators"],
        special: "Red Thirst - +1 to Wound Rolls"
    },
    spaceWolves: {
        name: "Space Wolves",
        icon: "W",
        color: "#808080",
        bonus: "+1 Ld, Counter-Attack ability",
        units: ["Grey Hunters", "Blood Claws", "Wolf Guard", "Thunderwolf Cavalry"],
        special: "Saga of the Warrior Born - +1 Attack for each slain enemy"
    },
    darkAngels: {
        name: "Dark Angels",
        icon: "D",
        color: "#2F4F4F",
        bonus: "+1 Save vs. Psychic attacks",
        units: ["Deathwing", "Ravenwing", "Tactical Squad", "Terminators"],
        special: "Unforgiven - Reroll Morale tests"
    },
    imperialFists: {
        name: "Imperial Fists",
        icon: "I",
        color: "#FFD700",
        bonus: "+1 to Hit in Shooting vs. Buildings",
        units: ["Tactical Squad", "Terminators", "Centurions", "Vanguard Veterans"],
        special: "Stone and Steel - Ignore cover bonuses"
    },
    salamanders: {
        name: "Salamanders",
        icon: "S",
        color: "#228B22",
        bonus: "+1 to Hit in Melee, +1 Wound vs. Monsters",
        units: ["Tactical Squad", "Assault Marines", "Terminators", "Vulkan He'Stan"],
        special: "Promethean Cult - Reroll one wound roll per attack"
    },
    ironHands: {
        name: "Iron Hands",
        icon: "H",
        color: "#708090",
        bonus: "6+ Feel No Pain save",
        units: ["Tactical Squad", "Dreadnoughts", "Terminators", "Techmarines"],
        special: "The Flesh is Weak - Ignore wounds on 5+"
    },
    worldEaters: {
        name: "World Eaters",
        icon: "X",
        color: "#8B0000",
        bonus: "+1 Attack, -1 Ld",
        units: ["Berserkers", "Khorne Berzerkers", "Chaos Terminators", "Defilers"],
        special: "Butcher Nails - +1 to Hit in melee, cannot retreat"
    },
    deathGuard: {
        name: "Death Guard",
        icon: "G",
        color: "#556B2F",
        bonus: "+1 Toughness, Disgustingly Resilient (5+)",
        units: ["Plague Marines", "Poxwalkers", "Blight Lords", "Mortarion"],
        special: "Contagion - Reduce enemy toughness by 1"
    },
    thousandSons: {
        name: "Thousand Sons",
        icon: "T",
        color: "#4B0082",
        bonus: "Psyker level 2, +1 to Cast",
        units: ["Rubric Marines", "Scarab Occult", "Tzaangors", "Magnus the Red"],
        special: "All is Dust - +1 Save vs. Dmg 1"
    },
    emperorsChildren: {
        name: "Emperor's Children",
        icon: "E",
        color: "#FF69B4",
        bonus: "+1 Advance, +1 to Hit in Combat Phase",
        units: ["Noise Marines", "Phoenicians", "Chaos Terminators", "Lucius the Eternal"],
        special: "Excess of Pain - Extra attack on 6 to hit"
    },
    orks: {
        name: "Orks",
        icon: "O",
        color: "#32CD32",
        bonus: "WAAAGH! +1 Attack on charge",
        units: ["Boyz", "Nobz", "Gretchin", "Warboss"],
        special: "Mob Rule - +1 Ld for every 10 models"
    },
    eldar: {
        name: "Eldar",
        icon: "L",
        color: "#FFD700",
        bonus: "+6\" Move, -1 to be Hit",
        units: ["Guardians", "Dire Avengers", "Howling Banshees", "Farseers"],
        special: "Battle Focus - Advance and Shoot/Charge"
    },
    darkEldar: {
        name: "Dark Eldar",
        icon: "K",
        color: "#4B0082",
        bonus: "+3\" Move, +1 to Wound vs. <10 W",
        units: ["Kabalites", "Wyches", "Incubi", "Archons"],
        special: "Power from Pain - Gain bonuses as units die"
    },
    tyranids: {
        name: "Tyranids",
        icon: "Y",
        color: "#8B4513",
        bonus: "Synapse - Immune to morale nearby",
        units: ["Hormagaunts", "Genestealers", "Warriors", "Hive Tyrant"],
        special: "Shadow in the Warp - -1 to enemy psychic tests"
    },
    necrons: {
        name: "Necrons",
        icon: "N",
        color: "#708090",
        bonus: "Reanimation Protocols (5+)",
        units: ["Warriors", "Immortals", "Lychguard", "Necron Overlord"],
        special: "Living Metal - Restore D3 wounds per turn"
    },
    tau: {
        name: "Tau Empire",
        icon: "A",
        color: "#00CED1",
        bonus: "+6\" Range, Markerlights",
        units: ["Fire Warriors", "Crisis Suits", "Stealth Suits", "Commanders"],
        special: "For the Greater Good - Overwatch on 5+"
    },
    imperialGuard: {
        name: "Imperial Guard",
        icon: "R",
        color: "#F5F5DC",
        bonus: "Orders - Issue commands to units",
        units: ["Guardsmen", "Command Squad", "Heavy Weapons", "Leman Russ"],
        special: "Sentinels of Terra - Reroll 1s to Hit in own deployment"
    },
    chaosDaemons: {
        name: "Chaos Daemons",
        icon: "C",
        color: "#800080",
        bonus: "Daemonic Invulnerability (5+)",
        units: ["Bloodletters", "Plaguebearers", "Daemonettes", "Horrors"],
        special: "Warp Surge - +1 Save until next turn"
    }
};

// Character Templates
const Characters = {
    // Generic templates for all factions
    spaceMarineHeroes: [
        { name: "Captain", wounds: 6, move: 6, toughness: 4, save: 3, leadership: 9, attacks: 4, type: "HQ" },
        { name: "Librarian", wounds: 5, move: 6, toughness: 4, save: 3, leadership: 9, attacks: 3, type: "HQ" }
    ],
    spaceMarineUnits: [
        { name: "Tactical Marine", wounds: 2, move: 6, toughness: 4, save: 3, leadership: 7, attacks: 2, type: "Troop" },
        { name: "Assault Marine", wounds: 2, move: 12, toughness: 4, save: 3, leadership: 7, attacks: 3, type: "FastAttack" },
        { name: "Terminator", wounds: 3, move: 5, toughness: 4, save: 2, leadership: 8, attacks: 3, type: "Elite" }
    ],
    orkHeroes: [
        { name: "Warboss", wounds: 7, move: 5, toughness: 5, save: 4, leadership: 8, attacks: 5, type: "HQ" },
        { name: "Weirdboy", wounds: 5, move: 5, toughness: 4, save: 5, leadership: 7, attacks: 2, type: "HQ" }
    ],
    orkUnits: [
        { name: "Ork Boy", wounds: 1, move: 5, toughness: 4, save: 6, leadership: 6, attacks: 2, type: "Troop" },
        { name: "Nob", wounds: 2, move: 5, toughness: 4, save: 4, leadership: 7, attacks: 3, type: "Elite" },
        { name: "Stormboy", wounds: 1, move: 12, toughness: 4, save: 6, leadership: 6, attacks: 2, type: "FastAttack" }
    ],
    tyranidHeroes: [
        { name: "Hive Tyrant", wounds: 10, move: 8, toughness: 6, save: 3, leadership: 10, attacks: 5, type: "HQ" },
        { name: "Broodlord", wounds: 6, move: 8, toughness: 5, save: 4, leadership: 9, attacks: 4, type: "HQ" }
    ],
    tyranidUnits: [
        { name: "Hormagaunt", wounds: 1, move: 8, toughness: 3, save: 6, leadership: 5, attacks: 2, type: "Troop" },
        { name: "Genestealer", wounds: 1, move: 8, toughness: 4, save: 5, leadership: 6, attacks: 4, type: "Elite" },
        { name: "Warrior", wounds: 3, move: 6, toughness: 4, save: 4, leadership: 8, attacks: 3, type: "Troop" }
    ],
    chaosHeroes: [
        { name: "Chaos Lord", wounds: 6, move: 6, toughness: 4, save: 3, leadership: 9, attacks: 5, type: "HQ" },
        { name: "Sorcerer", wounds: 5, move: 6, toughness: 4, save: 3, leadership: 9, attacks: 3, type: "HQ" }
    ],
    chaosUnits: [
        { name: "Chaos Marine", wounds: 2, move: 6, toughness: 4, save: 3, leadership: 7, attacks: 2, type: "Troop" },
        { name: "Berserker", wounds: 2, move: 6, toughness: 4, save: 3, leadership: 7, attacks: 4, type: "Elite" },
        { name: "Possessed", wounds: 2, move: 7, toughness: 4, save: 3, leadership: 8, attacks: 4, type: "Elite" }
    ],
    eldarHeroes: [
        { name: "Farseer", wounds: 5, move: 7, toughness: 3, save: 4, leadership: 9, attacks: 2, type: "HQ" },
        { name: "Autarch", wounds: 5, move: 7, toughness: 3, save: 3, leadership: 9, attacks: 4, type: "HQ" }
    ],
    eldarUnits: [
        { name: "Guardian", wounds: 1, move: 7, toughness: 3, save: 5, leadership: 7, attacks: 1, type: "Troop" },
        { name: "Dire Avenger", wounds: 1, move: 7, toughness: 3, save: 4, leadership: 8, attacks: 2, type: "Troop" },
        { name: "Howling Banshee", wounds: 1, move: 8, toughness: 3, save: 4, leadership: 8, attacks: 3, type: "Elite" }
    ]
};

// Map factions to their unit templates
function getFactionUnits(factionId) {
    const factionMap = {
        ultramarines: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
        bloodAngels: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
        spaceWolves: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
        darkAngels: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
        imperialFists: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
        salamanders: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
        ironHands: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
        worldEaters: { heroes: 'chaosHeroes', units: 'chaosUnits' },
        deathGuard: { heroes: 'chaosHeroes', units: 'chaosUnits' },
        thousandSons: { heroes: 'chaosHeroes', units: 'chaosUnits' },
        emperorsChildren: { heroes: 'chaosHeroes', units: 'chaosUnits' },
        orks: { heroes: 'orkHeroes', units: 'orkUnits' },
        eldar: { heroes: 'eldarHeroes', units: 'eldarUnits' },
        darkEldar: { heroes: 'eldarHeroes', units: 'eldarUnits' },
        tyranids: { heroes: 'tyranidHeroes', units: 'tyranidUnits' },
        necrons: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' }, // Use SM stats as placeholder
        tau: { heroes: 'eldarHeroes', units: 'eldarUnits' }, // Use Eldar stats as placeholder
        imperialGuard: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
        chaosDaemons: { heroes: 'chaosHeroes', units: 'chaosUnits' }
    };

    const mapping = factionMap[factionId] || factionMap.ultramarines;
    return {
        heroes: Characters[mapping.heroes],
        units: Characters[mapping.units]
    };
}

// Create initial game state
function createGameState(gameId, player1Faction, player2Faction, player1AgentId, player2AgentId) {
    const gridSize = GameConfig.GRID_SIZE;

    // Create empty battlefield
    const battlefield = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));

    // Create terrain
    const terrain = [
        { row: 2, col: 4 },
        { row: 3, col: 5 },
        { row: 7, col: 2 },
        { row: 6, col: 7 }
    ];

    // Create units for both players
    const player1Units = createUnitsForPlayer(1, player1Faction);
    const player2Units = createUnitsForPlayer(2, player2Faction);

    // Deploy units on battlefield
    deployUnits(battlefield, player1Units, 1, gridSize);
    deployUnits(battlefield, player2Units, 2, gridSize);

    return {
        gameId,
        turn: 1,
        round: 1,
        phase: 'movement', // Start in movement (skip deployment for bots)
        currentPlayer: 1,
        maxRounds: GameConfig.MAX_ROUNDS,
        players: {
            1: {
                faction: player1Faction,
                agentId: player1AgentId,
                units: player1Units,
                vp: 0
            },
            2: {
                faction: player2Faction,
                agentId: player2AgentId,
                units: player2Units,
                vp: 0
            }
        },
        battlefield,
        terrain,
        lastUpdate: Date.now()
    };
}

function createUnitsForPlayer(playerId, factionId) {
    const { heroes, units } = getFactionUnits(factionId);
    const playerUnits = [];

    // Add 1 HQ
    const hero = { ...heroes[0] };
    hero.id = `p${playerId}-${hero.name.toLowerCase().replace(/\s/g, '-')}-0`;
    hero.player = playerId;
    hero.currentWounds = hero.wounds;
    hero.hasMoved = false;
    hero.hasAttacked = false;
    hero.position = null;
    playerUnits.push(hero);

    // Add 3 regular units
    for (let i = 0; i < 3; i++) {
        const template = units[i % units.length];
        const unit = { ...template };
        unit.id = `p${playerId}-${unit.name.toLowerCase().replace(/\s/g, '-')}-${i}`;
        unit.player = playerId;
        unit.currentWounds = unit.wounds;
        unit.hasMoved = false;
        unit.hasAttacked = false;
        unit.position = null;
        playerUnits.push(unit);
    }

    return playerUnits;
}

function deployUnits(battlefield, units, playerId, gridSize) {
    const col = playerId === 1 ? 0 : gridSize - 1;

    units.forEach((unit, index) => {
        const row = 2 + (index % 6);
        if (row < gridSize && !battlefield[row][col]) {
            battlefield[row][col] = unit;
            unit.position = { row, col };
        }
    });
}

module.exports = {
    GameConfig,
    Factions,
    Characters,
    createGameState,
    getFactionUnits
};
