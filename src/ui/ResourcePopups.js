import { el } from "./Element.js";

export default class ResourcePopups {
    constructor({ formatNumber, maxVisible = 5 } = {}) {
        this.formatNumber = formatNumber ?? (value => String(value));
        this.maxVisible = maxVisible;
        this.active = [];
    }

    show(gains, event = null) {
        const x = event?.clientX ?? window.innerWidth / 2;
        const y = event?.clientY ?? window.innerHeight / 2;

        for (const gain of gains) {
            if (!gain.amount) continue;

            while (this.active.length >= this.maxVisible) {
                this.remove(this.active[0]);
            }

            const stackOffset = this.active.length * 24;

            const popup = el("div", {
                className: "resource-float",
                text: `${gain.amount < 0 ? "−" : "+"}${this.formatNumber(Math.abs(gain.amount))} ${gain.icon}`,
                style: {
                    left: `${x}px`,
                    top: `${y - stackOffset}px`
                },
                "aria-hidden": "true"
            });

            const entry = { element: popup, timer: null };
            this.active.push(entry);
            document.body.append(popup);

            popup.addEventListener(
                "animationend",
                () => {
                    this.remove(entry);
                },
                { once: true }
            );

            entry.timer = setTimeout(() => {
                this.remove(entry);
            }, 1000);
        }
    }

    remove(entry) {
        if (!entry) return;

        entry.element.remove();

        if (entry.timer !== null) {
            clearTimeout(entry.timer);
            entry.timer = null;
        }

        const index = this.active.indexOf(entry);
        if (index !== -1) {
            this.active.splice(index, 1);
        }
    }

    destroy() {
        for (const entry of [...this.active]) {
            this.remove(entry);
        }
    }
}
