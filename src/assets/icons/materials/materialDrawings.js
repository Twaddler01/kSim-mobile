import { addShapes } from "./svgHelpers.js";
import { getMaterial } from "../../../data/materials.js";

// CORE
function drawStoneCore(svg) {
    const shapes = [
        {
            tag: "path",
            attrs: {
                d: "M7 17 15 6 29 4 40 14 43 27 34 40 18 43 6 32 4 23Z",
                fill: "#555e68",
                stroke: "#aeb7c2",
                "stroke-width": "1.5",
                "stroke-linejoin": "round"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M15 6 23 18 7 17Z",
                fill: "#c0c7ce"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M15 6 29 4 23 18Z",
                fill: "#929ca7"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M29 4 40 14 30 23 23 18Z",
                fill: "#737e8a"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M7 17 23 18 18 31 6 32 4 23Z",
                fill: "#89939e"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M23 18 30 23 34 40 18 43 18 31Z",
                fill: "#626c77"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M30 23 40 14 43 27 34 40Z",
                fill: "#a3adb8"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M11 25 16 21",
                fill: "none",
                stroke: "#dce1e6",
                "stroke-width": "1.5",
                "stroke-linecap": "round"
            }
        }
    ];

    addShapes(svg, shapes);
}

function drawQuartzCore(svg) {
    addShapes(svg, [
        // Dark mineral base
        {
            tag: "path",
            attrs: {
                d: "M7 34 L13 27 L21 31 L28 26 L38 32 L43 39 L36 44 L14 44 L6 39 Z",
                fill: "#55566B",
                stroke: "#34384C",
                "stroke-width": 1
            }
        },

        // Left crystal
        {
            tag: "polygon",
            attrs: {
                points: "9,29 8,18 13,12 19,18 18,32",
                fill: "#B8D9FF",
                stroke: "#E9F4FF",
                "stroke-width": 0.8
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "8,18 13,12 14,22",
                fill: "#F5FBFF"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "13,12 19,18 14,22",
                fill: "#8CB9F2"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "14,22 19,18 18,32 10,33",
                fill: "#718CC9"
            }
        },

        // Main crystal
        {
            tag: "polygon",
            attrs: {
                points: "17,30 17,12 24,3 31,12 31,33 24,38",
                fill: "#C9D8FF",
                stroke: "#F5F8FF",
                "stroke-width": 0.9,
                "stroke-linejoin": "round"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "17,12 24,3 24,17 19,21",
                fill: "#F7FCFF"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "24,3 31,12 28,21 24,17",
                fill: "#FFF0CC"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "19,21 24,17 24,35 17,30",
                fill: "#A5B7F0"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "24,17 28,21 31,12 31,33 24,35",
                fill: "#7F91D0"
            }
        },

        // Right crystal
        {
            tag: "polygon",
            attrs: {
                points: "30,32 32,19 37,14 42,20 40,34 35,38",
                fill: "#B9C8F5",
                stroke: "#EDF3FF",
                "stroke-width": 0.7
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "32,19 37,14 37,25",
                fill: "#F7FCFF"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "37,14 42,20 37,25",
                fill: "#D4BDF7"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "37,25 42,20 40,34 35,38",
                fill: "#8796D0"
            }
        },

        // Front crystal
        {
            tag: "polygon",
            attrs: {
                points: "22,37 22,29 26,25 30,29 30,38 26,41",
                fill: "#E5E8FF",
                stroke: "#FFFFFF",
                "stroke-width": 0.7
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "22,29 26,25 26,34",
                fill: "#FFFFFF"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "26,25 30,29 26,34",
                fill: "#C4B5F2"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "26,34 30,29 30,38 26,41",
                fill: "#8E9CD8"
            }
        },

        // Crystal glints
        {
            tag: "path",
            attrs: {
                d: "M20 12 L24 6 M11 18 L13 15 M34 20 L37 16",
                fill: "none",
                stroke: "#FFFFFF",
                "stroke-width": 0.9,
                "stroke-linecap": "round",
                opacity: 0.9
            }
        }
    ]);
}

