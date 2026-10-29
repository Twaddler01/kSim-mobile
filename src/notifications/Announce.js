import { el } from "../ui/Element.js";

export default class Announce {
    constructor({ mountPoint = document.body } = {}) {
        this.mountPoint = mountPoint;
        this.current = null;
        this.queue = [];

        this.element = el("div", {
            className: "ksim-announce",
            role: "presentation",
            hidden: true
        });

        this.panel = el("section", {
            className: "ksim-announce__panel",
            role: "alertdialog",
            "aria-modal": "true",
            "aria-labelledby": "ksim-announce-title",
            "aria-describedby": "ksim-announce-message"
        });

        this.eyebrow = el("div", {
            className: "ksim-announce__eyebrow"
        });

        this.symbol = el("div", {
            className: "ksim-announce__symbol",
            "aria-hidden": "true"
        });

        this.titleElement = el("h2", {
            className: "ksim-announce__title",
            id: "ksim-announce-title"
        });

        this.messageElement = el("p", {
            className: "ksim-announce__message",
            id: "ksim-announce-message"
        });

        this.closeButton = el("button", {
            className: "ksim-announce__close",
            type: "button",
            text: "ACKNOWLEDGE",
            onClick: () => this.close()
        });

        this.panel.append(
            this.eyebrow,
            this.symbol,
            this.titleElement,
            this.messageElement,
            this.closeButton
        );

        this.element.append(this.panel);
        this.mountPoint.append(this.element);
    }

    show({
        title = "LABORATORY ANNOUNCEMENT",
        message = "",
        eyebrow = "⚠ PRIORITY LAB ALERT",
        symbol = "◉",
        onClose = null
    } = {}) {
        // Queue only in memory. Nothing is persisted or replayed on load.
        this.queue.push({ title, message, eyebrow, symbol, onClose });
        this.showNext();
    }

    showNext() {
        if (this.current || this.queue.length === 0) return;

        this.current = this.queue.shift();

        const { title, message, eyebrow, symbol } = this.current;

        this.eyebrow.textContent = eyebrow;
        this.symbol.textContent = symbol;
        this.titleElement.textContent = title;
        this.messageElement.textContent = message;

        // Restart the entrance animation for each queued announcement.
        this.element.hidden = false;
        this.panel.style.animation = "none";
        void this.panel.offsetWidth;
        this.panel.style.animation = "";

        this.closeButton.focus();
    }

    close() {
        if (!this.current) return;

        const finished = this.current;
        this.current = null;
        this.element.hidden = true;

        finished.onClose?.();
        this.showNext();
    }

    destroy() {
        // Destruction discards queued announcements without acknowledging them.
        this.current = null;
        this.queue.length = 0;
        this.element.remove();
    }
}
