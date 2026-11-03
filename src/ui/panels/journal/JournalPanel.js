import { el, append } from "../../components/Element.js";

import CategoryBrowser from "./CategoryBrowser.js";
import JournalTree from "./JournalTree.js";

export default class JournalPanel {
    constructor({ getGame = () => null } = {}) {
        this.getGame = getGame;
        this.activeView = "browser";

        this.categoryBrowser = new CategoryBrowser({
            getGame
        });

        this.journalTree = new JournalTree({
            getGame
        });

        this.element = el("section", {
            className: "journal-panel"
        });

        this.render();
    }

    getElement() {
        return this.element;
    }

    selectView(view) {
        if (!["browser", "tree"].includes(view)) return;

        this.activeView = view;
        this.renderContent();
        this.renderButtons();
    }

    render() {
        this.heading = el("header", {
            className: "journal-heading"
        }, [
            el("div", {
                className: "journal-eyebrow",
                text: "RESEARCH DATABASE"
            }),
            el("h2", {
                text: "Research Journal"
            })
        ]);

        this.viewButtons = el("nav", {
            className: "journal-view-selector"
        });

        this.contentArea = el("div", {
            className: "journal-content"
        });

        append(this.element, [
            this.heading,
            this.viewButtons,
            this.contentArea
        ]);

        this.renderButtons();
        this.renderContent();
    }

    renderButtons() {
        this.viewButtons.replaceChildren();

        const views = [
            { id: "browser", label: "📖 CATEGORY BROWSER" },
            { id: "tree", label: "🌳 TREE" }
        ];

        for (const view of views) {
            append(this.viewButtons, el("button", {
                type: "button",
                className: [
                    "journal-view-button",
                    this.activeView === view.id ? "active" : ""
                ].filter(Boolean).join(" "),
                onClick: () => this.selectView(view.id)
            }, view.label));
        }
    }

    renderContent() {
        const panel = this.activeView === "tree"
            ? this.journalTree
            : this.categoryBrowser;

        this.contentArea.replaceChildren(
            panel.getElement()
        );

        panel.update?.();
    }

    update() {
        this.categoryBrowser.update();
        this.journalTree.update();
    }
}