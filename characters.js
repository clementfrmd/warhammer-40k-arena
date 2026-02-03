// Openhammer 40K Characters and Units Data
const Characters = {
    // SPACE MARINE HEROES
    spaceMarineHeroes: {
        chapterMaster: {
            name: "Chapter Master",
            type: "HQ",
            wounds: 6,
            move: 6,
            toughness: 5,
            save: "2+",
            leadership: 10,
            attacks: 4,
            weapon: "Master Crafted Bolter",
            meleeWeapon: "Power Fist",
            special: "Reroll all failed hit rolls"
        },
        captain: {
            name: "Captain",
            type: "HQ",
            wounds: 5,
            move: 6,
            toughness: 5,
            save: "3+",
            leadership: 9,
            attacks: 3,
            weapon: "Bolter",
            meleeWeapon: "Chainsword",
            special: "Aura of Courage - +1 Ld to nearby units"
        },
        librarian: {
            name: "Librarian",
            type: "HQ",
            wounds: 5,
            move: 6,
            toughness: 5,
            save: "3+",
            leadership: 9,
            attacks: 2,
            weapon: "Bolter",
            meleeWeapon: "Force Sword",
            psychicPower: "Smite - 1d3 mortal wounds"
        },
        chaplain: {
            name: "Chaplain",
            type: "HQ",
            wounds: 5,
            move: 6,
            toughness: 5,
            save: "3+",
            leadership: 9,
            attacks: 3,
            weapon: "Bolter",
            meleeWeapon: "Crozius",
            special: "Litanies of Hate - Reroll hits in combat phase"
        }
    },

    // SPACE MARINE UNITS
    spaceMarineUnits: {
        tacticalSquad: {
            name: "Tactical Squad",
            type: "Troops",
            count: 10,
            wounds: 1,
            move: 6,
            toughness: 4,
            save: "3+",
            leadership: 8,
            attacks: 1,
            weapon: "Bolter",
            special: "And They Shall Know No Fear - Immune to morale"
        },
        intercessors: {
            name: "Intercessors",
            type: "Troops",
            count: 5,
            wounds: 2,
            move: 6,
            toughness: 4,
            save: "3+",
            leadership: 8,
            attacks: 2,
            weapon: "Bolt Rifle",
            special: "Extra wound, longer range"
        },
        assaultMarines: {
            name: "Assault Marines",
            type: "Fast Attack",
            count: 5,
            wounds: 1,
            move: 12,
            toughness: 4,
            save: "3+",
            leadership: 8,
            attacks: 2,
            weapon: "Pistol",
            meleeWeapon: "Chainsword",
            special: "Jetpack - Deep strike, +6\" move"
        },
        terminators: {
            name: "Terminators",
            type: "Elite",
            count: 5,
            wounds: 2,
            move: 5,
            toughness: 5,
            save: "2+",
            leadership: 9,
            attacks: 2,
            weapon: "Storm Bolter",
            meleeWeapon: "Power Fist",
            special: "2+ Save, teleport deep strike"
        }
    },

    // ORK HEROES
    orkHeroes: {
        warboss: {
            name: "Warboss",
            type: "HQ",
            wounds: 6,
            move: 6,
            toughness: 5,
            save: "4+",
            leadership: 7,
            attacks: 5,
            weapon: "Shoota",
            meleeWeapon: "Power Klaw",
            special: "WAAAGH! - +1 Attack for nearby Orks"
        },
        weirdboy: {
            name: "Weirdboy",
            type: "HQ",
            wounds: 5,
            move: 6,
            toughness: 5,
            save: "6+",
            leadership: 7,
            attacks: 2,
            weapon: "None",
            meleeWeapon: "Staff",
            psychicPower: "Da Jump - Teleport unit, 1d3 mortal wounds"
        }
    },

    // ORK UNITS
    orkUnits: {
        boyz: {
            name: "Boyz",
            type: "Troops",
            count: 10,
            wounds: 1,
            move: 6,
            toughness: 4,
            save: "6+",
            leadership: 7,
            attacks: 2,
            weapon: "Shoota",
            meleeWeapon: "Choppa",
            special: "Mob Rule - +1 Ld for every 10 models"
        },
        nobz: {
            name: "Nobz",
            type: "Elite",
            count: 5,
            wounds: 2,
            move: 6,
            toughness: 5,
            save: "4+",
            leadership: 7,
            attacks: 3,
            weapon: "Shoota",
            meleeWeapon: "Power Klaw",
            special: "Better equipment, +1 wound"
        }
    },

    // TYRANID HEROES
    tyranidHeroes: {
        hiveTyrant: {
            name: "Hive Tyrant",
            type: "HQ",
            wounds: 8,
            move: 8,
            toughness: 7,
            save: "3+",
            leadership: 10,
            attacks: 5,
            weapon: "Deathspitter",
            meleeWeapon: "Scything Talons",
            special: "Synapse - Immune to morale, +1 Ld to nearby Tyranids"
        },
        swarmlord: {
            name: "The Swarmlord",
            type: "HQ",
            wounds: 8,
            move: 6,
            toughness: 8,
            save: "2+",
            leadership: 10,
            attacks: 6,
            weapon: "Bone Sabres",
            meleeWeapon: "Bone Sabres",
            special: "Absolute commander - Reroll all failed hit and wound rolls"
        }
    },

    // TYRANID UNITS
    tyranidUnits: {
        hormagaunts: {
            name: "Hormagaunts",
            type: "Troops",
            count: 10,
            wounds: 1,
            move: 6,
            toughness: 3,
            save: "6+",
            leadership: 6,
            attacks: 2,
            weapon: "None",
            meleeWeapon: "Scything Talons",
            special: "Fleet - +2\" Advance, can charge after advancing"
        },
        genestealers: {
            name: "Genestealers",
            type: "Troops",
            count: 5,
            wounds: 1,
            move: 6,
            toughness: 3,
            save: "5+",
            leadership: 10,
            attacks: 3,
            weapon: "None",
            meleeWeapon: "Rending Claws",
            special: "Rending - 6 to wound = AP -4"
        },
        warriors: {
            name: "Tyranid Warriors",
            type: "Elite",
            count: 3,
            wounds: 3,
            move: 6,
            toughness: 4,
            save: "4+",
            leadership: 10,
            attacks: 2,
            weapon: "Deathspitter",
            meleeWeapon: "Scything Talons",
            special: "Synapse - Immune to morale"
        }
    },

    // CHAOS SPACE MARINE HEROES
    chaosHeroes: {
        chaosLord: {
            name: "Chaos Lord",
            type: "HQ",
            wounds: 5,
            move: 6,
            toughness: 5,
            save: "3+",
            leadership: 9,
            attacks: 4,
            weapon: "Bolter",
            meleeWeapon: "Power Sword",
            special: "Dark Pact - Reroll 1s to Hit"
        },
        daemonPrince: {
            name: "Daemon Prince",
            type: "HQ",
            wounds: 7,
            move: 8,
            toughness: 6,
            save: "3+",
            leadership: 10,
            attacks: 5,
            weapon: "None",
            meleeWeapon: "Daemonic Axe",
            special: "Daemon - 5+ Invulnerable save, Fly"
        }
    },

    // CHAOS SPACE MARINE UNITS
    chaosUnits: {
        chaosMarines: {
            name: "Chaos Space Marines",
            type: "Troops",
            count: 10,
            wounds: 1,
            move: 6,
            toughness: 4,
            save: "3+",
            leadership: 8,
            attacks: 1,
            weapon: "Bolter",
            meleeWeapon: "Chainsword",
            special: "Marks of Chaos - Various bonuses"
        },
        berserkers: {
            name: "Khorne Berzerkers",
            type: "Troops",
            count: 10,
            wounds: 1,
            move: 6,
            toughness: 4,
            save: "3+",
            leadership: 8,
            attacks: 3,
            weapon: "Pistol",
            meleeWeapon: "Chainaxe",
            special: "Blood for the Blood God - +1 Attack, -1 Ld"
        }
    },

    // ELDAR HEROES
    eldarHeroes: {
        farseer: {
            name: "Farseer",
            type: "HQ",
            wounds: 5,
            move: 6,
            toughness: 3,
            save: "3+",
            leadership: 10,
            attacks: 2,
            weapon: "Shuriken Pistol",
            meleeWeapon: "Witchblade",
            psychicPower: "Guide - Reroll hits for one unit"
        },
        autarch: {
            name: "Autarch",
            type: "HQ",
            wounds: 5,
            move: 7,
            toughness: 4,
            save: "3+",
            leadership: 9,
            attacks: 4,
            weapon: "Shuriken Catapult",
            meleeWeapon: "Power Sword",
            special: "Master Strategist - +1 to Seize the Initiative"
        }
    },

    // ELDAR UNITS
    eldarUnits: {
        guardians: {
            name: "Guardian Defenders",
            type: "Troops",
            count: 10,
            wounds: 1,
            move: 6,
            toughness: 3,
            save: "5+",
            leadership: 8,
            attacks: 1,
            weapon: "Shuriken Catapult",
            special: "Battle Focus - Advance and Shoot"
        },
        direAvengers: {
            name: "Dire Avengers",
            type: "Troops",
            count: 5,
            wounds: 1,
            move: 6,
            toughness: 3,
            save: "4+",
            leadership: 9,
            attacks: 2,
            weapon: "Avenger Shuriken Catapult",
            special: "Shielded - 5+ invulnerable save"
        }
    }
};

// Get hero by faction and type
function getHero(faction, heroType) {
    const factionHeroes = Characters[`${faction}Heroes`];
    return factionHeroes ? factionHeroes[heroType] : null;
}

// Get units by faction
function getUnits(faction) {
    const factionUnits = Characters[`${faction}Units`];
    return factionUnits ? Object.values(factionUnits) : [];
}

// Get all units as array
function getAllUnits(faction) {
    const heroes = Characters[`${faction}Heroes`];
    const units = Characters[`${faction}Units`];
    return [
        ...(heroes ? Object.values(heroes) : []),
        ...(units ? Object.values(units) : [])
    ];
}
