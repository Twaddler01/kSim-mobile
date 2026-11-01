export const progressionUnlocks = [
    {
        id: "advancedFabrication",
        name: "Fabricator",
        description: "Unlocks advanced material fabrication.",
        initialUnlocked: false,
        trigger: {
            type: "inventoryAmount",
            item: "research",
            amount: 100
        }
    }
];