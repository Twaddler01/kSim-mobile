export function itemDomId(tab, itemId) {
    return `ksim-item-${tab}-${encodeURIComponent(String(itemId))}`;
}

export async function navigateToItem(tabs, { tab, itemId } = {}) {
    if (!tabs || !tab || itemId == null) return false;

    // Switch tabs first so the destination card gets rendered.
    tabs.setActiveTab(tab, { notify: true });

    // Wait for the DOM to finish updating.
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });

    const target = document.getElementById(itemDomId(tab, itemId));

    if (!target) return false;

    const isLastItem = target.parentElement?.lastElementChild === target;

    target.scrollIntoView({
        behavior: "smooth",
        block: isLastItem ? "end" : "center"
    });

    return true;
}
