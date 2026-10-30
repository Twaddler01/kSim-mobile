import { evaluateTrigger } from "./triggers/conditions.js";

/**
 * Records one-time events when their conditions become true.
 *
 * Event records are historical: once an event occurs,
 * it remains recorded even if its original condition
 * later becomes false.
 */
export default class EventProcessor {
    constructor(game) {
        if (!game) {
            throw new Error("EventProcessor requires game state.");
        }

        this.game = game;
        this.definitions = new Map();

        game.events ??= {};
    }

    registerEvent(definition) {
        if (!definition?.id) {
            throw new Error("An event definition requires an id.");
        }

        if (!definition.trigger) {
            throw new Error(
                `Event "${definition.id}" requires a trigger.`
            );
        }

        this.definitions.set(definition.id, definition);

        return this.hasOccurred(definition.id);
    }

    hasOccurred(id) {
        return Boolean(this.game.events?.[id]);
    }

    getEvent(id) {
        if (!this.hasOccurred(id)) return undefined;

        return {
            id,
            ...this.game.events[id]
        };
    }

    process() {
        const occurred = [];

        for (const [id, definition] of this.definitions) {
            if (this.hasOccurred(id)) continue;

            if (!evaluateTrigger(this.game, definition.trigger)) {
                continue;
            }

            const record = {
                occurredAt: Date.now()
            };

            this.game.events[id] = record;

            occurred.push({
                id,
                definition,
                ...record
            });
        }

        return occurred;
    }
}
