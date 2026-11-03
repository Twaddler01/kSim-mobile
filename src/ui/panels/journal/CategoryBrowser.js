
import { el, append } from "../../components/Element.js";
import {
    getJournalEntriesByCategory
} from "../../../data/journal/catalog.js";
import {
    getRecipesUsing,
    getRecipesProducing,
    getRecipeInputs,
    getRecipeOutputs,
    getFieldMaterials,
    getMaterialField
} from "../../../data/journal/relationships.js";
import { ItemIcon } from "../../components/ItemIcon.js";

const CATEGORIES = [
    { id: "locations", label: "Locations" },
    { id: "fields", label: "Fields" },
    { id: "resources", label: "Resources" },
    { id: "rawMaterials", label: "Raw Materials" },
    { id: "processedMaterials", label: "Processed Materials" },
    { id: "craftedMaterials", label: "Crafted Materials" },
    { id: "refinementRecipes", label: "Refinement" },
    { id: "fabricationRecipes", label: "Fabrication" },
    { id: "assemblyRecipes", label: "Assembly" }
];

export default class CategoryBrowser {
    constructor({ getGame = () => null } = {}) {
        this.getGame = getGame;

        this.activeCategory = "locations";
        this.selectedEntryId = null;
        this.selectedEntryType = null;

        this.element = el("section", {
            className: "journal-panel"
        });

        this.render();
    }

    getElement() {
        return this.element;
    }

    getEntries(category = this.activeCategory) {
        return getJournalEntriesByCategory(category).filter(
            entry => !entry.metadata?.hidden
        );
    }

    getSelectedEntry() {
        const entries = this.getEntries();

        return (
            entries.find(entry =>
                entry.id === this.selectedEntryId &&
                entry.type === this.selectedEntryType
            ) ?? entries[0] ?? null
        );
    }

    selectCategory(categoryId) {
        if (!CATEGORIES.some(category => category.id === categoryId)) {
            return;
        }

        this.activeCategory = categoryId;

        const firstEntry = this.getEntries()[0] ?? null;

        this.selectedEntryId = firstEntry?.id ?? null;
        this.selectedEntryType = firstEntry?.type ?? null;

        this.render();
    }

    selectEntry(entry) {
        if (!entry) return;

        this.selectedEntryId = entry.id;
        this.selectedEntryType = entry.type;

        this.render();
    }

    render() {
        const entries = this.getEntries();
        const selectedEntry = this.getSelectedEntry();

        // Keep selection valid if the catalog changes.
        if (selectedEntry) {
            this.selectedEntryId = selectedEntry.id;
            this.selectedEntryType = selectedEntry.type;
        } else {
            this.selectedEntryId = null;
            this.selectedEntryType = null;
        }

        const heading = el("header", {
            className: "journal-heading"
        }, [
            el("div", {
                className: "journal-eyebrow",
                text: "RESEARCH DATABASE"
            }),
            el("h2", {
                text: "Research Journal"
            }),
            el("p", {
                text: "A record of materials, locations, resources, and discoveries."
            })
        ]);

        this.categoryNav = el("nav", {
            className: "journal-categories",
            "aria-label": "Journal categories"
        });

        this.renderCategories();

        this.entryList = el("div", {
            className: "journal-entry-list"
        });

        this.renderEntryList();

        this.detailPanel = el("div", {
            className: "journal-details"
        });

        this.renderDetails();

        const browser = el("div", {
            className: "journal-browser"
        }, [
            el("aside", {
                className: "journal-sidebar"
            }, [
                this.categoryNav
            ]),
            el("section", {
                className: "journal-entries"
            }, [
                el("div", {
                    className: "journal-section-heading",
                    text: CATEGORIES.find(
                        category => category.id === this.activeCategory
                    )?.label ?? "Entries"
                }),
                this.entryList
            ]),
            this.detailPanel
        ]);

        this.element.replaceChildren(
            heading,
            browser
        );
    }

    renderCategories() {
        this.categoryNav.replaceChildren();

        for (const category of CATEGORIES) {
            const entries = this.getEntries(category.id);

            const button = el("button", {
                type: "button",
                className: [
                    "journal-category",
                    this.activeCategory === category.id
                        ? "active"
                        : ""
                ].filter(Boolean).join(" "),
                onClick: () => this.selectCategory(category.id)
            }, [
                el("span", {
                    className: "journal-category-label",
                    text: category.label
                }),
                el("span", {
                    className: "journal-category-count",
                    text: String(entries.length)
                })
            ]);

            append(this.categoryNav, button);
        }
    }

