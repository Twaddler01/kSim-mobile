// src/data/mineralSprites.js
import { materialDrawings } from "../assets/icons/materials/materialDrawings.js";
import { materials } from "./materials.js";

function svgToImage(drawFn, size = 64) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("viewBox", "0 0 48 48");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    drawFn(svg);

    const xml = new XMLSerializer().serializeToString(svg);
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;

    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

export async function buildMineralSprites() {
    const cache = {};
    const raw = materials.filter(m => m.category === "raw");

    await Promise.all(
        raw.map(async m => {
            const drawing = materialDrawings[m.id];
            if (!drawing?.core) return;
            const img = await svgToImage(drawing.core, 64);
            if (img) cache[m.id] = img;
        })
    );

    return cache;
}
