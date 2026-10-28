export const materials = [
    {
        id: "copper",
        name: "Copper Sample",
        category: "raw",
        subtype: "ore",
        tier: 2,
        icon: "🟠",
        description: "A recovered conductive metal sample.",

        field: {
            id: "copper",
            dropChance: 0.22
        }
    },
    {
        id: "silicon",
        name: "Silicon Sample",
        category: "raw",
        subtype: "ore",
        tier: 2,
        icon: "🔹",
        description: "A semiconductor-grade mineral sample.",
        field: {
            id: "silicon",
            dropChance: 0.22
        }
    },




    
    {
        id: "quartz",
        name: "Quartz",
        category: "raw",
        subtype: "mineral",
        tier: 1,
        icon: "💎",
        description: "A crystalline mineral suitable for processing.",

        field: {
            id: "quartz",
            dropChance: 0.30
        }
    },
    {
        id: "quartzPowder",
        name: "Quartz Powder",
        category: "processed",
        subtype: "mineral",
        tier: 1,
        icon: "◈",
        description: "Quartz reduced to a fine powder."
    }
];

export function getMaterial(materialId) {
    return materials.find(material => material.id === materialId) ?? null;
}