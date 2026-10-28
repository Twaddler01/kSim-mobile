/**
 * Synthesis Engine content definitions.
 *
 * Recipe costs are split into:
 * - resources: existing game resources (energy, particles, research, exoticMatter)
 * - items: material/component inventory produced by other recipes or experiments
 *
 * Keep this file data-only so future formula cards and experimental objects can
 * use the same recipe system.
 */

export const materialDefinitions = [
    {
        id: "copper",
        name: "Copper Sample",
        category: "raw",
        icon: "🟠",
        description: "A recovered conductive metal sample."
    },
    {
        id: "silicon",
        name: "Silicon Sample",
        category: "raw",
        icon: "🔹",
        description: "A semiconductor-grade mineral sample."
    },
    {
        id: "silica",
        name: "Silica Sample",
        category: "raw",
        icon: "💎",
        description: "A mineral precursor for engineered crystal structures."
    },
    {
        id: "aluminum",
        name: "Aluminum Sample",
        category: "raw",
        icon: "⬜",
        description: "A lightweight structural metal sample."
    },
    {
        id: "conductiveAlloy",
        name: "Conductive Alloy",
        category: "processed",
        icon: "🔩",
        description: "A processed alloy suitable for precision assemblies."
    },
    {
        id: "ceramicInsulator",
        name: "Ceramic Insulator",
        category: "processed",
        icon: "◻️",
        description: "A heat-resistant insulating component."
    },
    {
        id: "resonanceCrystal",
        name: "Resonance Crystal",
        category: "advanced",
        icon: "💠",
        description: "A fictional crystal engineered to respond to the Temporal Resonance model."
    },
    {
        id: "phaseStableCrystal",
        name: "Phase-Stable Crystal",
        category: "advanced",
        icon: "🔷",
        description: "A fictional crystal treated to resist phase drift."
    },
    {
        id: "copperConductor",
        name: "Copper Conductor",
        category: "component",
        icon: "〰️",
        description: "A precision conductor manufactured from a copper sample."
    },
    {
        id: "siliconWafer",
        name: "Silicon Wafer",
        category: "component",
        icon: "▤",
        description: "A processed silicon substrate for control electronics."
    },
    {
        id: "opticalSensor",
        name: "Optical Sensor",
        category: "component",
        icon: "📡",
        description: "A sensor assembly for measuring particle-field response."
    },
    {
        id: "energyCapacitor",
        name: "Energy Capacitor",
        category: "component",
        icon: "🔋",
        description: "A component that stores and releases controlled energy."
    },
    {
        id: "resonanceCore",
        name: "Resonance Core",
        category: "assembly",
        icon: "🧿",
        description: "The central unit that translates the formula into field patterns."
    },
    {
        id: "containmentAssembly",
        name: "Containment Assembly",
        category: "assembly",
        icon: "⭕",
        description: "A housing designed to keep experimental matter within a controlled field."
    },
    {
        id: "measurementUnit",
        name: "Measurement & Control Unit",
        category: "assembly",
        icon: "🎛️",
        description: "The interface used to measure and tune an experimental object's response."
    },
    {
        id: "energyRegulator",
        name: "Energy Regulation Unit",
        category: "assembly",
        icon: "⚡",
        description: "A regulated power stage capable of operating with exotic matter."
    },
    {
        id: "particleReconfigurationArray",
        name: "Particle Reconfiguration Array",
        category: "machine",
        icon: "⚛️",
        description: "A complete instrument for controlled particle manipulation."
    }
];

