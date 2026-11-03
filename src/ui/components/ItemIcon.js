import { el } from "./Element.js";
import {
    MaterialIcon,
    hasMaterialIcon
} from "../../assets/icons/materials/MaterialIcon.js";

/**
 * Creates an item icon using this priority:
 * 1. Dedicated SVG
 * 2. Data-defined icon (usually emoji)
 * 3. Generic fallback
 */
export function ItemIcon(
    item,
    { size = 24, className = "item-icon", fallback = "?" } = {}
) {
    const wrapper = el("span", {
        className,
        "aria-hidden": "true"
    });

    if (!item) {
        wrapper.textContent = fallback;
        return wrapper;
    }

    // Material SVG.
    if (item.id && hasMaterialIcon(item.id)) {
        wrapper.append(
            MaterialIcon(item.id, { size, className: "item-icon__svg" })
        );

        return wrapper;
    }

    // Existing data icon.
    wrapper.textContent = item.icon || fallback;

    return wrapper;
}
