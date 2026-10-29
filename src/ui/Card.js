import { el } from "./Element.js";
import { itemDomId } from "./itemNavigation.js";

/**
 * Reusable content card.
 *
 * Existing API:
 *   Card(title, children, subtitle)
 *
 * Extended API:
 *   Card(title, children, subtitle, {
 *       icon,
 *       variant,
 *       itemId,
 *       tabId,
 *       badge
 *   })
 *
 * The badge slot is structural only. Notification and navigation
 * behavior remain the responsibility of their respective systems.
 */
export function Card(title, children, subtitle = "", options = {}) {
    const {
        icon = "",
        variant = "",
        itemId,
        tabId,
        badge = null
    } = options ?? {};

    const classNames = ["panel", "card"];

    if (variant) {
        classNames.push(`card--${variant}`);
    }

    const props = {
        className: classNames.join(" ")
    };

    if (itemId != null && tabId) {
        props.id = itemDomId(tabId, itemId);
        props.dataset = {
            tabId: String(tabId),
            itemId: String(itemId)
        };
    }

    const panel = el("section", props);

    const titleContent = [];

    if (icon) {
        titleContent.push(
            el("span", {
                className: "card-icon",
                text: icon,
                "aria-hidden": "true"
            })
        );
    }

    titleContent.push(
        el("h2", {
            className: "card-title",
            text: title
        })
    );

    const heading = el("div", { className: "card-heading" }, [
        el("div", { className: "card-heading-main" }, titleContent),
        el("div", {
            className: "card-badge-slot",
            "aria-live": "polite"
        }, badge == null ? [] : [badge])
    ]);

    const header = el("header", { className: "card-header" }, [
        heading,
        subtitle
            ? el("div", {
                className: "card-subtitle",
                text: subtitle
            })
            : null
    ]);

    const body = el("div", { className: "card-body" }, children);

    panel.append(header, body);

    return panel;
}
