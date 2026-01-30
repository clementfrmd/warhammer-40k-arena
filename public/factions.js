// Warhammer 40K Factions Data
const Factions = {
    // SPACE MARINE CHAPTERS (LOYAL)
    ultramarines: {
        name: "Ultramarines",
        icon: "🔵",
        color: "#4169E1",
        bonus: "+1 to Hit in Shooting Phase",
        units: ["Tactical Squad", "Intercessors", "Assault Marines", "Terminators"],
        special: "The Glorious Protectors - Reroll 1s to Hit"
    },
    bloodAngels: {
        name: "Blood Angels",
        icon: "❤️",
        color: "#DC143C",
        bonus: "+3\" Move, +1 Attack on Charge",
        units: ["Death Company", "Sanguinary Guard", "Assault Marines", "Terminators"],
        special: "Red Thirst - +1 to Wound Rolls"
    },
    spaceWolves: {
        name: "Space Wolves",
        icon: "🐺",
        color: "#808080",
        bonus: "+1 Ld, Counter-Attack ability",
        units: ["Grey Hunters", "Blood Claws", "Wolf Guard", "Thunderwolf Cavalry"],
        special: "Saga of the Warrior Born - +1 Attack for each slain enemy"
    },
    darkAngels: {
        name: "Dark Angels",
        icon: "👻",
        color: "#2F4F4F",
        bonus: "+1 Save vs. Psychic attacks",
        units: ["Deathwing", "Ravenwing", "Tactical Squad", "Terminators"],
        special: "Unforgiven - Reroll Morale tests"
    },
    imperialFists: {
        name: "Imperial Fists",
        icon: "🏰",
        color: "#FFD700",
        bonus: "+1 to Hit in Shooting vs. Buildings",
        units: ["Tactical Squad", "Terminators", "Centurions", "Vanguard Veterans"],
        special: "Stone and Steel - Ignore cover bonuses"
    },
    salamanders: {
        name: "Salamanders",
        icon: "🔥",
        color: "#228B22",
        bonus: "+1 to Hit in Melee, +1 Wound vs. Monsters",
        units: ["Tactical Squad", "Assault Marines", "Terminators", "Vulkan He'Stan"],
        special: "Promethean Cult - Reroll one wound roll per attack"
    },
    ironHands: {
        name: "Iron Hands",
        icon: "⚙️",
        color: "#708090",
        bonus: "6+ Feel No Pain save",
        units: ["Tactical Squad", "Dreadnoughts", "Terminators", "Techmarines"],
        special: "The Flesh is Weak - Ignore wounds on 5+"
    },

    // TRAITOR LEGIONS (CHAOS)
    worldEaters: {
        name: "World Eaters",
        icon: "🩸",
        color: "#8B0000",
        bonus: "+1 Attack, -1 Ld",
        units: ["Berserkers", "Khorne Berzerkers", "Chaos Terminators", "Defilers"],
        special: "Butcher Nails - +1 to Hit in melee, cannot retreat"
    },
    deathGuard: {
        name: "Death Guard",
        icon: "☠️",
        color: "#556B2F",
        bonus: "+1 Toughness, Disgustingly Resilient (5+)",
        units: ["Plague Marines", "Poxwalkers", "Blight Lords", "Mortarion"],
        special: "Contagion - Reduce enemy toughness by 1"
    },
    thousandSons: {
        name: "Thousand Sons",
        icon: "✨",
        color: "#4B0082",
        bonus: "Psyker level 2, +1 to Cast",
        units: ["Rubric Marines", "Scarab Occult", "Tzaangors", "Magnus the Red"],
        special: "All is Dust - +1 Save vs. Dmg 1"
    },
    emperorsChildren: {
        icon: "🎭",
        name: "Emperor's Children",
        color: "#FF69B4",
        bonus: "+1 Advance, +1 to Hit in Combat Phase",
        units: ["Noise Marines", "Phoenicians", "Chaos Terminators", "Lucius the Eternal"],
        special: "Excess of Pain - Extra attack on 6 to hit"
    },

    // XENOS
    orks: {
        name: "Orks",
        icon: "🟢",
        color: "#32CD32",
        bonus: "WAAAGH! +1 Attack on charge",
        units: ["Boyz", "Nobz", "Gretchin", "Warboss"],
        special: "Mob Rule - +1 Ld for every 10 models"
    },
    eldar: {
        name: "Eldar",
        icon: "👁️",
        color: "#FFD700",
        bonus: "+6\" Move, -1 to be Hit",
        units: ["Guardians", "Dire Avengers", "Howling Banshees", "Farseers"],
        special: "Battle Focus - Advance and Shoot/Charge"
    },
    darkEldar: {
        name: "Dark Eldar",
        icon: "⚔️",
        color: "#4B0082",
        bonus: "+3\" Move, +1 to Wound vs. <10 W",
        units: ["Kabalites", "Wyches", "Incubi", "Archons"],
        special: "Power from Pain - Gain bonuses as units die"
    },
    tyranids: {
        name: "Tyranids",
        icon: "🦞",
        color: "#8B4513",
        bonus: "Synapse - Immune to morale nearby",
        units: ["Hormagaunts", "Genestealers", "Warriors", "Hive Tyrant"],
        special: "Shadow in the Warp - -1 to enemy psychic tests"
    },
    necrons: {
        name: "Necrons",
        icon: "💀",
        color: "#708090",
        bonus: "Reanimation Protocols (5+)",
        units: ["Warriors", "Immortals", "Lychguard", "Necron Overlord"],
        special: "Living Metal - Restore D3 wounds per turn"
    },
    tau: {
        name: "Tau Empire",
        icon: "🔫",
        color: "#00CED1",
        bonus: "+6\" Range, Markerlights",
        units: ["Fire Warriors", "Crisis Suits", "Stealth Suits", "Commanders"],
        special: "For the Greater Good - Overwatch on 5+"
    },

    // IMPERIAL GUARD
    imperialGuard: {
        name: "Imperial Guard",
        icon: "🎖️",
        color: "#F5F5DC",
        bonus: "Orders - Issue commands to units",
        units: ["Guardsmen", "Command Squad", "Heavy Weapons", "Leman Russ"],
        special: "Sentinels of Terra - Reroll 1s to Hit in own deployment"
    },

    // CHAOS DAEMONS
    chaosDaemons: {
        name: "Chaos Daemons",
        icon: "👿",
        color: "#800080",
        bonus: "Daemonic Invulnerability (5+)",
        units: ["Bloodletters", "Plaguebearers", "Daemonettes", "Horrors"],
        special: "Warp Surge - +1 Save until next turn"
    }
};

// Get all factions as array
function getAllFactions() {
    return Object.keys(Factions).map(key => ({
        id: key,
        ...Factions[key]
    }));
}

// Get faction by ID
function getFaction(id) {
    return Factions[id] || null;
}
