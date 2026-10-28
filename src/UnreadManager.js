export default class UnreadManager {
    constructor({
        getGame,
        save = () => {},
        onChange = () => {},
        isTabActive = () => false
    }) {
        this.getGame = getGame;
        this.save = save;
        this.onChange = onChange;
        this.isTabActive = isTabActive;
    }

    getState() {
        const game = this.getGame();

        game.unread ??= {
            items: {},
            pending: {}
        };

        game.unread.items ??= {};
        game.unread.pending ??= {};
        game.unread.badgeExcluded ??= {};

        return game.unread;
    }

    getUnreadItems(tabId) {
        return this.getState().items[tabId] ?? [];
    }

    getUnreadCount(tabId) {
        const state = this.getState();
        const items = state.items[tabId] ?? [];
        const excluded = state.badgeExcluded[tabId] ?? [];

        return items.filter(id => !excluded.includes(id)).length;
    }

    isUnread(tabId, itemId) {
        return this.getUnreadItems(tabId).includes(itemId);
    }

    notify(tabId, itemId, { showBadge = true } = {}) {
        const state = this.getState();

        state.items[tabId] ??= [];
        state.badgeExcluded[tabId] ??= [];

        if (state.items[tabId].includes(itemId)) {
            return false;
        }

        state.items[tabId].push(itemId);

        if (!showBadge && !state.badgeExcluded[tabId].includes(itemId)) {
            state.badgeExcluded[tabId].push(itemId);
        }

        this.changed();
        return true;
    }

    // Visiting a tab must never acknowledge its unread items.
    markTabSeen() {
        return false;
    }

    markRead(tabId, itemId) {
        const state = this.getState();
        const items = state.items[tabId] ?? [];

        if (!items.includes(itemId)) return false;

        state.items[tabId] = items.filter(id => id !== itemId);

        state.badgeExcluded[tabId] = (state.badgeExcluded[tabId] ?? []).filter(
            id => id !== itemId
        );

        // Clean up any pending state left by an older save.
        state.pending[tabId] = (state.pending[tabId] ?? []).filter(
            id => id !== itemId
        );

        this.changed();
        return true;
    }

    changed() {
        this.save();
        this.onChange();
    }
}
