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
        return this.getState().pending[tabId]?.length ?? 0;
    }

    isUnread(tabId, itemId) {
        return this.getUnreadItems(tabId).includes(itemId);
    }

    notify(tabId, itemId) {
        const state = this.getState();

        state.items[tabId] ??= [];
        state.pending[tabId] ??= [];

        if (state.items[tabId].includes(itemId)) {
            return false;
        }

        state.items[tabId].push(itemId);

        if (!this.isTabActive(tabId)) {
            state.pending[tabId].push(itemId);
        }

        this.changed();
        return true;
    }

    markTabSeen(tabId, { notify = true } = {}) {
        const state = this.getState();
        const pending = state.pending[tabId] ?? [];

        if (pending.length === 0) return false;

        state.pending[tabId] = [];

        if (notify) this.changed();
        return true;
    }

    markRead(tabId, itemId) {
        const state = this.getState();
        const items = state.items[tabId] ?? [];

        if (!items.includes(itemId)) return false;

        state.items[tabId] = items.filter(id => id !== itemId);
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
