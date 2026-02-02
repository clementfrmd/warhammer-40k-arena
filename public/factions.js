// Warhammer 40K Factions Data - Organized by Grand Alliance

const FactionCategories = {
    SPACE_MARINES: {
        name: "Adeptus Astartes",
        description: "The Emperor's Finest - Genetically enhanced super soldiers",
        color: "#1E90FF",
        bgImage: "linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #0a1628 100%)"
    },
    CHAOS: {
        name: "Forces of Chaos",
        description: "Traitors and Daemons - Servants of the Dark Gods",
        color: "#8B0000",
        bgImage: "linear-gradient(135deg, #1a0a0a 0%, #3d1a1a 50%, #1a0a0a 100%)"
    },
    XENOS: {
        name: "Xenos Threat",
        description: "Alien races that threaten humanity's dominion",
        color: "#32CD32",
        bgImage: "linear-gradient(135deg, #0a1a0a 0%, #1a3d1a 50%, #0a1a0a 100%)"
    },
    IMPERIUM: {
        name: "Imperial Forces",
        description: "The countless armies of the God-Emperor",
        color: "#FFD700",
        bgImage: "linear-gradient(135deg, #1a1a0a 0%, #3d3d1a 50%, #1a1a0a 100%)"
    }
};

const Factions = {
    // ============================================
    // SPACE MARINES - Adeptus Astartes
    // ============================================
    ultramarines: {
        name: "Ultramarines",
        category: "SPACE_MARINES",
        icon: "U",
        symbol: "Omega",
        color: "#0047AB",
        secondaryColor: "#FFD700",
        bonus: "+1 to Hit in Shooting Phase",
        units: ["Tactical Squad", "Intercessors", "Assault Marines", "Terminators"],
        special: "Codex Astartes - Reroll 1s to Hit",
        lore: "The sons of Roboute Guilliman, masters of strategy and honor.",
        battleCry: "Courage and Honour!"
    },
    bloodAngels: {
        name: "Blood Angels",
        category: "SPACE_MARINES",
        icon: "BA",
        symbol: "Blood Drop Wings",
        color: "#DC143C",
        secondaryColor: "#000000",
        bonus: "+3\" Move, +1 Attack on Charge",
        units: ["Death Company", "Sanguinary Guard", "Assault Marines", "Terminators"],
        special: "Red Thirst - +1 to Wound in melee",
        lore: "Noble warriors cursed with the Black Rage and Red Thirst.",
        battleCry: "By the Blood of Sanguinius!"
    },
    spaceWolves: {
        name: "Space Wolves",
        category: "SPACE_MARINES",
        icon: "SW",
        symbol: "Wolf Head",
        color: "#607D8B",
        secondaryColor: "#FDD835",
        bonus: "+1 Ld, Counter-Attack ability",
        units: ["Grey Hunters", "Blood Claws", "Wolf Guard", "Thunderwolf Cavalry"],
        special: "Saga of the Beast - +1 Attack per slain enemy",
        lore: "Fierce warriors of Fenris, loyal sons of the Allfather.",
        battleCry: "For Russ and the Allfather!"
    },
    darkAngels: {
        name: "Dark Angels",
        category: "SPACE_MARINES",
        icon: "DA",
        symbol: "Winged Sword",
        color: "#013220",
        secondaryColor: "#FFFFFF",
        bonus: "+1 Save vs. Psychic attacks",
        units: ["Deathwing", "Ravenwing", "Tactical Squad", "Terminators"],
        special: "Unforgiven - Never fail Morale",
        lore: "Keepers of dark secrets, hunters of the Fallen.",
        battleCry: "Repent! For tomorrow you die!"
    },
    imperialFists: {
        name: "Imperial Fists",
        category: "SPACE_MARINES",
        icon: "IF",
        symbol: "Fist",
        color: "#FFD700",
        secondaryColor: "#000000",
        bonus: "+1 to Hit vs. Buildings, Ignore cover",
        units: ["Tactical Squad", "Terminators", "Centurions", "Vanguard Veterans"],
        special: "Siege Masters - Ignore cover saves",
        lore: "Masters of defense and siege warfare, Dorn's legacy.",
        battleCry: "Primarch-Progenitor, to your glory and the glory of Him on Earth!"
    },
    salamanders: {
        name: "Salamanders",
        category: "SPACE_MARINES",
        icon: "SAL",
        symbol: "Drake",
        color: "#228B22",
        secondaryColor: "#FF4500",
        bonus: "+1 to Wound vs. Monsters, Reroll flames",
        units: ["Tactical Squad", "Assault Marines", "Terminators", "Aggressors"],
        special: "Promethean Cult - Reroll one wound per attack",
        lore: "Masters of flame and forge, protectors of humanity.",
        battleCry: "Into the fires of battle, unto the anvil of war!"
    },

    // ============================================
    // CHAOS - Forces of the Dark Gods
    // ============================================
    worldEaters: {
        name: "World Eaters",
        category: "CHAOS",
        icon: "WE",
        symbol: "Skull Rune",
        color: "#8B0000",
        secondaryColor: "#FFD700",
        bonus: "+2 Attacks, -1 Ld",
        units: ["Khorne Berzerkers", "Eightbound", "Chaos Terminators", "Jakhals"],
        special: "Butcher's Nails - +1 to Hit, cannot retreat",
        lore: "Blood-crazed berserkers devoted to Khorne.",
        battleCry: "Blood for the Blood God! Skulls for the Skull Throne!"
    },
    deathGuard: {
        name: "Death Guard",
        category: "CHAOS",
        icon: "DG",
        symbol: "Tri-lobe",
        color: "#556B2F",
        secondaryColor: "#8B4513",
        bonus: "+1 Toughness, Disgustingly Resilient (5+)",
        units: ["Plague Marines", "Poxwalkers", "Blightlord Terminators", "Mortarion"],
        special: "Contagion - Reduce enemy toughness by 1",
        lore: "Plague-ridden warriors of Nurgle, bringing pestilence.",
        battleCry: "Let the galaxy rot!"
    },
    thousandSons: {
        name: "Thousand Sons",
        category: "CHAOS",
        icon: "TS",
        symbol: "Serpent Star",
        color: "#4169E1",
        secondaryColor: "#FFD700",
        bonus: "Psyker level 2, +1 to Cast",
        units: ["Rubric Marines", "Scarab Occult", "Tzaangors", "Magnus the Red"],
        special: "All is Dust - +1 Save vs. Damage 1",
        lore: "Sorcerers and automatons serving Tzeentch.",
        battleCry: "All is dust!"
    },
    emperorsChildren: {
        name: "Emperor's Children",
        category: "CHAOS",
        icon: "EC",
        symbol: "Palatine Aquila",
        color: "#9932CC",
        secondaryColor: "#FFD700",
        bonus: "+1 to Hit in Combat, Always fight first",
        units: ["Noise Marines", "Lucius the Eternal", "Chaos Terminators", "Daemon Prince"],
        special: "Excess - Extra attack on 6 to hit",
        lore: "Perfection-seeking hedonists devoted to Slaanesh.",
        battleCry: "Children of the Emperor! Death to his foes!"
    },
    blackLegion: {
        name: "Black Legion",
        category: "CHAOS",
        icon: "BL",
        symbol: "Eye of Horus",
        color: "#1a1a1a",
        secondaryColor: "#FFD700",
        bonus: "+1 to All attacks when Abaddon is near",
        units: ["Chaos Marines", "Terminators", "Chosen", "Abaddon the Despoiler"],
        special: "Warmaster's Chosen - Reroll all 1s to Hit",
        lore: "The Sons of Horus reborn, led by the Warmaster.",
        battleCry: "We are returned! Death to the False Emperor!"
    },
    chaosDaemons: {
        name: "Chaos Daemons",
        category: "CHAOS",
        icon: "CD",
        symbol: "Star of Chaos",
        color: "#800080",
        secondaryColor: "#FF0000",
        bonus: "Daemonic Invulnerability (5+)",
        units: ["Bloodletters", "Plaguebearers", "Daemonettes", "Pink Horrors"],
        special: "Warp Surge - +1 Invuln until next turn",
        lore: "Manifestations of the Warp given terrible form.",
        battleCry: "The Warp hungers!"
    },

    // ============================================
    // XENOS - Alien Threats
    // ============================================
    orks: {
        name: "Orks",
        category: "XENOS",
        icon: "ORK",
        symbol: "Glyph",
        color: "#32CD32",
        secondaryColor: "#8B4513",
        bonus: "WAAAGH! +1 Attack on charge",
        units: ["Boyz", "Nobz", "Meganobz", "Warboss"],
        special: "Mob Rule - +1 Ld per 10 models",
        lore: "Green-skinned war-loving fungoid aliens.",
        battleCry: "WAAAGH!"
    },
    eldar: {
        name: "Aeldari",
        category: "XENOS",
        icon: "AEL",
        symbol: "Rune",
        color: "#E6E6FA",
        secondaryColor: "#4169E1",
        bonus: "+6\" Move, -1 to be Hit",
        units: ["Guardians", "Dire Avengers", "Howling Banshees", "Farseers"],
        special: "Battle Focus - Advance and Shoot/Charge",
        lore: "Ancient race fighting to stave off extinction.",
        battleCry: "For the Craftworld!"
    },
    darkEldar: {
        name: "Drukhari",
        category: "XENOS",
        icon: "DRU",
        symbol: "Blade",
        color: "#301934",
        secondaryColor: "#00FF00",
        bonus: "+3\" Move, +1 to Wound vs. Infantry",
        units: ["Kabalites", "Wyches", "Incubi", "Archons"],
        special: "Power from Pain - Gain bonuses as enemies die",
        lore: "Sadistic raiders from Commorragh.",
        battleCry: "Pain is your gift!"
    },
    tyranids: {
        name: "Tyranids",
        category: "XENOS",
        icon: "TYR",
        symbol: "Biomorph",
        color: "#800080",
        secondaryColor: "#4B0082",
        bonus: "Synapse - Immune to morale nearby",
        units: ["Hormagaunts", "Genestealers", "Warriors", "Hive Tyrant"],
        special: "Shadow in the Warp - -2 to enemy psychic",
        lore: "Extra-galactic swarm devouring all biomass.",
        battleCry: "*Chittering screech*"
    },
    necrons: {
        name: "Necrons",
        category: "XENOS",
        icon: "NEC",
        symbol: "Ankh",
        color: "#2F4F4F",
        secondaryColor: "#00FF00",
        bonus: "Reanimation Protocols (5+)",
        units: ["Warriors", "Immortals", "Lychguard", "Overlord"],
        special: "Living Metal - Restore D3 wounds per turn",
        lore: "Ancient mechanical undead, awakening to reclaim the galaxy.",
        battleCry: "We are legion. We are eternal."
    },
    tau: {
        name: "T'au Empire",
        category: "XENOS",
        icon: "TAU",
        symbol: "Tau",
        color: "#F5DEB3",
        secondaryColor: "#FF4500",
        bonus: "+6\" Range, Markerlights",
        units: ["Fire Warriors", "Crisis Suits", "Stealth Suits", "Commanders"],
        special: "For the Greater Good - Overwatch on 5+",
        lore: "Young empire expanding through technology and unity.",
        battleCry: "For the Greater Good!"
    },

    // ============================================
    // IMPERIUM - Forces of Mankind
    // ============================================
    astonMilitarum: {
        name: "Astra Militarum",
        category: "IMPERIUM",
        icon: "AM",
        symbol: "Aquila",
        color: "#8B8B00",
        secondaryColor: "#556B2F",
        bonus: "Orders - Issue commands to units",
        units: ["Guardsmen", "Command Squad", "Heavy Weapons", "Leman Russ"],
        special: "Hammer of the Emperor - Reroll 1s in deployment",
        lore: "The countless billions of the Imperial Guard.",
        battleCry: "For the Emperor!"
    },
    adeptusCustodes: {
        name: "Adeptus Custodes",
        category: "IMPERIUM",
        icon: "AC",
        symbol: "Eagle",
        color: "#FFD700",
        secondaryColor: "#8B0000",
        bonus: "2+ Save, 4+ Invuln, +1 to Hit",
        units: ["Custodian Guard", "Allarus Terminators", "Vertus Praetors", "Shield-Captain"],
        special: "Aegis of the Emperor - 4+ vs. Mortals",
        lore: "The Emperor's personal bodyguard, each worth a hundred Marines.",
        battleCry: "We are His instruments!"
    },
    sistersBattle: {
        name: "Adepta Sororitas",
        category: "IMPERIUM",
        icon: "SoB",
        symbol: "Fleur-de-lis",
        color: "#1a1a1a",
        secondaryColor: "#FFFFFF",
        bonus: "Acts of Faith - 1 per turn miracle",
        units: ["Battle Sisters", "Retributors", "Seraphim", "Canoness"],
        special: "Shield of Faith - 6+ Invuln",
        lore: "Warrior-nuns of the Ecclesiarchy.",
        battleCry: "Cleanse! Purge! Kill!"
    },
    adeptusMechanicus: {
        name: "Adeptus Mechanicus",
        category: "IMPERIUM",
        icon: "AdM",
        symbol: "Cog Skull",
        color: "#8B0000",
        secondaryColor: "#708090",
        bonus: "Canticles of the Omnissiah",
        units: ["Skitarii Rangers", "Sicarians", "Kastelan Robots", "Tech-Priest"],
        special: "Doctrina Imperatives - +1 to Hit/Sv",
        lore: "Tech-priests and their cybernetic legions.",
        battleCry: "The Omnissiah protects!"
    },
    greyKnights: {
        name: "Grey Knights",
        category: "IMPERIUM",
        icon: "GK",
        symbol: "Book Sword",
        color: "#C0C0C0",
        secondaryColor: "#4169E1",
        bonus: "All Psykers, +1 to Deny",
        units: ["Strike Squad", "Terminators", "Paladins", "Grand Master"],
        special: "Daemon Hunters - +1 to Wound Daemons",
        lore: "Secret Chapter of psychic daemon-hunters.",
        battleCry: "We are the Hammer!"
    }
};

// Get all factions as array
function getAllFactions() {
    return Object.keys(Factions).map(key => ({
        id: key,
        ...Factions[key]
    }));
}

// Get factions by category
function getFactionsByCategory(category) {
    return Object.keys(Factions)
        .filter(key => Factions[key].category === category)
        .map(key => ({ id: key, ...Factions[key] }));
}

// Get faction by ID
function getFaction(id) {
    return Factions[id] || null;
}

// Get category info
function getCategory(categoryKey) {
    return FactionCategories[categoryKey] || null;
}

// Get all categories
function getAllCategories() {
    return Object.keys(FactionCategories).map(key => ({
        id: key,
        ...FactionCategories[key]
    }));
}
