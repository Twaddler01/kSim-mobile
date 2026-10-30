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
            const fresh = this.freshGame();

            const savedData = parsed;
            
            return {
                ...fresh,
                ...savedData,

                resources: {
                    ...fresh.resources,
                    ...(parsed.resources ?? {})
                },

                upgrades: {
                    ...fresh.upgrades,
                    ...(parsed.upgrades ?? {})
                },

                discoveries: Array.isArray(parsed.discoveries)
                    ? parsed.discoveries
                    : [],

                events: {
                    ...(fresh.events ?? {}),
                    ...(parsed.events ?? {})
                },

                unlocks: {
                    ...(fresh.unlocks ?? {}),
                    ...(parsed.unlocks ?? {})
                },

                log: Array.isArray(parsed.log) ? parsed.log : fresh.log,

                logOnce: {
                    ...(fresh.logOnce ?? {}),
                    ...(parsed.logOnce ?? {})
                },

                tabReadIds: {
                    ...(fresh.tabReadIds ?? {}),
                    ...(parsed.tabReadIds ?? {})
                },

                unread: {
                    ...(fresh.unread ?? {}),
                    ...(parsed.unread ?? {}),
                    items: {
                        ...(fresh.unread?.items ?? {}),
                        ...(parsed.unread?.items ?? {})
                    },
                    pending: {
                        ...(fresh.unread?.pending ?? {}),
                        ...(parsed.unread?.pending ?? {})
                    },
                    badgeExcluded: {
                        ...(fresh.unread?.badgeExcluded ?? {}),
                        ...(parsed.unread?.badgeExcluded ?? {})
                    }
                },

                inventory: {
                    ...(fresh.inventory ?? {}),
                    ...(parsed.inventory ?? {})
                },

                operations: {
                    ...(fresh.operations ?? {}),
                    ...(parsed.operations ?? {}),
                    discoveredMaterials: {
                        ...(fresh.operations?.discoveredMaterials ?? {}),
                        ...(parsed.operations?.discoveredMaterials ?? {})
                    }
                },

                appState: {
                    ...(fresh.appState ?? {}),
                    ...(parsed.appState ?? {}),
                    navigation: {
                        ...(fresh.appState?.navigation ?? {}),
                        ...(parsed.appState?.navigation ?? {})
                    }
                },

                manufacturing: {
                    ...(fresh.manufacturing ?? {}),
                    ...(parsed.manufacturing ?? {}),
                    completedRecipes: Array.isArray(
                        parsed.manufacturing?.completedRecipes
                    )
                        ? parsed.manufacturing.completedRecipes
                        : [...(fresh.manufacturing?.completedRecipes ?? [])]
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