function drawCopperCore(svg) {
    const shapes = [
        {
            tag: "path",
            attrs: {
                d: "M24 3 38 12 42 29 29 43 12 39 5 23 11 9Z",
                fill: "#713b2b",
                stroke: "#f0a078",
                "stroke-width": "1.5",
                "stroke-linejoin": "round"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M24 3 25 20 11 9Z",
                fill: "#f4b08a"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M24 3 38 12 25 20Z",
                fill: "#c87950"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M11 9 25 20 12 29 5 23Z",
                fill: "#db895d"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M25 20 38 12 42 29 27 30Z",
                fill: "#a95c3d"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M12 29 25 20 27 30 29 43 12 39Z",
                fill: "#b96b49"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M27 30 42 29 29 43Z",
                fill: "#e6a078"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M18 13 22 10",
                fill: "none",
                stroke: "#ffe0c7",
                "stroke-width": "1.5",
                "stroke-linecap": "round"
            }
        }
    ];

    addShapes(svg, shapes);
}

// FIELD VARIANTS
function drawStoneField(svg) {
    addShapes(svg, [
        // Ground shadow
        {
            tag: "ellipse",
            attrs: { cx: 24, cy: 39, rx: 19, ry: 5, fill: "#2a1e14", opacity: 0.75 }
        },
        // Boulder body — rounder than the octagonal core
        {
            tag: "path",
            attrs: {
                d: "M9 30 Q7 22 12 15 Q18 9 26 8 Q34 9 39 16 Q42 23 40 31 Q36 39 26 40 Q16 40 10 36 Z",
                fill: "#555e68",
                stroke: "#aeb7c2",
                "stroke-width": "1.2",
                "stroke-linejoin": "round"
            }
        },
        // Facets
        {
            tag: "path",
            attrs: { d: "M12 15 Q18 9 26 8 L24 20 Q18 20 14 22 Z", fill: "#c0c7ce" }
        },
        {
            tag: "path",
            attrs: { d: "M26 8 Q34 9 39 16 Q35 22 28 22 Z", fill: "#929ca7" }
        },
        {
            tag: "path",
            attrs: { d: "M14 22 Q20 22 24 20 L22 30 Q16 30 12 28 Z", fill: "#737e8a" }
        },
        {
            tag: "path",
            attrs: {
                d: "M28 22 Q35 22 39 26 Q38 32 32 35 Q26 34 25 28 Z",
                fill: "#89939e"
            }
        },
        // Pebbles at base
        {
            tag: "ellipse",
            attrs: { cx: 10, cy: 38, rx: 3, ry: 2, fill: "#6b7480" }
        },
        {
            tag: "ellipse",
            attrs: { cx: 38, cy: 39, rx: 3.5, ry: 2.2, fill: "#5a6370" }
        },
        // Highlight glint
        {
            tag: "path",
            attrs: {
                d: "M14 17 L18 13",
                fill: "none",
                stroke: "#dce1e6",
                "stroke-width": "1.2",
                "stroke-linecap": "round"
            }
        }
    ]);
}

function drawQuartzField(svg) {
    addShapes(svg, [
        {
            tag: "ellipse",
            attrs: { cx: 24, cy: 41, rx: 20, ry: 4.5, fill: "#2a1e14", opacity: 0.75 }
        },
        // Rock base
        {
            tag: "path",
            attrs: {
                d: "M6 36 L10 30 L18 32 L26 28 L36 33 L42 38 L38 43 L12 43 Z",
                fill: "#55566B",
                stroke: "#34384C",
                "stroke-width": 1
            }
        },
        // Left crystal — shorter than core, rooted
        {
            tag: "polygon",
            attrs: {
                points: "11,32 10,20 15,16 20,22 19,34",
                fill: "#B8D9FF",
                stroke: "#E9F4FF",
                "stroke-width": 0.7
            }
        },
        { tag: "polygon", attrs: { points: "10,20 15,16 16,25", fill: "#F5FBFF" } },
        { tag: "polygon", attrs: { points: "15,16 20,22 16,25", fill: "#8CB9F2" } },
        // Main crystal — lower profile
        {
            tag: "polygon",
            attrs: {
                points: "19,34 19,16 25,9 32,16 31,36 25,40",
                fill: "#C9D8FF",
                stroke: "#F5F8FF",
                "stroke-width": 0.8
            }
        },
        { tag: "polygon", attrs: { points: "19,16 25,9 25,22 21,25", fill: "#F7FCFF" } },
        { tag: "polygon", attrs: { points: "25,9 32,16 29,24 25,22", fill: "#FFF0CC" } },
        {
            tag: "polygon",
            attrs: { points: "21,25 25,22 25,37 19,34", fill: "#A5B7F0" }
        },
        {
            tag: "polygon",
            attrs: { points: "25,22 29,24 31,36 25,37", fill: "#7F91D0" }
        },
        // Right small crystal
        {
            tag: "polygon",
            attrs: {
                points: "31,34 32,24 37,21 40,27 38,36",
                fill: "#B9C8F5",
                stroke: "#EDF3FF",
                "stroke-width": 0.6
            }
        },
        { tag: "polygon", attrs: { points: "32,24 37,21 36,29", fill: "#F7FCFF" } },
        // Pebbles
        { tag: "ellipse", attrs: { cx: 9, cy: 42, rx: 2, ry: 1.5, fill: "#4a4a5a" } },
        {
            tag: "ellipse",
            attrs: { cx: 40, cy: 42, rx: 2.5, ry: 1.5, fill: "#4a4a5a" }
        }
    ]);
}

