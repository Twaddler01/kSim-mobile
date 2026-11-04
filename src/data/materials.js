// src/materials.js

export const materials = [
    // --------------------------------------------------
    // RAW MATERIALS — recovered from gathering fields
    // --------------------------------------------------
    {
        id: "stone",
        name: "Stone Sample",
        category: "raw",
        subtype: "mineral",
        tier: 1,
        icon: "🪨",
        description: "A rough fragment of common stone recovered from the field."
    },
    {
        id: "quartz",
        name: "Quartz",
        category: "raw",
        subtype: "mineral",
        tier: 1,
        icon: "💎",
        description: "A crystalline mineral suitable for processing."
    },
    {
        id: "copper",
        name: "Copper Sample",
        category: "raw",
        subtype: "ore",
        tier: 2,
        icon: "🟠",
        description: "A recovered conductive metal sample."
    },
    {
        id: "silicon",
        name: "Silicon Sample",
        category: "raw",
        subtype: "mineral",
        tier: 2,
        icon: "🔹",
        description: "A semiconductor-grade mineral sample."
    },
    {
        id: "silica",
        name: "Silica Sample",
        category: "raw",
        subtype: "mineral",
        tier: 1,
        icon: "💎",
        description: "A mineral precursor for engineered crystal structures."
    },
    {
        id: "graphite",
        name: "Graphite",
        category: "raw",
        subtype: "mineral",
        tier: 1,
        icon: "⬛",
        description: "A carbon-rich mineral useful in conductive materials."
    },
    {
        id: "clay",
        name: "Clay",
        category: "raw",
        subtype: "mineral",
        tier: 1,
        icon: "🟤",
        description: "A workable mineral feedstock for heat-resistant materials."
    },
    {
        id: "sulfur",
        name: "Sulfur",
        category: "raw",
        subtype: "mineral",
        tier: 1,
        icon: "🟡",
        description: "A reactive mineral used in chemical processing."
    },
    {
        id: "ironOre",
        name: "Iron Ore",
        category: "raw",
        subtype: "ore",
        tier: 1,
        icon: "🪨",
        description: "An iron-bearing ore suitable for smelting."
    },
    {
        id: "aluminum",
        name: "Aluminum-Bearing Ore",
        category: "raw",
        subtype: "ore",
        tier: 2,
        icon: "⬜",
        description: "A lightweight-metal feedstock recovered from bauxite deposits."
    },
    {
        id: "nickelOre",
        name: "Nickel Ore",
        category: "raw",
        subtype: "ore",
        tier: 2,
        icon: "🪨",
        description: "A metal-bearing ore for advanced alloys."
    },
    {
        id: "zincOre",
        name: "Zinc Ore",
        category: "raw",
        subtype: "ore",
        tier: 2,
        icon: "🪨",
        description: "A zinc-bearing ore for material processing."
    },
    {
        id: "lithiumOre",
        name: "Lithium Ore",
        category: "raw",
        subtype: "ore",
        tier: 3,
        icon: "🪨",
        description: "A lithium-bearing ore for specialized chemical processing."
    },
    {
        id: "cobaltOre",
        name: "Cobalt Ore",
        category: "raw",
        subtype: "ore",
        tier: 3,
        icon: "🪨",
        description: "A cobalt-bearing ore for advanced material production."
    },
    {
        id: "titaniumOre",
        name: "Titanium Ore",
        category: "raw",
        subtype: "ore",
        tier: 3,
        icon: "🪨",
        description: "A high-strength metal feedstock."
    },
    {
        id: "rareEarthOre",
        name: "Rare Earth Ore",
        category: "raw",
        subtype: "ore",
        tier: 3,
        icon: "🪨",
        description: "An ore containing elements useful in advanced electronics."
    },
    {
        id: "tungstenOre",
        name: "Tungsten Ore",
        category: "raw",
        subtype: "ore",
        tier: 4,
        icon: "🪨",
        description: "A dense metal feedstock for specialized equipment."
    },
    {
        id: "tantalumOre",
        name: "Tantalum Ore",
        category: "raw",
        subtype: "ore",
        tier: 4,
        icon: "🪨",
        description: "A rare metal feedstock for electronic components."
    },
    {
        id: "platinumOre",
        name: "Platinum Ore",
        category: "raw",
        subtype: "ore",
        tier: 4,
        icon: "🪨",
        description: "A rare metal-bearing deposit."
    },
    {
        id: "meteoriteFragment",
        name: "Meteorite Fragment",
        category: "raw",
        subtype: "anomalous",
        tier: 4,
        icon: "☄️",
        description: "An extraterrestrial fragment with unusual material properties."
    },
    {
        id: "unstableIsotope",
        name: "Unstable Isotope",
        category: "raw",
        subtype: "anomalous",
        tier: 5,
        icon: "☢️",
        description: "An isotope exhibiting unusual decay behavior."
    },
    {
        id: "anomalousCrystal",
        name: "Anomalous Crystal",
        category: "raw",
        subtype: "anomalous",
        tier: 5,
        icon: "💠",
        description: "A crystal exhibiting unexplained field interactions."
    },
    {
        id: "quantumParticleTrace",
        name: "Quantum Particle Trace",
        category: "raw",
        subtype: "discovery",
        tier: 5,
        icon: "⚛️",
        description: "Evidence of a particle interaction outside the expected model."
    },

    // --------------------------------------------------
    // PROCESSED MATERIALS
    // --------------------------------------------------
    {
        id: "quartzPowder",
        name: "Quartz Powder",
        category: "processed",
        subtype: "mineral",
        tier: 1,
        icon: "◈",
        description: "Quartz reduced to a fine powder."
    },
    {
        id: "glass",
        name: "Glass",
        category: "processed",
        subtype: "ceramic",
        tier: 1,
        icon: "🔹",
        description: "Silica transformed into a stable glass material."
    },
    {
        id: "copperIngot",
        name: "Copper Ingot",
        category: "processed",
        subtype: "metal",
        tier: 2,
        icon: "🟠",
        description: "Copper ore refined into a usable metal ingot."
    },
    {
        id: "lithiumCompound",
        name: "Lithium Compound",
        category: "processed",
        subtype: "chemical",
        tier: 3,
        icon: "⚗️",
        description: "A refined lithium-bearing compound."
    },
    {
        id: "conductiveAlloy",
        name: "Conductive Alloy",
        category: "processed",
        subtype: "alloy",
        tier: 2,
        icon: "🔩",
        description: "A processed alloy suitable for precision assemblies."
    },
    {
        id: "ceramicInsulator",
        name: "Ceramic Insulator",
        category: "processed",
        subtype: "ceramic",
        tier: 2,
        icon: "◻️",
        description: "A heat-resistant insulating component."
    },
    {
        id: "resonanceCrystal",
        name: "Resonance Crystal",
        category: "processed",
        subtype: "advanced",
        tier: 5,
        icon: "💠",
        description: "A fictional crystal engineered to respond to the Temporal Resonance model."
    },
    {
        id: "phaseStableCrystal",
        name: "Phase-Stable Crystal",
        category: "processed",
        subtype: "advanced",
        tier: 5,
        icon: "🔷",
        description: "A fictional crystal treated to resist phase drift."
    },

    // --------------------------------------------------
    // CRAFTED COMPONENTS
    // --------------------------------------------------
    {
        id: "copperConductor",
        name: "Copper Conductor",
        category: "crafted",
        subtype: "component",
        tier: 2,
        icon: "〰️",
        description: "A precision conductor manufactured from a copper sample."
    },
    {
        id: "siliconWafer",
        name: "Silicon Wafer",
        category: "crafted",
        subtype: "component",
        tier: 2,
        icon: "▤",
        description: "A processed silicon substrate for control electronics."
    },
    {
        id: "opticalSensor",
        name: "Optical Sensor",
        category: "crafted",
        subtype: "component",
        tier: 3,
        icon: "📡",
        description: "A sensor assembly for measuring particle-field response."
    },
    {
        id: "energyCapacitor",
        name: "Energy Capacitor",
        category: "crafted",
        subtype: "component",
        tier: 3,
        icon: "🔋",
        description: "A component that stores and releases controlled energy."
    },

    // --------------------------------------------------
    // CRAFTED ASSEMBLIES AND EQUIPMENT
    // --------------------------------------------------
    {
        id: "resonanceCore",
        name: "Resonance Core",
        category: "crafted",
        subtype: "assembly",
        tier: 5,
        icon: "🧿",
        description: "The central unit that translates the formula into field patterns."
    },
    {
        id: "containmentAssembly",
        name: "Containment Assembly",
        category: "crafted",
        subtype: "assembly",
        tier: 5,
        icon: "⭕",
        description: "A housing designed to keep experimental matter within a controlled field."
    },
    {
        id: "measurementUnit",
        name: "Measurement & Control Unit",
        category: "crafted",
        subtype: "assembly",
        tier: 5,
        icon: "🎛️",
        description: "The interface used to measure and tune an experimental object's response."
    },
    {
        id: "energyRegulator",
        name: "Energy Regulation Unit",
        category: "crafted",
        subtype: "assembly",
        tier: 5,
        icon: "⚡",
        description: "A regulated power stage capable of operating with exotic matter."
    },
    {
        id: "particleReconfigurationArray",
        name: "Particle Reconfiguration Array",
        category: "crafted",
        subtype: "equipment",
        tier: 5,
        icon: "⚛️",
        description: "A complete instrument for controlled particle manipulation."
    }
];

// --------------------------------------------------
// LOOKUP HELPERS
// --------------------------------------------------

export function getMaterial(materialId) {
    return materials.find(material => material.id === materialId) ?? null;
}

export function getMaterialsByCategory(category) {
    return materials.filter(material => material.category === category);
}

export function getMaterialsByTier(tier) {
    return materials.filter(material => material.tier === tier);
}

export function getFieldMaterials(fieldId) {
    return materials.filter(material => material.field?.id === fieldId);
}