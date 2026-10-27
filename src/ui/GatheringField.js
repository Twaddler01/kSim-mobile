import { el } from "./Element.js";
import { MaterialIcon } from "./MaterialIcon.js";

const COLUMNS = 12;
const ROWS = 8;
const INITIAL_NODES = 7;

export default class GatheringField {
    constructor({ onGather, nodeCount = INITIAL_NODES } = {}) {
        this.onGather = onGather;
        this.nodeCount = nodeCount;
        this.nextId = 1;
        this.nodes = [];
        this.element = null;

        this.spawnNodes(this.nodeCount);
    }

    spawnNodes(count = 1) {
        const occupied = new Set(this.nodes.map(node => `${node.x},${node.y}`));

        const available = [];

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLUMNS; x++) {
                if (!occupied.has(`${x},${y}`)) {
                    available.push({ x, y });
                }
            }
        }

        for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
        }

        const amount = Math.min(count, available.length);

        for (let i = 0; i < amount; i++) {
            this.nodes.push({
                id: this.nextId++,
                ...available[i]
            });
        }
    }

    getElement() {
        if (!this.element) {
            this.element = el("section", {
                className: "gathering-panel"
            });

            this.update();
        }

        return this.element;
    }

    update() {
        if (!this.element) return this;

        const heading = el(
            "div",
            {
                className: "gathering-heading"
            },
            [
                el("div", {
                    className: "eyebrow",
                    text: "FIELD OPERATIONS // RAW MATERIALS"
                }),
                el("h2", { text: "Copper Field" }),
                el("p", {
                    className: "muted",
                    text: "Locate a Copper node and tap it to collect one sample."
                })
            ]
        );

        const plane = el("div", {
            className: "gathering-field"
        });

        plane.style.setProperty("--gathering-columns", COLUMNS);
        plane.style.setProperty("--gathering-rows", ROWS);

        for (const node of this.nodes) {
            const button = el(
                "button",
                {
                    type: "button",
                    className: "gathering-node",
                    "aria-label": `Gather Copper at grid position ${node.x + 1}, ${node.y + 1}`,
                    onClick: event => {
                        const succeeded = this.onGather?.(event, {
                            id: "copper",
                            name: "Copper"
                        });

                        if (succeeded !== true) return;

                        this.nodes = this.nodes.filter(
                            item => item.id !== node.id
                        );

                        this.spawnNodes(1);
                        this.update();
                    }
                },
                [
                    MaterialIcon("copper", {
                        size: 30,
                        className: "gathering-node__icon"
                    })
                ]
            );

            button.style.left = `${((node.x + 0.5) / COLUMNS) * 100}%`;
            button.style.top = `${((node.y + 0.5) / ROWS) * 100}%`;

            plane.append(button);
        }

        const status = el("div", {
            className: "gathering-status",
            text: `${this.nodes.length} Copper nodes detected`
        });

        this.element.replaceChildren(heading, plane, status);

        return this;
    }
}
