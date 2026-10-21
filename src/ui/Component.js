/**
 * Base class for stateful DOM components.
 *
 * Lifecycle:
 *   render()  -> create the root once, then update it
 *   mount()   -> attach it to a parent and call onMount()
 *   update()  -> synchronize existing DOM with current component state
 *   unmount() -> detach it and call onUnmount()
 *   destroy() -> unmount, run cleanup callbacks, and permanently dispose it
 *
 * Subclasses implement createElement() and update(). Keep the root element
 * stable across updates whenever practical.
 */
export class Component {
    constructor({ className = "" } = {}) {
        this.className = className;
        this.element = null;
        this.isMounted = false;
        this.isDestroyed = false;
        this._cleanups = new Set();
    }

    createElement() {
        throw new Error(`${this.constructor.name} must implement createElement()`);
    }

    render() {
        if (this.isDestroyed) {
            throw new Error(`${this.constructor.name} has been destroyed`);
        }
        if (!this.element) this.element = this.createElement();
        this.update();
        return this.element;
    }

    /** Override to update the existing DOM from component state. */
    update() {
        return this;
    }

    mount(parent, before = null) {
        if (!parent || typeof parent.insertBefore !== "function") {
            throw new TypeError("mount(parent) requires a DOM parent element");
        }
        const element = this.render();
        if (element.parentNode !== parent || (before && element.nextSibling !== before)) {
            parent.insertBefore(element, before);
        }
        if (!this.isMounted) {
            this.isMounted = true;
            this.onMount();
        }
        return this;
    }

    unmount() {
        if (this.element?.parentNode) this.element.remove();
        if (this.isMounted) {
            this.isMounted = false;
            this.onUnmount();
        }
        return this;
    }

    destroy() {
        if (this.isDestroyed) return this;
        this.unmount();
        for (const cleanup of this._cleanups) {
            try {
                cleanup();
            } catch (error) {
                console.error(`Cleanup failed in ${this.constructor.name}:`, error);
            }
        }
        this._cleanups.clear();
        this.onDestroy();
        this.element = null;
        this.isDestroyed = true;
        return this;
    }

    /** Register a function to run once when destroy() is called. */
    addCleanup(cleanup) {
        if (typeof cleanup !== "function") {
            throw new TypeError("addCleanup(cleanup) requires a function");
        }
        if (this.isDestroyed) cleanup();
        else this._cleanups.add(cleanup);
        return () => this._cleanups.delete(cleanup);
    }

    /** Lifecycle hooks intended for subclasses to override. */
    onMount() {}
    onUnmount() {}
    onDestroy() {}
}

export default Component;
