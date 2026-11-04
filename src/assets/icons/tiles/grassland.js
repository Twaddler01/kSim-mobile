import { addShapes, createSvgElement, addFeatherMask } from "../svgHelpers.js";

// --- Base grass A ---
function drawGrassA(svg) {
    addFeatherMask(svg, "fade-a");
    const g = createSvgElement("g", { mask: "url(#fade-a)" });
    svg.appendChild(g);

    addShapes(g, [
        { tag: "rect", attrs: { width: 48, height: 48, fill: "#2d3d2a" } },
        {
            tag: "ellipse",
            attrs: {
                cx: 12,
                cy: 20,
                rx: 5,
                ry: 2.5,
                fill: "#26331f",
                opacity: 0.65
            }
        },
        {
            tag: "ellipse",
            attrs: {
                cx: 36,
                cy: 30,
                rx: 6,
                ry: 3,
                fill: "#26331f",
                opacity: 0.55
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M8 22 Q10 18 12 22",
                fill: "none",
                stroke: "#4a5a3a",
                "stroke-width": 1,
                "stroke-linecap": "round"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M30 14 Q32 10 34 14",
                fill: "none",
                stroke: "#4a5a3a",
                "stroke-width": 1,
                "stroke-linecap": "round"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M20 38 Q22 34 24 38",
                fill: "none",
                stroke: "#4a5a3a",
                "stroke-width": 1,
                "stroke-linecap": "round"
            }
        }
    ]);
}

// --- Base grass B (slightly lighter, different pattern) ---
function drawGrassB(svg) {
    addFeatherMask(svg, "fade-b");
    const g = createSvgElement("g", { mask: "url(#fade-b)" });
    svg.appendChild(g);

    addShapes(g, [
        { tag: "rect", attrs: { width: 48, height: 48, fill: "#35462f" } },
        {
            tag: "ellipse",
            attrs: {
                cx: 24,
                cy: 10,
                rx: 7,
                ry: 3,
                fill: "#3d5436",
                opacity: 0.75
            }
        },
        {
            tag: "ellipse",
            attrs: {
                cx: 10,
                cy: 38,
                rx: 5,
                ry: 2,
                fill: "#26331f",
                opacity: 0.5
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M15 30 Q17 26 19 30",
                fill: "none",
                stroke: "#5a6a4a",
                "stroke-width": 1,
                "stroke-linecap": "round"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M32 22 Q34 18 36 22",
                fill: "none",
                stroke: "#5a6a4a",
                "stroke-width": 1,
                "stroke-linecap": "round"
            }
        }
    ]);
}

// --- Scatter: small flower cluster (no feather needed — small discrete) ---
function drawFlowers(svg) {
    addShapes(svg, [
        { tag: "circle", attrs: { cx: 20, cy: 22, r: 1.5, fill: "#e0c060" } },
        { tag: "circle", attrs: { cx: 28, cy: 26, r: 1.5, fill: "#e0c060" } },
        { tag: "circle", attrs: { cx: 24, cy: 30, r: 1.3, fill: "#d0b050" } },
        { tag: "circle", attrs: { cx: 18, cy: 28, r: 1, fill: "#e8d070" } },
        {
            tag: "path",
            attrs: {
                d: "M22 24 Q22 28 21 30",
                fill: "none",
                stroke: "#3a4a2a",
                "stroke-width": 0.8,
                "stroke-linecap": "round"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M26 28 Q26 30 25 32",
                fill: "none",
                stroke: "#3a4a2a",
                "stroke-width": 0.8,
                "stroke-linecap": "round"
            }
        }
    ]);
}

// --- Scatter: small rock ---
function drawSmallRock(svg) {
    addShapes(svg, [
        {
            tag: "ellipse",
            attrs: { cx: 24, cy: 28, rx: 6, ry: 2.5, fill: "rgba(0,0,0,0.35)" }
        },
        {
            tag: "path",
            attrs: {
                d: "M18 26 Q18 20 24 19 Q30 20 30 26 Q28 30 22 30 Z",
                fill: "#6a7078",
                stroke: "#8a9098",
                "stroke-width": 0.6
            }
        },
        {
            tag: "path",
            attrs: { d: "M20 22 Q22 20 24 20 L23 26 L19 25 Z", fill: "#8a9098" }
        }
    ]);
}

export const grasslandTiles = {
    grassA: drawGrassA,
    grassB: drawGrassB,
    flowers: drawFlowers,
    smallRock: drawSmallRock
};