function drawCopperField(svg) {
    addShapes(svg, [
        {
            tag: "ellipse",
            attrs: { cx: 24, cy: 40, rx: 18, ry: 5, fill: "#2a1e14", opacity: 0.75 }
        },
        // Rock body (grayish base, not pure copper)
        {
            tag: "path",
            attrs: {
                d: "M8 30 Q6 22 12 14 Q20 7 30 8 Q38 10 41 18 Q43 26 39 33 Q34 40 22 41 Q13 40 8 34 Z",
                fill: "#5a5350",
                stroke: "#8a8280",
                "stroke-width": "1.2",
                "stroke-linejoin": "round"
            }
        },
        {
            tag: "path",
            attrs: { d: "M12 14 Q20 7 30 8 L27 20 Q19 20 15 22 Z", fill: "#7a746e" }
        },
        {
            tag: "path",
            attrs: { d: "M30 8 Q38 10 41 18 Q37 22 30 22 Z", fill: "#6a635e" }
        },
        {
            tag: "path",
            attrs: { d: "M15 22 Q22 22 27 20 L25 30 Q17 30 12 27 Z", fill: "#504a46" }
        },
        {
            tag: "path",
            attrs: {
                d: "M30 22 Q37 22 41 26 Q39 34 32 37 Q25 33 25 30 Z",
                fill: "#645d58"
            }
        },
        // Copper vein streaks
        {
            tag: "path",
            attrs: {
                d: "M18 15 Q22 18 24 24 Q26 29 24 36",
                fill: "none",
                stroke: "#c87950",
                "stroke-width": 2.2,
                "stroke-linecap": "round"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M24 24 Q30 22 36 24",
                fill: "none",
                stroke: "#f0a078",
                "stroke-width": 1.8,
                "stroke-linecap": "round"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M20 30 Q14 30 11 33",
                fill: "none",
                stroke: "#a95c3d",
                "stroke-width": 1.5,
                "stroke-linecap": "round"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M22 17 L26 15",
                fill: "none",
                stroke: "#ffe0c7",
                "stroke-width": 1.2,
                "stroke-linecap": "round"
            }
        },
        {
            tag: "ellipse",
            attrs: { cx: 9, cy: 38, rx: 2.5, ry: 1.8, fill: "#4a4440" }
        },
        {
            tag: "ellipse",
            attrs: { cx: 39, cy: 39, rx: 3, ry: 2, fill: "#4a4440" }
        }
    ]);
}

// SUBTYPE GENERIC
// --- Generic "mineral" (silicon, silica, clay, sulfur, etc.) ---
function drawGenericMineral(svg) {
    addShapes(svg, [
        {
            tag: "path",
            attrs: {
                d: "M12 40 L16 26 L22 22 L28 26 L32 40 Z",
                fill: "#8892a0",
                stroke: "#c5cdd6",
                "stroke-width": 0.8
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M18 40 L20 24 L26 20 L32 24 L32 40 Z",
                fill: "#a3adb8",
                stroke: "#dce1e6",
                "stroke-width": 0.8
            }
        },
        {
            tag: "path",
            attrs: { d: "M22 22 L26 20 L26 28 L22 30 Z", fill: "#e0e6ec" }
        },
        {
            tag: "path",
            attrs: { d: "M20 24 L26 20 L24 18 L18 20 Z", fill: "#b0bac5" }
        }
    ]);
}

// --- Generic "ore" (iron, aluminum, nickel, zinc, etc.) ---
function drawGenericOre(svg) {
    addShapes(svg, [
        {
            tag: "path",
            attrs: {
                d: "M8 32 Q6 24 12 16 Q20 8 30 10 Q38 12 41 20 Q43 28 38 35 Q32 42 20 42 Q12 40 8 34 Z",
                fill: "#5a5450",
                stroke: "#8a8280",
                "stroke-width": 1
            }
        },
        {
            tag: "path",
            attrs: { d: "M12 16 Q20 8 30 10 L28 22 Q20 22 16 24 Z", fill: "#7a746e" }
        },
        {
            tag: "path",
            attrs: { d: "M30 10 Q38 12 41 20 Q36 22 30 22 Z", fill: "#6a635e" }
        },
        {
            tag: "path",
            attrs: {
                d: "M18 20 Q22 26 22 34 M22 28 Q28 26 34 28",
                fill: "none",
                stroke: "#d08a50",
                "stroke-width": 1.8,
                "stroke-linecap": "round"
            }
        }
    ]);
}

