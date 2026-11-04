import { getTileCache } from "./tileSprites.js";

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

function pickWeighted(entries, rand) {
    const total = entries.reduce((s, e) => s + e.weight, 0);
    let roll = rand() * total;
    for (const e of entries) {
        roll -= e.weight;
        if (roll < 0) return e;
    }
    return entries[entries.length - 1];
}

/**
 * Returns an offscreen HTMLCanvasElement at world size, or null if
 * tiles aren't ready / field has no background config.
 */
export function buildBackgroundCache(field, worldW, worldH) {
    const bg = field.background;
    if (!bg) return null;

    const tileImages = getTileCache()?.[bg.tileset];
    if (!tileImages) return null;

    const tileSize = bg.tileSize ?? 40;
    const rand = seededRandom(hashString(field.id + ":bg"));

    const canvas = document.createElement("canvas");
    canvas.width = worldW;
    canvas.height = worldH;
    const ctx = canvas.getContext("2d");

    // Layer 0: solid base color
    ctx.fillStyle = bg.baseColor ?? "#2d3d2a";
    ctx.fillRect(0, 0, worldW, worldH);

    // Layer 1: jittered overlapping base patches
    const baseTiles = bg.baseTiles ?? [{ tile: "grassA", weight: 1 }];
    const patchSize = tileSize * (bg.patchScale ?? 1.6);
    const cols = Math.ceil(worldW / tileSize) + 1;
    const rows = Math.ceil(worldH / tileSize) + 1;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cx = x * tileSize + (rand() - 0.5) * tileSize * 0.7;
            const cy = y * tileSize + (rand() - 0.5) * tileSize * 0.7;

            const pick = pickWeighted(baseTiles, rand);
            const img = tileImages[pick.tile];
            if (!img) continue;

            const size = patchSize * (0.85 + rand() * 0.3);
            const rotation = rand() * Math.PI * 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rotation);
            ctx.globalAlpha = 0.88 + rand() * 0.12;
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
            ctx.restore();
        }
    }
    ctx.globalAlpha = 1;

    // Layer 2: scatter details
    if (bg.scatter && bg.scatter.length > 0) {
        const density = bg.scatterDensity ?? 0.15;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (rand() > density) continue;

                const cx = x * tileSize + (rand() - 0.5) * tileSize * 0.5;
                const cy = y * tileSize + (rand() - 0.5) * tileSize * 0.5;

                const pick = pickWeighted(bg.scatter, rand);
                const img = tileImages[pick.tile];
                if (!img) continue;

                const size = tileSize * (0.6 + rand() * 0.5);
                const rotation = (rand() - 0.5) * 0.8;

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(rotation);
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
                ctx.restore();
            }
        }
    }

    return canvas;
}
