import { el } from "./Element.js";
import { Button } from "./Button.js";
import { ProgressBar } from "./ProgressBar.js";
import { itemDomId } from "./itemNavigation.js";

/**
 * Reusable content card.
 *
 * Existing API:
 *   Card(title, children, subtitle, options)
 *
 * Composition helpers:
 *   Card.Section(title, children)
 *   Card.Text(text, options)
 *   Card.Status(label, options)
 *   Card.Requirements(items)
 *   Card.Output(items)
 *   Card.Progress(options)
 *   Card.Actions(buttons)
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
        el(
            "div",
            {
                className: "card-badge-slot",
                "aria-live": "polite"
            },
            badge == null ? [] : [badge]
        )
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

/* ========================================
   Reusable card sections
======================================== */

/** Group related card content. */
Card.Section = function (title, children, options = {}) {
    const { className = "" } = options;

    return el(
        "section",
        {
            className: ["card-section", className].filter(Boolean).join(" ")
        },
        [
            title
                ? el("h3", {
                      className: "card-section-title",
                      text: title
                  })
                : null,
            children
        ]
    );
};

/** Standard descriptive text. */
Card.Text = function (text, options = {}) {
    const { className = "", muted = true } = options;

    return el("p", {
        className: ["card-text", muted ? "card-text--muted" : "", className]
            .filter(Boolean)
            .join(" "),
        text
    });
};

/** Display a status label. */
Card.Status = function (label, options = {}) {
    const { variant = "default", className = "" } = options;

    return el("span", {
        className: ["card-status", `card-status--${variant}`, className]
            .filter(Boolean)
            .join(" "),
        text: label
    });
};

Card.Requirements = function (items = []) {
    const rows = items.map(item => {
        const available = Math.max(0, Number(item.available) || 0);
        const required = Math.max(0, Number(item.required) || 0);
        const sufficient = available >= required;

        return el(
            "div",
            {
                className: [
                    "card-requirement",
                    sufficient
                        ? "card-requirement--met"
                        : "card-requirement--missing"
                ].join(" ")
            },
            [
                el("span", {
                    className: "card-requirement__icon",
                    text: item.icon ?? "",
                    "aria-hidden": "true"
                }),

                el("span", {
                    className: "card-requirement__label",
                    text: item.label ?? item.id ?? "Unknown item"
                }),

                el("span", {
                    className: "card-requirement__amount",
                    text: `${available} / ${required}`
                })
            ]
        );
    });

    return Card.Section(
        "Requirements",
        rows.length
            ? el("div", { className: "card-requirements" }, rows)
            : Card.Text("No requirements.")
    );
};

/** Display expected output items. */
Card.Output = function (items = []) {
    const rows = items.map(item =>
        el("div", { className: "card-output" }, [
            el("span", {
                className: "card-output__icon",
                text: item.icon ?? "",
                "aria-hidden": "true"
            }),

            el("span", {
                className: "card-output__label",
                text: item.label ?? item.id ?? "Unknown item"
            }),

            el("strong", {
                className: "card-output__amount",
                text: `×${Number(item.amount) || 0}`
            })
        ])
    );

    return Card.Section(
        "Output",
        rows.length
            ? el("div", { className: "card-outputs" }, rows)
            : Card.Text("No output.")
    );
};

/** Reuse the existing ProgressBar component. */
Card.Progress = function (options = {}) {
    return ProgressBar(options);
};

/** Arrange one or more action buttons. */
Card.Actions = function (buttons = []) {
    return el(
        "div",
        { className: "card-actions" },
        buttons.map(button => {
            if (button instanceof Node) return button;

            return Button(button.label, button.onClick, {
                variant: button.variant ?? "secondary-button",
                disabled: button.disabled ?? false,
                title: button.title
            });
        })
    );
};
