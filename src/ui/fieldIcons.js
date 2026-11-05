import { createSvgElement } from "../assets/icons/svgHelpers.js";
import { MaterialIcon } from "../assets/icons/materials/MaterialIcon.js";
import { getFieldDrawing } from "../assets/icons/fields/fieldDrawings.js";
import { getFieldIconMaterialId } from "../data/fields.js";

/**
 * Resolution chain:
 *   1. fieldDrawings[field.id][variant]  — authored place icon
 *   2. material `field` variant          — dominant-material fallback
 *   3. field.icon (emoji)                — last-resort for legacy
 */
export function createFieldIcon(
    field,
    { size = 32, className = "", variant = "default" } = {}
) {
    const draw = getFieldDrawing(field.id, variant);

    if (draw) {
        const svg = createSvgElement("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 48 48",
            width: size,
            height: size,
            preserveAspectRatio: "xMidYMid meet",
            "aria-hidden": "true",
            focusable: "false",
            class: ["field-icon", className].filter(Boolean).join(" ")
        });
        draw(svg);
        return svg;
    }

    const materialId = getFieldIconMaterialId(field);
    if (materialId) {
        return MaterialIcon(materialId, {
            size,
            variant: "field",
            className: ["field-icon", className].filter(Boolean).join(" ")
        });
    }

    const span = document.createElement("span");
    span.className = ["field-icon", "field-icon--fallback", className]
        .filter(Boolean)
        .join(" ");
    span.setAttribute("aria-hidden", "true");
    span.textContent = field.icon ?? "◈";
    return span;
}
