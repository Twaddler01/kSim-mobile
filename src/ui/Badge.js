import { el } from "./Element.js";

/**
 * Reusable visual badge.
 *
 * This component only handles presentation.
 * The caller decides what the badge displays and when it appears.
 */
export default function Badge({
    text = "",
    variant = "default",
    className = "",
    ariaLabel
} = {}) {
    const value = String(text);

    return el("span", {
        className: ["ui-badge", `ui-badge--${variant}`, className]
            .filter(Boolean)
            .join(" "),
        text: value,
        "aria-label": ariaLabel ?? value
    });
}
