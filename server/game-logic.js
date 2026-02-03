// Openhammer 40K - AI Agent Battle Arena - Game Logic Module
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

// Faction Categories
const FactionCategories = {
    SPACE_MARINES: {
        name: "Adeptus Astartes",
        description: "The Emperor's Finest - Genetically enhanced super soldiers"
    },
    CHAOS: {
        name: "Forces of Chaos",
        description: "Traitors and Daemons - Servants of the Dark Gods"
    },
    XENOS: {
        name: "Xenos Threat",
        description: "Alien races that threaten humanity's dominion"
    },
    IMPERIUM: {
        name: "Imperial Forces",
        description: "The countless armies of the God-Emperor"
    }
};

// Factions Data
const Factions = {
    // SPACE MARINES
    ultramarines: {
        name: "Ultramarines",
        category: "SPACE_MARINES",
        icon: "U",
        color: "#0047AB",
        bonus: "+1 to Hit in Shooting Phase",
        units: ["Tactical Squad", "Intercessors", "Assault Marines", "Terminators"],
        special: "Codex Astartes - Reroll 1s to Hit",
        battleCry: "Courage and Honour!"
    },
    bloodAngels: {
        name: "Blood Angels",
        category: "SPACE_MARINES",
        icon: "BA",
        color: "#DC143C",
        bonus: "+3\" Move, +1 Attack on Charge",
        units: ["Death Company", "Sanguinary Guard", "Assault Marines", "Terminators"],
        special: "Red Thirst - +1 to Wound in melee",
        battleCry: "By the Blood of Sanguinius!"
    },
    spaceWolves: {
        name: "Space Wolves",
        category: "SPACE_MARINES",
        icon: "SW",
        color: "#607D8B",
        bonus: "+1 Ld, Counter-Attack ability",
        units: ["Grey Hunters", "Blood Claws", "Wolf Guard", "Thunderwolf Cavalry"],
        special: "Saga of the Beast - +1 Attack per slain enemy",
        battleCry: "For Russ and the Allfather!"
    },
    darkAngels: {
        name: "Dark Angels",
        category: "SPACE_MARINES",
        icon: "DA",
        color: "#013220",
        bonus: "+1 Save vs. Psychic attacks",
        units: ["Deathwing", "Ravenwing", "Tactical Squad", "Terminators"],
        special: "Unforgiven - Never fail Morale",
        battleCry: "Repent! For tomorrow you die!"
    },
    imperialFists: {
        name: "Imperial Fists",
        category: "SPACE_MARINES",
        icon: "IF",
        color: "#FFD700",
        bonus: "+1 to Hit vs. Buildings, Ignore cover",
        units: ["Tactical Squad", "Terminators", "Centurions", "Vanguard Veterans"],
        special: "Siege Masters - Ignore cover saves",
        battleCry: "Primarch-Progenitor!"
    },
    salamanders: {
        name: "Salamanders",
        category: "SPACE_MARINES",
        icon: "SAL",
        color: "#228B22",
        bonus: "+1 to Wound vs. Monsters, Reroll flames",
        units: ["Tactical Squad", "Assault Marines", "Terminators", "Aggressors"],
        special: "Promethean Cult - Reroll one wound per attack",
        battleCry: "Into the fires of battle!"
    },

    // CHAOS
    worldEaters: {
        name: "World Eaters",
        category: "CHAOS",
        icon: "WE",
        color: "#8B0000",
        bonus: "+2 Attacks, -1 Ld",
        units: ["Khorne Berzerkers", "Eightbound", "Chaos Terminators", "Jakhals"],
        special: "Butcher's Nails - +1 to Hit, cannot retreat",
        battleCry: "Blood for the Blood God!"
    },
    deathGuard: {
        name: "Death Guard",
        category: "CHAOS",
        icon: "DG",
        color: "#556B2F",
        bonus: "+1 Toughness, Disgustingly Resilient (5+)",
        units: ["Plague Marines", "Poxwalkers", "Blightlord Terminators", "Mortarion"],
        special: "Contagion - Reduce enemy toughness by 1",
        battleCry: "Let the galaxy rot!"
    },
    thousandSons: {
        name: "Thousand Sons",
        category: "CHAOS",
        icon: "TS",
        color: "#4169E1",
        bonus: "Psyker level 2, +1 to Cast",
        units: ["Rubric Marines", "Scarab Occult", "Tzaangors", "Magnus the Red"],
        special: "All is Dust - +1 Save vs. Damage 1",
        battleCry: "All is dust!"
    },
    emperorsChildren: {
        name: "Emperor's Children",
        category: "CHAOS",
        icon: "EC",
        color: "#9932CC",
        bonus: "+1 to Hit in Combat, Always fight first",
        units: ["Noise Marines", "Lucius the Eternal", "Chaos Terminators", "Daemon Prince"],
        special: "Excess - Extra attack on 6 to hit",
        battleCry: "Children of the Emperor!"
    },
    blackLegion: {
        name: "Black Legion",
        category: "CHAOS",
        icon: "BL",
        color: "#1a1a1a",
        bonus: "+1 to All attacks when Abaddon is near",
        units: ["Chaos Marines", "Terminators", "Chosen", "Abaddon the Despoiler"],
        special: "Warmaster's Chosen - Reroll all 1s to Hit",
        battleCry: "Death to the False Emperor!"
    },
    chaosDaemons: {
        name: "Chaos Daemons",
        category: "CHAOS",
        icon: "CD",
        color: "#800080",
        bonus: "Daemonic Invulnerability (5+)",
        units: ["Bloodletters", "Plaguebearers", "Daemonettes", "Pink Horrors"],
        special: "Warp Surge - +1 Invuln until next turn",
        battleCry: "The Warp hungers!"
    },

    // XENOS
    orks: {
        name: "Orks",
        category: "XENOS",
        icon: "ORK",
        color: "#32CD32",
        bonus: "WAAAGH! +1 Attack on charge",
        units: ["Boyz", "Nobz", "Meganobz", "Warboss"],
        special: "Mob Rule - +1 Ld per 10 models",
        battleCry: "WAAAGH!"
    },
    eldar: {
        name: "Aeldari",
        category: "XENOS",
        icon: "AEL",
        color: "#E6E6FA",
        bonus: "+6\" Move, -1 to be Hit",
        units: ["Guardians", "Dire Avengers", "Howling Banshees", "Farseers"],
        special: "Battle Focus - Advance and Shoot/Charge",
        battleCry: "For the Craftworld!"
    },
    darkEldar: {
        name: "Drukhari",
        category: "XENOS",
        icon: "DRU",
        color: "#301934",
        bonus: "+3\" Move, +1 to Wound vs. Infantry",
        units: ["Kabalites", "Wyches", "Incubi", "Archons"],
        special: "Power from Pain - Gain bonuses as enemies die",
        battleCry: "Pain is your gift!"
    },
    tyranids: {
        name: "Tyranids",
        category: "XENOS",
        icon: "TYR",
        color: "#800080",
        bonus: "Synapse - Immune to morale nearby",
        units: ["Hormagaunts", "Genestealers", "Warriors", "Hive Tyrant"],
        special: "Shadow in the Warp - -2 to enemy psychic",
        battleCry: "*Chittering screech*"
    },
    necrons: {
        name: "Necrons",
        category: "XENOS",
        icon: "NEC",
        color: "#2F4F4F",
        bonus: "Reanimation Protocols (5+)",
        units: ["Warriors", "Immortals", "Lychguard", "Overlord"],
        special: "Living Metal - Restore D3 wounds per turn",
        battleCry: "We are eternal."
    },
    tau: {
        name: "T'au Empire",
        category: "XENOS",
        icon: "TAU",
        color: "#F5DEB3",
        bonus: "+6\" Range, Markerlights",
        units: ["Fire Warriors", "Crisis Suits", "Stealth Suits", "Commanders"],
        special: "For the Greater Good - Overwatch on 5+",
        battleCry: "For the Greater Good!"
    },

    // IMPERIUM
    astraMilitarum: {
        name: "Astra Militarum",
        category: "IMPERIUM",
        icon: "AM",
        color: "#8B8B00",
        bonus: "Orders - Issue commands to units",
        units: ["Guardsmen", "Command Squad", "Heavy Weapons", "Leman Russ"],
        special: "Hammer of the Emperor - Reroll 1s in deployment",
        battleCry: "For the Emperor!"
    },
    adeptusCustodes: {
        name: "Adeptus Custodes",
        category: "IMPERIUM",
        icon: "AC",
        color: "#FFD700",
        bonus: "2+ Save, 4+ Invuln, +1 to Hit",
        units: ["Custodian Guard", "Allarus Terminators", "Vertus Praetors", "Shield-Captain"],
        special: "Aegis of the Emperor - 4+ vs. Mortals",
        battleCry: "We are His instruments!"
    },
    sistersBattle: {
        name: "Adepta Sororitas",
        category: "IMPERIUM",
        icon: "SoB",
        color: "#1a1a1a",
        bonus: "Acts of Faith - 1 per turn miracle",
        units: ["Battle Sisters", "Retributors", "Seraphim", "Canoness"],
        special: "Shield of Faith - 6+ Invuln",
        battleCry: "Cleanse! Purge! Kill!"
    },
    adeptusMechanicus: {
        name: "Adeptus Mechanicus",
        category: "IMPERIUM",
        icon: "AdM",
        color: "#8B0000",
        bonus: "Canticles of the Omnissiah",
        units: ["Skitarii Rangers", "Sicarians", "Kastelan Robots", "Tech-Priest"],
        special: "Doctrina Imperatives - +1 to Hit/Sv",
        battleCry: "The Omnissiah protects!"
    },
    greyKnights: {
        name: "Grey Knights",
        category: "IMPERIUM",
        icon: "GK",
        color: "#C0C0C0",
        bonus: "All Psykers, +1 to Deny",
        units: ["Strike Squad", "Terminators", "Paladins", "Grand Master"],
        special: "Daemon Hunters - +1 to Wound Daemons",
        battleCry: "We are the Hammer!"
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
    ],
    imperiumHeroes: [
        { name: "Company Commander", wounds: 4, move: 6, toughness: 3, save: 5, leadership: 8, attacks: 3, type: "HQ" },
        { name: "Commissar", wounds: 4, move: 6, toughness: 3, save: 5, leadership: 9, attacks: 3, type: "HQ" }
    ],
    imperiumUnits: [
        { name: "Guardsman", wounds: 1, move: 6, toughness: 3, save: 5, leadership: 6, attacks: 1, type: "Troop" },
        { name: "Tempestus Scion", wounds: 1, move: 6, toughness: 3, save: 4, leadership: 7, attacks: 2, type: "Elite" },
        { name: "Ogryn", wounds: 3, move: 6, toughness: 5, save: 5, leadership: 6, attacks: 3, type: "Elite" }
    ],
    custodesHeroes: [
        { name: "Shield-Captain", wounds: 7, move: 6, toughness: 5, save: 2, leadership: 10, attacks: 5, type: "HQ" }
    ],
    custodesUnits: [
        { name: "Custodian Guard", wounds: 3, move: 6, toughness: 5, save: 2, leadership: 9, attacks: 4, type: "Troop" },
        { name: "Allarus Terminator", wounds: 4, move: 5, toughness: 5, save: 2, leadership: 9, attacks: 4, type: "Elite" }
    ]
};

