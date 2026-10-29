import { el } from "./Element.js";
import { MaterialIcon } from "../assets/icons/materials/MaterialIcon.js";
import { materials } from "../data/materials.js";

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
            const materialId = this.selectMaterial();

            if (!materialId) continue;

            this.nodes.push({
                id: this.nextId++,
                ...available[i],
                materialId,
                richness: this.selectRichness()
            });
        }
    }

    gatherNode(node, event = null) {
        if (!this.nodes.some(item => item.id === node?.id)) {
            return false;
        }

        const material = materials.find(item => item.id === node.materialId);

        if (!material) return false;

        const succeeded = this.onGather?.(event, {
            id: material.id,
            name: material.name,
            richness: node.richness
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

        const { name, description } = this.field;

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
            const material = materials.find(
                item => item.id === node.materialId
            );

            const materialName = material?.name ?? "Unknown material";

            const icon = MaterialIcon(node.materialId, {
                size: 30,
                className: "gathering-node__icon",
                variant: "core"
            });

            const scale = 1 + (node.richness - 1) * 0.125;

            icon.style.transform = `scale(${scale})`;

            const button = el(
                "button",
                {
                    type: "button",
                    className: [
                        "gathering-node",
                        `gathering-node--${this.field.visualVariant ?? "default"}`
                    ].join(" "),
                    "aria-label": `Gather ${materialName} deposit, yield ${node.richness}`,
                    onClick: event => {
                        this.gatherNode(node, event);
                    }
                },
                [icon]
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

    selectMaterial() {
        const table = this.field.spawnTable ?? [];

        // Backward compatibility while old fields are migrated.
        if (table.length === 0 && this.field.materialId) {
            return this.field.materialId;
        }

        const validEntries = table.filter(
            entry =>
                entry.materialId !== "quantumParticleTrace" &&
                materials.some(material => material.id === entry.materialId) &&
                Number.isFinite(entry.weight) &&
                entry.weight > 0
        );

        const totalWeight = validEntries.reduce(
            (total, entry) => total + entry.weight,
            0
        );

        if (totalWeight === 0) return null;

        let roll = Math.random() * totalWeight;

        for (const entry of validEntries) {
            roll -= entry.weight;

            if (roll < 0) return entry.materialId;
        }

        return validEntries[validEntries.length - 1].materialId;
    }

    selectRichness() {
        const table = this.field.richnessTable ?? [{ amount: 1, weight: 1 }];

        const validEntries = table.filter(
            entry =>
                Number.isFinite(entry.amount) &&
                entry.amount >= 1 &&
                Number.isFinite(entry.weight) &&
                entry.weight > 0
        );

        const totalWeight = validEntries.reduce(
            (total, entry) => total + entry.weight,
            0
        );

        if (totalWeight === 0) return 1;

        let roll = Math.random() * totalWeight;

        for (const entry of validEntries) {
            roll -= entry.weight;

            if (roll < 0) return entry.amount;
        }

        return validEntries[validEntries.length - 1].amount;
    }
}
