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

        return game.unread;
    }

    getUnreadItems(tabId) {
        return this.getState().items[tabId] ?? [];
    }

    getUnreadCount(tabId) {
        return this.getUnreadItems(tabId).length;
    }

    isUnread(tabId, itemId) {
        return this.getUnreadItems(tabId).includes(itemId);
    }

    notify(tabId, itemId) {
        const state = this.getState();

        state.items[tabId] ??= [];

        if (state.items[tabId].includes(itemId)) {
            return false;
        }

        // Every notification stays unread until explicitly acknowledged.
        state.items[tabId].push(itemId);

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
