import { el } from "../ui/components/Element.js";

export default class Toast {
    constructor({
        mountPoint = document.body,
        duration = 1800,
        maxVisible = 5
    } = {}) {
        this.mountPoint = mountPoint;
        this.duration = duration;
        this.maxVisible = maxVisible;

        this.toasts = new Set();

        this.container = el("div", {
            className: "toast-container",
            "aria-live": "polite",
            "aria-relevant": "additions"
        });

        this.mountPoint.append(this.container);
    }

    show(message, { duration = this.duration } = {}) {
        if (message == null || message === "") return;

        // Remove the oldest toast when the visible limit is reached.
        if (this.toasts.size >= this.maxVisible) {
            const oldest = this.toasts.values().next().value;
            this.dismiss(oldest);
        }

        const toast = el("div", {
            className: "toast-message",
            role: "status",
            text: String(message)
        });

        const entry = {
            element: toast,
            timer: null
        };

        this.toasts.add(entry);
        this.container.append(toast);

        entry.timer = setTimeout(() => {
            this.dismiss(entry);
        }, duration);

        return entry;
    }

    dismiss(entry) {
        if (!entry || !this.toasts.has(entry)) return;

        clearTimeout(entry.timer);
        entry.element.remove();
        this.toasts.delete(entry);
    }

    dismissAll() {
        for (const entry of [...this.toasts]) {
            this.dismiss(entry);
        }
    }

    destroy() {
        this.dismissAll();
        this.container.remove();
    }
}
