import { el } from "./Element.js";
import {
    MaterialIcon,
    hasMaterialIcon
} from "../../assets/icons/materials/MaterialIcon.js";

export function ItemIcon(
    item,
    {
        size = 24,
        className = "item-icon",
        fallback = "?",
        materialId = null
    } = {}
) {
    const wrapper = el("span", {
        className,
        "aria-hidden": "true"
    });

    if (!item) {
        wrapper.textContent = fallback;
        return wrapper;
    }

    const id =
        materialId ??
        item.materialId ??
        (item.type === "material" || item.category ? item.id : null);

    if (id && hasMaterialIcon(id)) {
        wrapper.append(
            MaterialIcon(id, {
                size,
                className: "item-icon__svg"
            })
        );

        return wrapper;
    }

    wrapper.textContent = item.icon || fallback;
    return wrapper;
}