    renderEntryList() {
        this.entryList.replaceChildren();

        const entries = this.getEntries();

        if (!entries.length) {
            append(this.entryList, el("p", {
                className: "journal-empty",
                text: "No entries recorded in this category."
            }));

            return;
        }

        for (const entry of entries) {
            const selected =
                entry.id === this.selectedEntryId &&
                entry.type === this.selectedEntryType;

            const button = el("button", {
                type: "button",
                className: [
                    "journal-entry",
                    selected ? "active" : ""
                ].filter(Boolean).join(" "),
                onClick: () => this.selectEntry(entry)
            }, [
                ItemIcon(entry, {
                    size: 24,
                    className: "journal-entry-icon"
                }),
                el("span", {
                    className: "journal-entry-name",
                    text: entry.name
                })
            ]);

            append(this.entryList, button);
        }
    }

    renderDetails() {
        this.detailPanel.replaceChildren();

        const entry = this.getSelectedEntry();

        if (!entry) {
            append(this.detailPanel, el("p", {
                className: "journal-empty",
                text: "Select an entry to view its information."
            }));

            return;
        }

        append(this.detailPanel, [
            el("div", {
                className: "journal-detail-heading"
            }, [
                ItemIcon(entry, {
                    size: 24,
                    className: "journal-entry-icon"
                }),
                el("div", {}, [
                    el("div", {
                        className: "journal-eyebrow",
                        text: entry.type
                    }),
                    el("h3", {
                        text: entry.name
                    })
                ])
            ]),
            el("p", {
                className: "journal-description",
                text: entry.description || "No description available."
            })
        ]);

        this.renderRelationships(entry);
    }

    renderRelationships(entry) {
        switch (entry.type) {
            case "material":
                this.renderMaterialRelationships(entry);
                break;

            case "field":
                this.renderFieldRelationships(entry);
                break;

            case "recipe":
                this.renderRecipeRelationships(entry);
                break;

            case "resource":
                this.renderResourceRelationships(entry);
                break;
        }
    }

    renderMaterialRelationships(entry) {
        const field = getMaterialField(entry.id);
        const usedBy = getRecipesUsing(entry.id);
        const producedBy = getRecipesProducing(entry.id);

        if (field) {
            this.renderRelationshipSection("Found in", [field]);
        }

        if (producedBy.length) {
            this.renderRelationshipSection("Produced by", producedBy);
        }

        if (usedBy.length) {
            this.renderRelationshipSection("Used in", usedBy);
        }
    }

    renderFieldRelationships(entry) {
        const materials = getFieldMaterials(entry.id);

        if (materials.length) {
            this.renderRelationshipSection("Gatherable materials", materials);
        }
    }

    renderRecipeRelationships(entry) {
        const inputs = getRecipeInputs(entry.id);
        const outputs = getRecipeOutputs(entry.id);

        this.renderItemSection("Inputs", inputs);
        this.renderItemSection("Outputs", outputs);
    }

    renderResourceRelationships(entry) {
        const usedBy = getRecipesUsing(entry.id);
        const producedBy = getRecipesProducing(entry.id);

        if (producedBy.length) {
            this.renderRelationshipSection("Produced by", producedBy);
        }

        if (usedBy.length) {
            this.renderRelationshipSection("Used in", usedBy);
        }
    }

    renderRelationshipSection(title, entries) {
        if (!entries?.length) return;

        const section = el("section", {
            className: "journal-relationship-section"
        }, [
            el("h4", {
                text: title
            })
        ]);

        for (const entry of entries) {
            if (!entry) continue;

            const button = el("button", {
                type: "button",
                className: "journal-related-entry",
                onClick: () => this.openRelatedEntry(entry)
            }, [
                ItemIcon(entry, {
                    size: 22,
                    className: "journal-related-entry-icon"
                }),
                el("span", {
                    text: entry.name ?? entry.id
                })
            ]);

            append(section, button);
        }

        append(this.detailPanel, section);
    }

    renderItemSection(title, items) {
        if (!items?.length) return;

        const section = el("section", {
            className: "journal-relationship-section"
        }, [
            el("h4", {
                text: title
            })
        ]);

        for (const { item, amount } of items) {
            if (!item) continue;

            const button = el("button", {
                type: "button",
                className: "journal-related-entry",
                onClick: () => this.openRelatedEntry(item)
            }, [
                ItemIcon(item, {
                    size: 22,
                    className: "journal-related-entry-icon"
                }),
                el("span", {
                    text: item.name ?? item.id
                }),
                el("span", {
                    className: "journal-item-amount",
                    text: `×${amount}`
                })
            ]);

            append(section, button);
        }

        append(this.detailPanel, section);
    }

    openRelatedEntry(entry) {
        if (!entry) return;

        // Find the category containing this exact entry.
        const category = entry.category;

        if (!CATEGORIES.some(item => item.id === category)) {
            return;
        }

        this.activeCategory = category;
        this.selectedEntryId = entry.id;
        this.selectedEntryType = entry.type;

        this.render();
    }

    update() {
        // Rebuild from the current catalog while preserving selection.
        this.render();
    }
}
