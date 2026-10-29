export default class SaveManager {
    constructor({ key, initialData }) {
        this.key = key;
        this.initialData = initialData;
    }

    freshGame() {
        const game = JSON.parse(JSON.stringify(this.initialData));
        const timestamp = Date.now();

        game.log = (game.log ?? []).map(entry => ({
            ...entry,
            timestamp
        }));

        return game;
    }

    load() {
        try {
            const saved = localStorage.getItem(this.key);

            if (!saved) {
                return this.freshGame();
            }

            const parsed = JSON.parse(saved);

            return {
                ...this.freshGame(),
                ...parsed,

                resources: {
                    ...this.initialData.resources,
                    ...(parsed.resources ?? {})
                },

                upgrades: {
                    ...this.initialData.upgrades,
                    ...(parsed.upgrades ?? {})
                },

                discoveries: Array.isArray(parsed.discoveries)
                    ? parsed.discoveries
                    : [],

                log: Array.isArray(parsed.log) ? parsed.log : [],

                triggered: Array.isArray(parsed.triggered)
                    ? parsed.triggered
                    : [],

                inventory: {
                    ...(this.initialData.inventory ?? {}),
                    ...(parsed.inventory ?? {})
                },
                
                manufacturing: {
                    ...(this.initialData.manufacturing ?? {}),
                    ...(parsed.manufacturing ?? {}),
                    completedRecipes: Array.isArray(
                        parsed.manufacturing?.completedRecipes
                    )
                        ? parsed.manufacturing.completedRecipes
                        : []
                }
            };
        } catch (error) {
            console.warn("Could not load Quantum Foundations save:", error);
            return this.freshGame();
        }
    }

    save(game) {
    try {
        localStorage.setItem(this.key, JSON.stringify(game));
        return true;
    } catch (error) {
        console.warn("Could not save Quantum Foundations:", error);
        return false;
    }
}

    clear() {
        localStorage.removeItem(this.key);
    }
}