// --- Generic "anomalous" (meteorite, isotope, anomalous crystal, etc.) ---
function drawGenericAnomalous(svg) {
    addShapes(svg, [
        {
            tag: "ellipse",
            attrs: { cx: 24, cy: 32, rx: 16, ry: 8, fill: "#4a2a6a", opacity: 0.35 }
        },
        {
            tag: "path",
            attrs: {
                d: "M10 30 Q8 22 14 14 Q22 8 30 10 Q38 14 40 22 Q41 30 34 36 Q26 40 18 38 Q12 34 10 30 Z",
                fill: "#4a4450",
                stroke: "#8a7aa0",
                "stroke-width": 1
            }
        },
        {
            tag: "circle",
            attrs: { cx: 24, cy: 24, r: 6, fill: "#d090ff", opacity: 0.6 }
        },
        { tag: "circle", attrs: { cx: 24, cy: 24, r: 3, fill: "#f0d0ff" } },
        {
            tag: "path",
            attrs: {
                d: "M24 12 L24 18 M24 30 L24 36 M12 24 L18 24 M30 24 L36 24",
                fill: "none",
                stroke: "#b090ff",
                "stroke-width": 1.2,
                "stroke-linecap": "round",
                opacity: 0.6
            }
        }
    ]);
}

// --- Generic "metal" / "alloy" (ingots, conductive alloy, etc.) ---
function drawGenericMetal(svg) {
    addShapes(svg, [
        { tag: "path", attrs: { d: "M8 34 L14 24 L36 24 L40 34 Z", fill: "#8a929c", stroke: "#c5cdd6", "stroke-width": 1 } },
        { tag: "path", attrs: { d: "M14 24 L20 14 L34 14 L36 24 Z", fill: "#b0bac5", stroke: "#e0e6ec", "stroke-width": 1 } },
        { tag: "path", attrs: { d: "M20 14 L34 14 L36 24 L22 24 Z", fill: "#d0d8e0", opacity: 0.55 } },
    ]);
}

// --- Generic "ceramic" / "glass" ---
function drawGenericCeramic(svg) {
    addShapes(svg, [
        { tag: "path", attrs: { d: "M14 12 L34 12 L36 36 L12 36 Z", fill: "#a3c0d6", stroke: "#e0f0ff", "stroke-width": 1 } },
        { tag: "path", attrs: { d: "M14 12 L20 12 L20 36 L12 36 Z", fill: "#e0f0ff", opacity: 0.7 } },
        { tag: "path", attrs: { d: "M18 18 L24 18 L22 30", fill: "none", stroke: "#ffffff", "stroke-width": 1, opacity: 0.8 } }
    ]);
}

// --- Generic "chemical" ---
function drawGenericChemical(svg) {
    addShapes(svg, [
        { tag: "rect", attrs: { x: 18, y: 8, width: 12, height: 8, fill: "#5a6474", stroke: "#8892a0", "stroke-width": 0.8 } },
        { tag: "path", attrs: { d: "M16 16 L32 16 L32 40 L16 40 Z", fill: "#88e0b0", stroke: "#5a6474", "stroke-width": 1 } },
        { tag: "path", attrs: { d: "M16 26 L32 26 L32 40 L16 40 Z", fill: "#4ac090", opacity: 0.85 } },
        { tag: "path", attrs: { d: "M20 20 L28 20", fill: "none", stroke: "#c8ffe0", "stroke-width": 1.2, opacity: 0.8 } }
    ]);
}

// --- Generic "advanced" crystal ---
function drawGenericAdvanced(svg) {
    addShapes(svg, [
        { tag: "polygon", attrs: { points: "24,6 34,16 34,32 24,42 14,32 14,16", fill: "#b0d0ff", stroke: "#f0f8ff", "stroke-width": 1 } },
        { tag: "polygon", attrs: { points: "24,6 34,16 24,22 14,16", fill: "#e8f4ff" } },
        { tag: "polygon", attrs: { points: "14,16 24,22 14,32", fill: "#8ea8e0" } },
        { tag: "polygon", attrs: { points: "34,16 34,32 24,22", fill: "#a4bcf0" } },
        { tag: "circle", attrs: { cx: 24, cy: 26, r: 2.2, fill: "#ffffff", opacity: 0.9 } }
    ]);
}

