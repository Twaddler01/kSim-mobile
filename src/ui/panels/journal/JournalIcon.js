import { el } from "../../components/Element.js";
import { MaterialIcon } from "../../../assets/icons/materials/MaterialIcon.js";

export function createJournalIcon(
    entry,
    { size = 22, className = "journal-tree-entry-icon" } = {}
) {
    let materialId = null;

    if (entry.type === "material") {
        materialId = entry.id;
    }

    if (entry.type === "field") {
        materialId =
            entry.source?.materialId ??
            entry.source?.spawnTable?.[0]?.materialId ??
            null;
    }

    const icon = materialId
        ? MaterialIcon(materialId, {
              size,
              variant: "core"
          })
        : null;

    const wrapper = el("span", {
        className
    });

    if (icon) {
        wrapper.append(icon);
    } else {
        wrapper.textContent = entry.icon ?? "❔";
    }

    return wrapper;
}
