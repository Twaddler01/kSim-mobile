import { el } from "../components/Element.js";
import { Button } from "../components/Button.js";
import { Card } from "../components/Card.js";
import Badge from "../components/Badge.js";
import NewBadge from "../../notifications/NewBadge.js";

export default class FieldWorkPanel {
    constructor({
        getGame,
        save,
        unlockManager,
        unreadManager,
        fieldDefinitions,
        navigateTo,
        createField,
        refreshTab // () => ui.tabs.update({ refreshContent: true })
    }) {
        this.getGame = getGame;
        this.save = save;
        this.unlockManager = unlockManager;
        this.unreadManager = unreadManager;
        this.fieldDefinitions = fieldDefinitions;
        this.navigateTo = navigateTo;
        this.refreshTab = refreshTab;

        this._viewKey = null;
        this.view = "selector";
        this.fieldViews = new Map();
        this.badges = new Map();

        this.element = null;
        this.fieldCards = null;
        this.fieldSelectionButton = null;

        if (typeof createField !== "function") {
            throw new Error(
                "FieldWorkPanel requires a createField(field) factory. " +
                    "It must return an object with getElement() and update() " +
                    "(optionally deactivate() and refreshSprites())."
            );
        }
        this.createField = createField;
    }

    // --- navigation entry points ---------------------------------------
    showSelector() {
        this.deactivateField();
        this.view = "selector";
        this.fieldSelectionButton = null;
        this.refreshTab();
        return true;
    }

    showField(fieldId) {
        if (!this.unlockManager.isUnlocked(fieldId)) return false;
        if (this.view === "field" && this.activeFieldId() !== fieldId) {
            this.deactivateField();
        }

        const game = this.getGame();
        game.appState.navigation.activeFieldId = fieldId;
        this.view = "field";
        this.unreadManager.markRead("fieldWork", `field-${fieldId}`);
        this.save();
        this.refreshTab();
        return true;
    }

    // --- tab contract ---------------------------------------------------

    getElement() {
        if (!this.element) {
            this.element = el("div", { className: "field-work-content" });
        }
        this.update();
        return this.element;
    }

    update() {
        if (!this.element) return this;

        const fieldId = this.view === "field" ? this.activeFieldId() : null;
        const viewKey = fieldId ? `field:${fieldId}` : "selector";

        // Skip rebuild if the view hasn't changed. Rebuilding would detach
        // and re-attach the canvas, losing pointer capture mid-gesture.
        if (this._viewKey === viewKey) {
            if (fieldId) this.getFieldView(fieldId)?.update?.();
            return this;
        }

        this._viewKey = viewKey;

        if (fieldId) {
            this.element.replaceChildren(this.renderActiveField());
            this.getFieldView(fieldId)?.update?.();
        } else {
            this.view = "selector";
            this.fieldSelectionButton = null;
            this.element.replaceChildren(this.renderSelector());
        }

        return this;
    }

    // --- internal -------------------------------------------------------

    getFieldView(fieldId) {
        if (!this.fieldViews.has(fieldId)) {
            const field = this.fieldDefinitions.find(f => f.id === fieldId);
            this.fieldViews.set(fieldId, this.createField(field));
        }
        return this.fieldViews.get(fieldId);
    }

    activeFieldId() {
        return this.getGame().appState.navigation.activeFieldId;
    }

    renderSelector() {
        const section = el(
            "section",
            { className: "field-selection-section" },
            [
                el("div", {
                    className: "eyebrow",
                    text: "GATHERING LOCATIONS"
                }),
                el("h2", { text: "Select a Field" }),
                el("p", {
                    className: "muted",
                    text: "Choose a field, then enter it when you're ready."
                }),
                (this.fieldCards = el("div", {
                    className: "field-selection-list"
                }))
            ]
        );

        this.updateFieldCards();
        return section;
    }

    renderActiveField() {
        const fieldId = this.activeFieldId();
        if (!fieldId) {
            this.view = "selector";
            this.fieldSelectionButton = null;
            return this.renderSelector();
        }

        const fieldView = this.getFieldView(this.activeFieldId());

        const back = Button("← FIELD SELECTIONS", () => this.showSelector(), {
            variant: "secondary-button"
        });
        this.fieldSelectionButton = back;
        this.updateFieldSelectionBadge();

        return el("div", { className: "field-work-active-view" }, [
            el("div", { className: "field-work-toolbar" }, [back]),
            fieldView.getElement(),
            this.renderFieldUpgrades()
        ]);
    }

