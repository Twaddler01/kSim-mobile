import { createSvgElement } from "./svgHelpers.js";
import { getDrawing } from "./materialDrawings.js";

export function MaterialIcon(
    materialId,
    { size = 32, className = "", variant = "core" } = {}
) {
    const svg = createSvgElement("svg", {
        width: size,
        height: size,
        viewBox: "0 0 48 48",
        preserveAspectRatio: "xMidYMid meet",
        "aria-hidden": "true",
        focusable: "false",
        class: ["material-icon", className].filter(Boolean).join(" ")
    });

    const draw = getDrawing(materialId, variant);
    // getDrawing always resolves — fallback is baked in.
    draw(svg);

    return svg;
}

export function hasMaterialIcon(materialId, variant = "core") {
    // Every material with a subtype resolves to a generic drawing,
    // so this is effectively always true. Kept for API compatibility.
    return Boolean(getDrawing(materialId, variant));
}

export default MaterialIcon;