// Map factions to their unit templates
function getFactionUnits(factionId) {
    const faction = Factions[factionId];
    if (!faction) {
        return { heroes: Characters.spaceMarineHeroes, units: Characters.spaceMarineUnits };
    }

    const categoryMap = {
        SPACE_MARINES: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
        CHAOS: { heroes: 'chaosHeroes', units: 'chaosUnits' },
        XENOS: {
            orks: { heroes: 'orkHeroes', units: 'orkUnits' },
            eldar: { heroes: 'eldarHeroes', units: 'eldarUnits' },
            darkEldar: { heroes: 'eldarHeroes', units: 'eldarUnits' },
            tyranids: { heroes: 'tyranidHeroes', units: 'tyranidUnits' },
            necrons: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
            tau: { heroes: 'eldarHeroes', units: 'eldarUnits' }
        },
        IMPERIUM: {
            astraMilitarum: { heroes: 'imperiumHeroes', units: 'imperiumUnits' },
            adeptusCustodes: { heroes: 'custodesHeroes', units: 'custodesUnits' },
            sistersBattle: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
            adeptusMechanicus: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' },
            greyKnights: { heroes: 'spaceMarineHeroes', units: 'spaceMarineUnits' }
        }
    };

    let mapping;

    if (faction.category === 'XENOS' && categoryMap.XENOS[factionId]) {
        mapping = categoryMap.XENOS[factionId];
    } else if (faction.category === 'IMPERIUM' && categoryMap.IMPERIUM[factionId]) {
        mapping = categoryMap.IMPERIUM[factionId];
    } else {
        mapping = categoryMap[faction.category] || categoryMap.SPACE_MARINES;
    }

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
        phase: 'movement',
        currentPlayer: 1,
        maxRounds: GameConfig.MAX_ROUNDS,
        players: {
            1: {
                faction: player1Faction,
                factionName: Factions[player1Faction]?.name || player1Faction,
                agentId: player1AgentId,
                units: player1Units,
                vp: 0
            },
            2: {
                faction: player2Faction,
                factionName: Factions[player2Faction]?.name || player2Faction,
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
    if (heroes && heroes.length > 0) {
        const hero = { ...heroes[0] };
        hero.id = `p${playerId}-${hero.name.toLowerCase().replace(/\s/g, '-')}-0`;
        hero.player = playerId;
        hero.currentWounds = hero.wounds;
        hero.hasMoved = false;
        hero.hasAttacked = false;
        hero.position = null;
        playerUnits.push(hero);
    }

    // Add 3 regular units
    if (units && units.length > 0) {
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
    FactionCategories,
    Factions,
    Characters,
    createGameState,
    getFactionUnits
};
