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

        this.actionButton = el("button", {
            className: "ksim-announce__action",
            type: "button",
            hidden: true,
            onClick: () => this.goTo()
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
            this.actionButton,
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
        actionLabel = "",
        onClose = null,
        onAcknowledge = null,
        onGoTo = null
    } = {}) {
        this.queue.push({
            title,
            message,
            eyebrow,
            symbol,
            actionLabel,
            onClose,
            onAcknowledge,
            onGoTo
        });

        this.showNext();
    }

    showNext() {
        if (this.current || this.queue.length === 0) return;

        this.current = this.queue.shift();

        const { title, message, eyebrow, symbol, actionLabel, onGoTo } =
            this.current;

        this.eyebrow.textContent = eyebrow;
        this.symbol.textContent = symbol;
        this.titleElement.textContent = title;
        this.messageElement.textContent = message;

        const hasAction = Boolean(actionLabel) && typeof onGoTo === "function";

        this.actionButton.textContent = actionLabel;
        this.actionButton.hidden = !hasAction;

        this.element.hidden = false;

        // Restart the entrance animation for each queued announcement.
        this.panel.style.animation = "none";
        void this.panel.offsetWidth;
        this.panel.style.animation = "";

        this.closeButton.focus();
    }

    close() {
        this.finish("acknowledge");
    }

    goTo() {
        if (!this.current) return;

        this.finish("goTo");
    }

    finish(action) {
        if (!this.current) return;

        const finished = this.current;

        // Clear current state before callbacks to prevent duplicate actions.
        this.current = null;
        this.element.hidden = true;

        try {
            if (action === "acknowledge") {
                finished.onAcknowledge?.();
            } else if (action === "goTo") {
                finished.onGoTo?.();
            }
        } finally {
            try {
                finished.onClose?.(action);
            } finally {
                this.showNext();
            }
        }
    }

    destroy() {
        // Destruction discards queued announcements without acknowledging them.
        this.current = null;
        this.queue.length = 0;
        this.element.remove();
    }
}
