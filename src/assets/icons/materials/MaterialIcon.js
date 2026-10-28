import { createSvgElement } from "./svgHelpers.js";
import { materialDrawings } from "./materialDrawings.js";

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

    const drawings = materialDrawings[materialId];
    const draw = drawings?.[variant] ?? drawings?.core;

    if (draw) {
        draw(svg);
    } else {
        const fallback = createSvgElement("text", {
            x: 24,
            y: 32,
            "text-anchor": "middle",
            "font-size": 28,
            fill: "currentColor"
        });

        fallback.textContent = "◈";
        svg.append(fallback);
    }

    return svg;
}

export default MaterialIcon;
