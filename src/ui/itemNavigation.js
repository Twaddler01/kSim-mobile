const pageRegistry = new Map();

function destinationRef({ tab, pageId, itemId } = {}) {
    return [tab, pageId, itemId]
        .filter(value => value != null && value !== "")
        .map(String)
        .join("/");
}

function warnNavigationFailure(target, reason) {
    console.warn(
        `[Navigation] Failed: ${destinationRef(target) || "(empty destination)"}`,
        { reason }
    );
}

function pageKey(tab, pageId) {
    return `${tab}\0${pageId}`;
}

function waitForRender() {
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

export function itemDomId(tab, itemId) {
    return `ksim-item-${tab}-${encodeURIComponent(String(itemId))}`;
}

/**

* Register a page with an optional activation handler and

* optional page-specific item-navigation handler.
  */
export function registerPage(tab, pageId, handlers = {}) {
    if (!tab || !pageId) {
        throw new TypeError("registerPage requires tab and pageId.");
    }

    const key = pageKey(tab, pageId);
    pageRegistry.set(key, {
        activate: handlers.activate,
        navigateToItem: handlers.navigateToItem
    });

    return () => {
        if (
            pageRegistry.get(key)?.activate === handlers.activate &&
            pageRegistry.get(key)?.navigateToItem === handlers.navigateToItem
        ) {
            pageRegistry.delete(key);
        }
    };
}

export function unregisterPage(tab, pageId) {
    return pageRegistry.delete(pageKey(tab, pageId));
}

/**
 * Navigate to a tab, an optional registered page, and an optional item.
 * Returns true on success and false if the destination cannot be resolved.
 */

export async function navigateTo(tabs, target = {}) {
    const { tab, pageId, itemId } = target;

    if (!tabs || !tab) {
        warnNavigationFailure(target, "invalid-destination");
        return false;
    }

    const tabExists = tabs.tabs?.some(item => item.id === tab);

    if (!tabExists) {
        warnNavigationFailure(target, "tab-not-found");
        return false;
    }

    let page = null;

    if (pageId != null) {
        page = pageRegistry.get(pageKey(tab, pageId));

        if (!page) {
            warnNavigationFailure(target, "page-not-found");
            return false;
        }
    }

    tabs.setActiveTab(tab, { notify: true });

    if (page?.activate) {
        let activated;

        try {
            activated = await page.activate();
        } catch (error) {
            console.warn(`[Navigation] Failed: ${destinationRef(target)}`, {
                reason: "page-activation-failed",
                error
            });
            return false;
        }

        if (activated === false) {
            // Page handlers can log a more specific reason themselves.
            return false;
        }
    }

    if (itemId == null) {
        return true;
    }

    await waitForRender();

    let navigated = false;

    if (page?.navigateToItem) {
        navigated = await page.navigateToItem(itemId);
    } else {
        const element = document.getElementById(itemDomId(tab, itemId));

        if (element) {
            const isLastItem =
                element.parentElement?.lastElementChild === element;

            element.scrollIntoView({
                behavior: "smooth",
                block: isLastItem ? "end" : "center"
            });

            navigated = true;
        }
    }

    if (!navigated) {
        warnNavigationFailure(target, "item-not-found");
        return false;
    }

    return true;
}

/**

* Backwards-compatible entry point for existing item-navigation callers.

* It also accepts pageId when a page-specific destination is needed.
  */
export function navigateToItem(tabs, target = {}) {
    if (target.itemId == null) {
        warnNavigationFailure(target, "item-id-required");
        return Promise.resolve(false);
    }

    return navigateTo(tabs, target);
}
