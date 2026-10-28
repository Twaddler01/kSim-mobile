import { el } from "./Element.js";
import { MaterialIcon } from "../assets/icons/materials/MaterialIcon.js";

const COLUMNS = 12;
const ROWS = 8;
const INITIAL_NODES = 7;

export default class GatheringField {
    constructor({
        field = {
            id: "copper",
            name: "Copper Field",
            materialId: "copper",
            description: "Locate Copper nodes and recover raw samples."
        },
        onGather,
        nodeCount = INITIAL_NODES
    } = {}) {
        this.field = field;
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

    gatherNode(node, event = null) {
        if (!this.nodes.some(item => item.id === node?.id)) {
            return false;
        }

        const { materialId, name } = this.field;

        const succeeded = this.onGather?.(event, {
            id: materialId,
            name
        });

        if (succeeded !== true) return false;

        this.nodes = this.nodes.filter(item => item.id !== node.id);

        this.spawnNodes(1);
        this.update();

        return true;
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

        const { id, name, materialId, description } = this.field;

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
                el("h2", { text: name }),
                el("p", {
                    className: "muted",
                    text: description
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
                    className: [
                        "gathering-node",
                        `gathering-node--${this.field.visualVariant ?? "default"}`
                    ].join(" "),
                    "aria-label":
                        `Gather ${name} node at grid position ` +
                        `${node.x + 1}, ${node.y + 1}`,
                    onClick: event => {
                        this.gatherNode(node, event);
                    }
                },
                [
                    MaterialIcon(materialId, {
                        size: 30,
                        className: "gathering-node__icon",
                        variant: "core"
                    })
                ]
            );

            button.style.left = `${((node.x + 0.5) / COLUMNS) * 100}%`;

            button.style.top = `${((node.y + 0.5) / ROWS) * 100}%`;

            plane.append(button);
        }

        const status = el("div", {
            className: "gathering-status",
            text: `${this.nodes.length} ${name} nodes detected`
        });

        this.element.replaceChildren(heading, plane, status);

        return this;
    }
}
