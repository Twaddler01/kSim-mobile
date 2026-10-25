export default class SaveManager {
    constructor({ key, initialData }) {
        this.key = key;
        this.initialData = initialData;
    }

    freshGame() {
        return JSON.parse(JSON.stringify(this.initialData));
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

                log: Array.isArray(parsed.log)
                    ? parsed.log
                    : [...this.initialData.log],

                triggered: Array.isArray(parsed.triggered)
                    ? parsed.triggered
                    : [],

                announcement: parsed.announcement ?? null
            };
        } catch (error) {
            console.warn("Could not load Quantum Foundations save:", error);
            return this.freshGame();
        }
    }

    save(game) {
        try {
            localStorage.setItem(this.key, JSON.stringify(game));
        } catch (error) {
            console.warn("Could not save Quantum Foundations:", error);
        }
    }

    clear() {
        localStorage.removeItem(this.key);
    }
}
