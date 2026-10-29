import { el } from "../ui/Element.js";

export default class Toast {
    constructor({
        mountPoint = document.body,
        duration = 1800
    } = {}) {
        this.mountPoint = mountPoint;
        this.duration = duration;
        this.timer = null;

        this.element = el("div", {
            className: "toast-message",
            role: "status",
            "aria-live": "polite",
            hidden: true
        });

        this.mountPoint.append(this.element);
    }

    show(message, { duration = this.duration } = {}) {
        if (message == null || message === "") {
            this.dismiss();
            return;
        }

        clearTimeout(this.timer);

        this.element.textContent = String(message);
        this.element.hidden = false;

        this.timer = setTimeout(() => {
            this.dismiss();
        }, duration);
    }

    dismiss() {
        clearTimeout(this.timer);
        this.timer = null;
        this.element.hidden = true;
        this.element.textContent = "";
    }

    destroy() {
        this.dismiss();
        this.element.remove();
    }
}
