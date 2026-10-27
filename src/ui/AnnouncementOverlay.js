import { el } from "./Element.js";

export default class AnnouncementOverlay {
    constructor({ onClose } = {}) {
        this.onClose = onClose ?? (() => {});
        this.element = el("div", {
            className: "announcement-overlay announcement-overlay--contained",
            hidden: true
        });

        this.backdrop = el("div", {
            className: "announcement-overlay-backdrop",
            "aria-hidden": "true"
        });

        this.stack = el("div", {
            className: "announcement-overlay-stack",
            role: "region",
            "aria-label": "New announcements"
        });

        this.element.append(this.backdrop, this.stack);
    }

    setAnnouncements(announcements = []) {
        this.stack.replaceChildren();

        for (const announcement of announcements) {
            const card = el(
                "article",
                {
                    className: "announcement-card",
                    "data-announcement-id": announcement.id
                },
                [
                    el("div", {
                        className: "announcement-card-eyebrow",
                        text: announcement.title
                    }),
                    el(
                        "div",
                        {
                            className: "announcement-card-heading"
                        },
                        [
                            el("span", {
                                className: "announcement-card-icon",
                                text: announcement.icon ?? "◈"
                            }),
                            el("h3", {
                                className: "announcement-card-name",
                                text: announcement.name ?? announcement.title
                            }),
                            el("span", {
                                className: "announcement-card-new",
                                text: "NEW"
                            })
                        ]
                    ),
                    el("p", {
                        className: "announcement-card-message",
                        text: announcement.message ?? ""
                    }),
                    el(
                        "div",
                        {
                            className: "announcement-card-actions"
                        },
                        [
                            el("button", {
                                className: "announcement-card-close",
                                type: "button",
                                text: "CLOSE",
                                "aria-label": `Close announcement: ${announcement.title}`,
                                onClick: () => {
                                    card.remove();

                                    this.stack.scrollTo({
                                        top: 0,
                                        behavior: "smooth"
                                    });

                                    this.onClose(announcement.id);

                                    if (this.stack.children.length === 0) {
                                        this.element.hidden = true;
                                    }
                                }
                            })
                        ]
                    )
                ]
            );

            this.stack.append(card);
        }

        this.element.hidden = announcements.length === 0;
        this.stack.scrollTop = 0;
    }

    destroy() {
        this.element.remove();
        this.stack.replaceChildren();
    }
}