export const recipeDefinitions = [
    {
        id: "copper-conductor",
        name: "Copper Conductor",
        output: { id: "copperConductor", amount: 1 },
        category: "Components",
        description: "Process a recovered copper sample into a precision conductor.",
        costs: { items: { copper: 1 }, resources: { energy: 2 } }
    },
    {
        id: "silicon-wafer",
        name: "Silicon Wafer",
        output: { id: "siliconWafer", amount: 1 },
        category: "Components",
        description: "Prepare a silicon sample for control electronics.",
        costs: { items: { silicon: 1 }, resources: { energy: 3 } }
    },
    {
        id: "conductive-alloy",
        name: "Conductive Alloy",
        output: { id: "conductiveAlloy", amount: 1 },
        category: "Materials",
        description: "Combine aluminum and copper into a fictional game alloy.",
        costs: { items: { aluminum: 1, copper: 1 }, resources: { energy: 4 } }
    },
    {
        id: "ceramic-insulator",
        name: "Ceramic Insulator",
        output: { id: "ceramicInsulator", amount: 1 },
        category: "Materials",
        description: "Process silica into an insulating ceramic component.",
        costs: { items: { silica: 2 }, resources: { energy: 3 } }
    },
    {
        id: "optical-sensor",
        name: "Optical Sensor",
        output: { id: "opticalSensor", amount: 1 },
        category: "Components",
        description: "Assemble a sensor from a silicon wafer and conductive alloy.",
        costs: { items: { siliconWafer: 1, conductiveAlloy: 1 }, resources: { energy: 5, research: 1 } }
    },
    {
        id: "energy-capacitor",
        name: "Energy Capacitor",
        output: { id: "energyCapacitor", amount: 1 },
        category: "Components",
        description: "Build a compact energy-storage component.",
        costs: { items: { conductiveAlloy: 1, ceramicInsulator: 1 }, resources: { energy: 6, research: 1 } }
    },
    {
        id: "resonance-crystal",
        name: "Resonance Crystal",
        output: { id: "resonanceCrystal", amount: 1 },
        category: "Advanced Materials",
        description: "Use controlled field exposure to produce a formula-responsive crystal.",
        unlock: { discovery: "temporalResonance" },
        costs: { items: { silica: 1 }, resources: { energy: 8, particles: 2, research: 3 } }
    },
    {
        id: "phase-stable-crystal",
        name: "Phase-Stable Crystal",
        output: { id: "phaseStableCrystal", amount: 1 },
        category: "Advanced Materials",
        description: "Treat a resonance crystal to resist phase drift.",
        unlock: { discovery: "temporalResonance" },
        costs: { items: { resonanceCrystal: 1, ceramicInsulator: 1 }, resources: { energy: 10, research: 4 } }
    },
    {
        id: "resonance-core",
        name: "Resonance Core",
        output: { id: "resonanceCore", amount: 1 },
        category: "Assemblies",
        description: "Assemble the core that applies the Temporal Resonance model.",
        unlock: { discovery: "temporalResonance" },
        costs: { items: { copperConductor: 2, siliconWafer: 1, resonanceCrystal: 1 }, resources: { energy: 8, research: 4 } }
    },
    {
        id: "containment-assembly",
        name: "Containment Assembly",
        output: { id: "containmentAssembly", amount: 1 },
        category: "Assemblies",
        description: "Build a field housing with insulating and phase-stable materials.",
        unlock: { discovery: "temporalResonance" },
        costs: { items: { conductiveAlloy: 2, ceramicInsulator: 1, phaseStableCrystal: 1 }, resources: { energy: 10, research: 4 } }
    },
    {
        id: "measurement-unit",
        name: "Measurement & Control Unit",
        output: { id: "measurementUnit", amount: 1 },
        category: "Assemblies",
        description: "Build the measurement system needed to tune particle properties.",
        unlock: { discovery: "temporalResonance" },
        costs: { items: { siliconWafer: 1, copperConductor: 1, opticalSensor: 1 }, resources: { energy: 10, research: 5 } }
    },
    {
        id: "energy-regulator",
        name: "Energy Regulation Unit",
        output: { id: "energyRegulator", amount: 1 },
        category: "Assemblies",
        description: "Build the regulated power stage for the finished instrument.",
        unlock: { discovery: "temporalResonance" },
        costs: { items: { conductiveAlloy: 1, energyCapacitor: 1 }, resources: { energy: 12, research: 4, exoticMatter: 2 } }
    },
    {
        id: "particle-reconfiguration-array",
        name: "Particle Reconfiguration Array",
        output: { id: "particleReconfigurationArray", amount: 1 },
        category: "Major Equipment",
        description: "Combine all four assemblies into a working particle manipulator.",
        unlock: { discovery: "temporalResonance" },
        costs: {
            items: {
                resonanceCore: 1,
                containmentAssembly: 1,
                measurementUnit: 1,
                energyRegulator: 1
            },
            resources: { energy: 20, research: 10, exoticMatter: 5 }
        },
        unique: true
    }
];