    renderFieldUpgrades() {
        return el("div", { className: "field-upgrade-grid" }, [
            Card(
                "Improved Tools",
                el("p", {
                    className: "muted",
                    text: "Better equipment could improve material recovery."
                }),
                "FIELD UPGRADE",
                {
                    tabId: "fieldWork",
                    itemId: "field-upgrade-tools",
                    icon: "🛠️",
                    variant: "upgrade"
                }
            ),
            Card(
                "Efficient Extraction",
                el("p", {
                    className: "muted",
                    text: "Refine field procedures to recover samples more efficiently."
                }),
                "FIELD UPGRADE",
                {
                    tabId: "fieldWork",
                    itemId: "field-upgrade-extraction",
                    icon: "⚙️",
                    variant: "upgrade"
                }
            )
        ]);
    }

    updateFieldCards() {
        if (!this.fieldCards) return;

        const game = this.getGame();

        const cards = this.fieldDefinitions.map(field => {
            const unlocked = this.unlockManager.isUnlocked(field.id);
            const active = this.activeFieldId() === field.id;

            const selectButton = el(
                "button",
                {
                    type: "button",
                    className: "field-selection-card__main",
                    disabled: !unlocked,
                    "aria-label": unlocked
                        ? `Select ${field.name}`
                        : `${field.name}, locked`,
                    onClick: () => {
                        if (!unlocked) return;
                        game.appState.navigation.activeFieldId = field.id;
                        this.save();
                        this.updateFieldCards();
                    }
                },
                [
                    el("span", {
                        className: "field-selection-card__icon",
                        text: field.icon ?? "◈"
                    }),
                    el("span", { className: "field-selection-card__copy" }, [
                        el(
                            "span",
                            {
                                className: "field-selection-card__title",
                                dataset: { fieldTitle: field.id }
                            },
                            [el("strong", { text: field.name })]
                        ),
                        el("span", {
                            className: "field-selection-card__description",
                            text: unlocked
                                ? field.description
                                : `Requires ${field.unlockTrigger?.amount ?? 0} ${
                                      field.unlockTrigger?.item ?? "resources"
                                  } Samples`
                        })
                    ])
                ]
            );

            const actions = el(
                "span",
                { className: "field-selection-card__actions" },
                [
                    el("span", {
                        className: "field-selection-card__status",
                        text: !unlocked
                            ? "LOCKED"
                            : active
                              ? "SELECTED"
                              : "AVAILABLE"
                    }),
                    ...(unlocked && active
                        ? [
                              Button(
                                  "GO",
                                  () => {
                                      this.navigateTo({
                                          tab: "fieldWork",
                                          pageId: field.id
                                      });
                                  },
                                  { variant: "primary-button" }
                              )
                          ]
                        : [])
                ]
            );

            return el(
                "div",
                {
                    className: [
                        "field-selection-card",
                        unlocked ? "is-unlocked" : "is-locked",
                        active ? "is-active" : ""
                    ]
                        .filter(Boolean)
                        .join(" ")
                },
                [selectButton, actions]
            );
        });

        this.fieldCards.replaceChildren(...cards);
        this.refreshBadges();
    }

    getBadge(fieldId) {
        if (!this.badges.has(fieldId)) {
            this.badges.set(
                fieldId,
                new NewBadge({
                    unreadManager: this.unreadManager,
                    tabId: "fieldWork",
                    itemId: `field-${fieldId}`,
                    getElement: () =>
                        [
                            ...(this.fieldCards?.querySelectorAll(
                                "[data-field-title]"
                            ) ?? [])
                        ].find(el => el.dataset.fieldTitle === fieldId),
                    placement: "inline",
                    ariaLabel: "New field"
                })
            );
        }
        return this.badges.get(fieldId);
    }

    refreshBadges() {
        for (const field of this.fieldDefinitions) {
            this.getBadge(field.id).refresh();
        }
    }

    hasUnread() {
        return this.fieldDefinitions.some(field =>
            this.unreadManager.isUnread("fieldWork", `field-${field.id}`)
        );
    }

    updateFieldSelectionBadge() {
        const button = this.fieldSelectionButton;
        if (!button) return;
        button.querySelector(".field-selection-button__badge")?.remove();
        if (!this.hasUnread()) return;
        button.append(
            Badge({
                text: "NEW",
                variant: "new",
                className: "field-selection-button__badge",
                ariaLabel: "New field content"
            })
        );
    }

    refreshFieldSprites() {
        for (const view of this.fieldViews.values()) {
            view.refreshSprites?.();
        }
    }

    deactivateField() {
        for (const view of this.fieldViews.values()) {
            view.deactivate?.();
        }
    }
}