// --- Generic "component" (PCB-style chip) ---
function drawGenericComponent(svg) {
    addShapes(svg, [
        { tag: "rect", attrs: { x: 10, y: 16, width: 28, height: 16, rx: 2, fill: "#3a4453", stroke: "#7cc8ff", "stroke-width": 1 } },
        { tag: "rect", attrs: { x: 14, y: 20, width: 20, height: 8, fill: "#5a7a8a" } },
        { tag: "path", attrs: { d: "M14 12 L14 16 M22 12 L22 16 M30 12 L30 16 M14 32 L14 36 M22 32 L22 36 M30 32 L30 36", fill: "none", stroke: "#aeb7c2", "stroke-width": 1.4, "stroke-linecap": "round" } }
    ]);
}

// --- Generic "assembly" / "equipment" ---
function drawGenericAssembly(svg) {
    addShapes(svg, [
        { tag: "circle", attrs: { cx: 24, cy: 24, r: 14, fill: "#3a4453", stroke: "#7cc8ff", "stroke-width": 1.2 } },
        { tag: "circle", attrs: { cx: 24, cy: 24, r: 8, fill: "#586378", stroke: "#aeb7c2", "stroke-width": 1 } },
        { tag: "circle", attrs: { cx: 24, cy: 24, r: 3.2, fill: "#7cc8ff" } },
        { tag: "circle", attrs: { cx: 24, cy: 24, r: 1.6, fill: "#ffffff" } },
        { tag: "path", attrs: { d: "M24 6 L24 12 M24 36 L24 42 M6 24 L12 24 M36 24 L42 24", fill: "none", stroke: "#7cc8ff", "stroke-width": 1.5, "stroke-linecap": "round", opacity: 0.7 } }
    ]);
}

// --- True fallback (safety net) ---
function drawGenericFallback(svg) {
    addShapes(svg, [
        { tag: "polygon", attrs: { points: "24,8 38,18 38,32 24,40 10,32 10,18", fill: "#586378", stroke: "#aeb7c2", "stroke-width": 1.2, "stroke-linejoin": "round" } },
        { tag: "polygon", attrs: { points: "24,8 38,18 24,24 10,18", fill: "#a3adb8" } },
        { tag: "polygon", attrs: { points: "10,18 24,24 10,32", fill: "#4a5464" } },
        { tag: "polygon", attrs: { points: "38,18 38,32 24,24", fill: "#7a8493" } }
    ]);
}

export const materialDrawings = {
    stone:  { core: drawStoneCore,  field: drawStoneField },
    quartz: { core: drawQuartzCore, field: drawQuartzField },
    copper: { core: drawCopperCore, field: drawCopperField }
};

const genericDrawings = {
    // Raw subtypes
    mineral:   { core: drawGenericMineral,   field: drawGenericMineral },
    ore:       { core: drawGenericOre,       field: drawGenericOre },
    anomalous: { core: drawGenericAnomalous, field: drawGenericAnomalous },
    // Processed subtypes
    metal:     { core: drawGenericMetal,     field: drawGenericMetal },
    alloy:     { core: drawGenericMetal,     field: drawGenericMetal },
    ceramic:   { core: drawGenericCeramic,   field: drawGenericCeramic },
    chemical:  { core: drawGenericChemical,  field: drawGenericChemical },
    advanced:  { core: drawGenericAdvanced,  field: drawGenericAdvanced },
    // Crafted subtypes
    component: { core: drawGenericComponent, field: drawGenericComponent },
    assembly:  { core: drawGenericAssembly,  field: drawGenericAssembly },
    equipment: { core: drawGenericAssembly,  field: drawGenericAssembly },
    // Safety net
    fallback:  { core: drawGenericFallback,  field: drawGenericFallback }
};

export function getDrawing(materialId, variant = "core") {
    // 1. Exact match (with variant fallback to core)
    const exact = materialDrawings[materialId];
    if (exact) {
        const found = exact[variant] ?? exact.core;
        if (found) return found;
    }

    // 2. Subtype-generic
    const material = getMaterial(materialId);
    const subtype = material?.subtype ?? "fallback";
    const generic = genericDrawings[subtype] ?? genericDrawings.fallback;
    return generic[variant] ?? generic.core;
}