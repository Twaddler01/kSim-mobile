import { el } from "../ui/Element.js";

export default class Announce {
    constructor({ mountPoint = document.body } = {}) {
        this.mountPoint = mountPoint;
        this.current = null;

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
            className: "ksim-announce__eyebrow",
            text: "⚠ PRIORITY LAB ALERT"
        });

        this.symbol = el("div", {
            className: "ksim-announce__symbol",
            text: "◉",
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
        this.current = { onClose };

        this.eyebrow.textContent = eyebrow;
        this.symbol.textContent = symbol;
        this.titleElement.textContent = title;
        this.messageElement.textContent = message;

        this.element.hidden = false;
        this.closeButton.focus();
    }

    close() {
        if (this.element.hidden) return;

        const current = this.current;

        this.current = null;
        this.element.hidden = true;

        current?.onClose?.();
    }

    destroy() {
        this.close();
        this.element.remove();
        this.current = null;
    }
}
