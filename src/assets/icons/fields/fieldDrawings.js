import { addShapes } from "../svgHelpers.js";

// Lab Valley — an opening between rocky hills, path leading in,
// a lone pine for scale, hints of quartz and copper in the landscape.
function drawLabValley(svg) {
    addShapes(svg, [
        // Sky (matches game bg, kept atmospheric)
        {
            tag: "rect",
            attrs: { x: 2, y: 2, width: 44, height: 44, rx: 4, fill: "#0d1a26" }
        },

        // Far mountains (silhouette, darkest)
        {
            tag: "path",
            attrs: {
                d: "M2 32 L8 22 L13 26 L18 18 L24 24 L30 20 L36 26 L42 22 L46 24 L46 46 L2 46 Z",
                fill: "#1a2a38"
            }
        },

        // Mid hills (rolling, slightly lighter)
        {
            tag: "path",
            attrs: {
                d: "M2 34 Q10 30 18 33 Q26 28 34 32 Q40 30 46 32 L46 46 L2 46 Z",
                fill: "#25384a"
            }
        },

        // Valley floor (near ground, lighter still)
        {
            tag: "path",
            attrs: { d: "M2 38 L46 38 L46 46 L2 46 Z", fill: "#3a4c5a" }
        },

        // Path winding into the valley (warm brown, draws the eye)
        {
            tag: "path",
            attrs: {
                d: "M21 46 Q23 42 22 38 Q21 35 23 32 L26 32 Q24 35 25 38 Q26 42 25 46 Z",
                fill: "#5a4530",
                opacity: 0.9
            }
        },

        // Pine tree (left landmark — sells "outdoor place")
        {
            tag: "path",
            attrs: {
                d: "M11 22 L6 32 L9 32 L5 40 L17 40 L13 32 L16 32 Z",
                fill: "#1a3a2a"
            }
        },
        {
            tag: "rect",
            attrs: { x: 10.2, y: 39, width: 1.6, height: 3, fill: "#3a2818" }
        },

        // Rock outcrop (right landmark — subtly echoes stone deposits)
        {
            tag: "path",
            attrs: {
                d: "M35 33 L33 29 L36 27 L39 29 L40 33 L38 36 L35 36 Z",
                fill: "#6a7580",
                stroke: "#a3adb8",
                "stroke-width": 0.6,
                "stroke-linejoin": "round"
            }
        },
        {
            tag: "path",
            attrs: { d: "M36 27 L38 30 L40 33 L37 32 Z", fill: "#8a95a0" }
        },

        // Quartz glint (hint at crystal deposits)
        {
            tag: "path",
            attrs: {
                d: "M28 20 L29 18 L30 20 L29 22 Z",
                fill: "#a8d8ff",
                opacity: 0.85
            }
        },

        // Copper fleck (hint at ore)
        {
            tag: "circle",
            attrs: { cx: 32, cy: 41, r: 0.9, fill: "#d89060", opacity: 0.75 }
        },

        // Pebble on path
        {
            tag: "ellipse",
            attrs: { cx: 23, cy: 42, rx: 1.3, ry: 0.8, fill: "#4a3a2a" }
        }
    ]);
}

// Registry — each field is an object of variants.
// For now only `default` exists. When a "field core" (abstract type
// icon) or "wide" (banner version) is authored, just add the key:
//   labValley: { default: drawLabValley, core: drawLabValleyCore }
export const fieldDrawings = {
    labValley: { default: drawLabValley }
};

export function getFieldDrawing(fieldId, variant = "default") {
    const entry = fieldDrawings[fieldId];
    if (!entry) return null;
    return entry[variant] ?? entry.default ?? null;
}

export function hasFieldDrawing(fieldId, variant = "default") {
    return getFieldDrawing(fieldId, variant) !== null;
}
