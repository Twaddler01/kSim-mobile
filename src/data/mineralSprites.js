// src/data/mineralSprites.js
import { getDrawing } from "../assets/icons/materials/materialDrawings.js";
import { materials } from "./materials.js";
import { svgToImage } from "./svgToImage.js";

const DEFAULT_VARIANTS = ["field", "core"];
const DEFAULT_SIZE = 64;

/**
 * Returns { [materialId]: { core?: Image, field?: Image } }.
 *
 * Every raw material is guaranteed to receive both variants —
 * getDrawing() always resolves through the generic subtype fallback
 * if no exact drawing exists, so no material is ever blank.
 */
export async function buildMineralSprites({
    variants = DEFAULT_VARIANTS,
    size = DEFAULT_SIZE
} = {}) {
    const cache = {};
    const raw = materials.filter(m => m.category === "raw");

    await Promise.all(
        raw.map(async m => {
            const entry = {};
            for (const variant of variants) {
                const draw = getDrawing(m.id, variant);
                if (!draw) continue;
                const img = await svgToImage(draw, size);
                if (img) entry[variant] = img;
            }
            if (Object.keys(entry).length > 0) cache[m.id] = entry;
        })
    );

    return cache;
}
