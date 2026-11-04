// src/ui/panels/FieldScene.js
// Field-work adapter over FieldCanvas.

/*
Want -- Change
More/less rotation (rand() - 0.5) * 0.35 → * 0.2 (subtle) or * 0.5 (noticeable)
More/less scale variety 0.9 + rand() * 0.2 → 0.95 + rand() * 0.1 (subtle) or 0.85 + rand() * 0.3 (bold)
More crumbs 3 + Math.floor(rand() * 3) → 5 + Math.floor(rand() * 4)
Bigger crumbs 1 + rand() * 1.5 → 1.2 + rand() * 2
Wider scatter 0.8 + rand() * 0.8 → 0.7 + rand() * 1.1
Crumbs further down (more "base") + s * 0.28 → + s * 0.35
Softer shadow rgba(0,0,0,0.35) → rgba(0,0,0,0.25)
Per-material crumb color materialDrawings.js → crumbs: [...] on that entry
*/

import FieldCanvas from "./FieldCanvas.js";
import { materials } from "../../data/materials.js";
import { getCrumbColors } from "../../assets/icons/materials/materialDrawings.js";

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

        // Resolve tuning from the field, falling back to engine defaults.
        this.world = {
            width: field.world?.width ?? 1200,
            height: field.world?.height ?? 900
        };
        this.depositCount = field.depositCount ?? 10;
        this.respawnDelay = field.respawnSeconds ?? 3;
        this.margin = field.margin ?? 80;
        this.minSpacing = field.minSpacing ?? 100;
        this.depositRadius = field.depositRadius ?? 22;

        this.canvas = new FieldCanvas({
            deposits: this.buildInitialDeposits(),
            world: this.world,
            respawnDelay: this.respawnDelay,
            onCollect: (deposit, screenPos) =>
                this.handleCollect(deposit, screenPos),
            onRespawn: deposit => this.buildRespawn(deposit),
            showToast: null
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
        const { margin, minSpacing, depositRadius, depositCount } = this;
        const ww = this.world.width;
        const wh = this.world.height;

        for (let i = 0; i < depositCount; i++) {
            const material = this.pickMaterial(rand);
            const richness = this.selectRichness(rand);
            const rotation = (rand() - 0.5) * 0.35;    // ±0.175 rad ≈ ±10°
            const scale = 0.9 + rand() * 0.2;          // 0.9 – 1.1
            const crumbs = this.makeCrumbs(rand, material.id, depositRadius);

            let x,
                y,
                attempts = 0;
            do {
                x = margin + rand() * (ww - margin * 2);
                y = margin + rand() * (wh - margin * 2);
                attempts++;
            } while (
                attempts < 40 &&
                list.some(d => Math.hypot(d.x - x, d.y - y) < minSpacing)
            );

            list.push({
                id: `${this.field.id}-dep-${i}`,
                x,
                y,
                r: depositRadius,
                materialId: material.id,
                richness,
                strikesRequired: this.selectStrikes(richness, material.id),
                sparkleTier: this.selectSparkleTier(richness, material.id),
                label: material.name,
                sprite: this.getSpriteFor(material.id) ?? null,
                rotation,
                scale,
                crumbs
            });
        }

        return list;
    }

    buildRespawn(oldDeposit) {
        const rand = Math.random;
        const { margin, depositRadius } = this;
        const ww = this.world.width;
        const wh = this.world.height;

        const material =
            this.rawMaterials.find(m => m.id === oldDeposit.materialId) ??
            this.pickMaterial(rand);
        const richness = this.selectRichness(rand);
        const rotation = (rand() - 0.5) * 0.35;    // ±0.175 rad ≈ ±10°
        const scale = 0.9 + rand() * 0.2;          // 0.9 – 1.1
        const crumbs = this.makeCrumbs(rand, material.id, depositRadius);
        
        return {
            id: oldDeposit.id,
            x: margin + rand() * (ww - margin * 2),
            y: margin + rand() * (wh - margin * 2),
            r: depositRadius,
            materialId: material.id,
            richness,
            strikesRequired: this.selectStrikes(richness, material.id),
            sparkleTier: this.selectSparkleTier(richness, material.id),
            label: material.name,
            sprite: this.getSpriteFor(material.id) ?? null,
            rotation,
            scale,
            crumbs
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

    getSpriteFor(materialId, variant = "field") {
        const entry = this.getSprites()[materialId];
        if (!entry) return null;

        // Legacy flat cache: { stone: Image }
        if (!entry.core && !entry.field) return entry;

        // Nested cache: { stone: { core, field } }
        return entry[variant] ?? entry.core ?? null;
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

    selectStrikes(richness, materialId) {
        // 1. Field override (opt-in)
        const table = this.field.strikeCountTable;
        if (Array.isArray(table)) {
            const entry = table.find(e => e.richness === richness);
            if (entry && Number.isFinite(entry.strikes)) {
                return Math.max(1, Math.round(entry.strikes));
            }
        }

        // 2. Material base + richness scaling
        //    base = 2 preserves current behavior (richness 1 = 2 strikes)
        const material = materials.find(m => m.id === materialId);
        const base = material?.mining?.strikesBase ?? 2;
        return Math.max(1, base + (richness - 1));
    }

    selectSparkleTier(richness, materialId) {
        // 1. Field override (opt-in)
        const table = this.field.sparkleTable;
        if (Array.isArray(table)) {
            const entry = table.find(e => e.richness === richness);
            if (entry && Number.isFinite(entry.tier)) {
                return Math.max(0, Math.min(3, entry.tier));
            }
        }

        // 2. Material base + richness scaling
        //    base = 0 preserves current behavior (richness 1 = 0 sparkles)
        const material = materials.find(m => m.id === materialId);
        const base = material?.mining?.sparkleBase ?? 0;
        return Math.max(0, Math.min(3, base + (richness - 1)));
    }

    makeCrumbs(rand, materialId, depositRadius) {
        const colors = getCrumbColors(materialId) ?? ["#586378"];
        const count = 5 + Math.floor(rand() * 3); // 3–5 crumbs

        const crumbs = [];
        for (let i = 0; i < count; i++) {
            const angle = rand() * Math.PI * 2;
            const dist = depositRadius * (0.8 + rand() * 0.8); // 0.8r – 1.6r

            crumbs.push({
                dx: Math.cos(angle) * dist,
                dy: Math.sin(angle) * dist * 0.7, // squash Y = top-down
                r: 1 + rand() * 1.5, // 1–2.5px
                color: colors[Math.floor(rand() * colors.length)],
                alpha: 0.55 + rand() * 0.35 // 0.55–0.9
            });
        }
        return crumbs;
    }
}
