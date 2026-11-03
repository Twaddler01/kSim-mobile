// src/ui/panels/FieldScene.js
// Field-work adapter over FieldCanvas.

import FieldCanvas from "./FieldCanvas.js";
import { materials } from "../../data/materials.js";

const DEPOSIT_COUNT = 10;
const WORLD_W = 1200;
const WORLD_H = 900;

// Deterministic per-field RNG so a field looks the same across renders.
function seededRandom(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
    };
}

function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

export default class FieldScene {
    constructor({ field, onGather, getSprites = () => ({}) }) {
        this.field = field;
        this.onGather = onGather;
        this.getSprites = getSprites;
        this.rawMaterials = materials.filter(m => m.category === "raw");

        this.canvas = new FieldCanvas({
            deposits: this.buildInitialDeposits(),
            onCollect: (deposit, screenPos) =>
                this.handleCollect(deposit, screenPos),
            onRespawn: deposit => this.buildRespawn(deposit),
            showToast: null // silence per-collect toast; main.js toasts on real gather
        });

        this.collected = 0;
    }

    getElement() {
        return this.canvas.getElement();
    }

    update() {
        this.canvas.update();
    }

    deactivate() {
        this.canvas.deactivate();
    }

    // -----------------------------------------------------------------

    buildInitialDeposits() {
        const rand = seededRandom(hashString(this.field.id));
        const list = [];
        const margin = 80;

        for (let i = 0; i < DEPOSIT_COUNT; i++) {
            const material = this.pickMaterial(rand);

            // Spacing
            let x,
                y,
                attempts = 0;
            do {
                x = margin + rand() * (WORLD_W - margin * 2);
                y = margin + rand() * (WORLD_H - margin * 2);
                attempts++;
            } while (
                attempts < 40 &&
                list.some(d => Math.hypot(d.x - x, d.y - y) < 100)
            );

            list.push({
                id: `${this.field.id}-dep-${i}`,
                x,
                y,
                r: 22,
                materialId: material.id,
                richness: this.selectRichness(rand),
                label: material.name,
                sprite: this.getSpriteFor(material.id) ?? null
            });
        }

        return list;
    }

    buildRespawn(oldDeposit) {
        // Keep the same material family so the field stays coherent.
        // Swap to a fresh position so the player doesn't camp one spot.
        const rand = Math.random;
        const margin = 80;
        const material =
            this.rawMaterials.find(m => m.id === oldDeposit.materialId) ??
            this.pickMaterial(rand);

        return {
            id: oldDeposit.id,
            x: margin + rand() * (WORLD_W - margin * 2),
            y: margin + rand() * (WORLD_H - margin * 2),
            r: 22,
            materialId: material.id,
            richness: this.selectRichness(rand),
            label: material.name,
            sprite: this.getSpriteFor(material.id) ?? null
        };
    }

    pickMaterial(rand = Math.random) {
        const table = this.field.spawnTable ?? [];
        const valid = table.filter(
            e =>
                e.weight > 0 &&
                e.materialId !== "quantumParticleTrace" &&
                materials.some(m => m.id === e.materialId)
        );

        if (valid.length === 0) {
            // Legacy fallback
            const m = materials.find(m => m.id === this.field.materialId);
            return (
                m ??
                this.rawMaterials[Math.floor(rand() * this.rawMaterials.length)]
            );
        }

        const total = valid.reduce((s, e) => s + e.weight, 0);
        let roll = rand() * total;
        for (const e of valid) {
            roll -= e.weight;
            if (roll < 0) return materials.find(m => m.id === e.materialId);
        }
        return materials.find(m => m.id === valid[valid.length - 1].materialId);
    }

    handleCollect(deposit, screenPos) {
        this.collected++;

        this.onGather?.(this.field, screenPos, {
            // ← pass this.field first
            id: deposit.materialId,
            richness: deposit.richness
        });
    }

    getSpriteFor(materialId) {
        return this.getSprites()[materialId] ?? null;
    }

    refreshSprites() {
        for (const d of this.canvas.deposits) {
            d.sprite = this.getSpriteFor(d.materialId);
        }
    }

    selectRichness(rand = Math.random) {
        const table = this.field.richnessTable ?? [{ amount: 1, weight: 1 }];

        const valid = table.filter(
            e =>
                Number.isFinite(e.amount) &&
                e.amount >= 1 &&
                Number.isFinite(e.weight) &&
                e.weight > 0
        );

        if (valid.length === 0) return 1;

        const total = valid.reduce((s, e) => s + e.weight, 0);
        let roll = rand() * total;
        for (const e of valid) {
            roll -= e.weight;
            if (roll < 0) return e.amount;
        }
        return valid[valid.length - 1].amount;
    }
}
