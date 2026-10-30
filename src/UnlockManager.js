/**
 * Tracks permanent progression unlocks.
 * Unlocks are permanent once earned.
 */
export default class UnlockManager {
    constructor(game) {
        if (!game) {
            throw new Error("UnlockManager requires game state.");
        }

        this.game = game;
        this.definitions = new Map();

        game.unlocks ??= {};
    }

    registerUnlock(definition) {
        if (!definition?.id) {
            throw new Error("An unlock definition requires an id.");
        }

        this.definitions.set(definition.id, definition);

        if (typeof this.game.unlocks[definition.id] !== "boolean") {
            this.game.unlocks[definition.id] =
                definition.initialUnlocked === true;
        } else if (definition.initialUnlocked === true) {
            this.game.unlocks[definition.id] = true;
        }

        return this.getState(definition.id);
    }

    isUnlocked(id) {
        return this.game.unlocks?.[id] === true;
    }

    getState(id) {
        if (!this.definitions.has(id)) return undefined;

        return {
            id,
            unlocked: this.isUnlocked(id),
            definition: this.definitions.get(id)
        };
    }

    unlock(id) {
        if (!this.definitions.has(id) || this.isUnlocked(id)) {
            return false;
        }

        this.game.unlocks[id] = true;
        return true;
    }

    getUnlocked() {
        return [...this.definitions.keys()].filter(
            id => this.isUnlocked(id)
        );
    }
}