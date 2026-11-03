// src/ui/panels/ExplorationDemo.js
//
// Top-down exploration demo with a vector SVG player sprite.
//
//   getElement() -> creates DOM once (canvas + SVG overlay)
//   update()     -> called by main.js when this tab is active
//   deactivate() -> called when leaving the tab; stops the loop

const SPRITE_PX = 40; // visual size of the player sprite
const SPRITE_HALF = SPRITE_PX / 2;

const PLAYER_SVG = `
<svg class="sprite" viewBox="0 0 32 32" aria-hidden="true">
  <!-- Outer hull -->
  <polygon points="16,3 26,10 26,22 16,29 6,22 6,10"
           fill="#3a4453"
           stroke="#7cc8ff"
           stroke-width="1.2"
           stroke-linejoin="round"/>
  <!-- Facets (matches the crystal style used in your mineral icons) -->
  <polygon points="16,3 26,10 16,14"  fill="#586378"/>
  <polygon points="16,3 16,14 6,10"   fill="#4a5464"/>
  <polygon points="6,10 16,14 6,22"   fill="#434c5c"/>
  <polygon points="26,10 26,22 16,14" fill="#525c6e"/>
  <polygon points="6,22 16,29 16,14"  fill="#4e5868"/>
  <polygon points="26,22 16,14 16,29" fill="#5a6578"/>
  <!-- Glowing core -->
  <circle class="core-glow" cx="16" cy="16" r="3.2" fill="#9ddcff" opacity="0.85"/>
  <circle cx="16" cy="16" r="1.6" fill="#ffffff"/>
</svg>
`;

export default class ExplorationDemo {
    constructor({ onCollect, showToast } = {}) {
        this.onCollect = onCollect;
        this.showToast = showToast;

        this.element = null;
        this.canvas = null;
        this.ctx = null;
        this.playerEl = null;
        this.rafId = null;
        this.lastTime = 0;
        this.active = false;
        this.collected = 0;

        this.dpr = 1;
        this.width = 0;
        this.height = 0;

        this.player = { x: 0, y: 0, tx: 0, ty: 0, r: 16, speed: 160 };
        this.collectible = null;

        this._loop = (t) => this.tick(t);
        this._onResize = () => this.resize();
        this._onPointer = (e) => this.handlePointer(e);
    }

    getElement() {
        if (this.element) return this.element;

        this.canvas = document.createElement("canvas");
        Object.assign(this.canvas.style, {
            display: "block",
            width: "100%",
            height: "340px",
            borderRadius: "10px",
            background: "#0b0f14",
            cursor: "crosshair",
            touchAction: "none", // critical on mobile
        });

        this.ctx = this.canvas.getContext("2d");

        // SVG player overlay.
        this.playerEl = document.createElement("div");
        this.playerEl.className = "exploration-player";
        this.playerEl.innerHTML = PLAYER_SVG;

        this.element = document.createElement("div");
        this.element.className = "exploration-demo";
        this.element.appendChild(this.canvas);
        this.element.appendChild(this.playerEl);

        requestAnimationFrame(() => this.resize());

        return this.element;
    }

    update() { this.activate(); }

    activate() {
        if (this.active || !this.canvas) return;
        this.active = true;

        this.resize();
        this.canvas.addEventListener("pointerdown", this._onPointer);
        window.addEventListener("resize", this._onResize);

        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this._loop);
    }

    deactivate() {
        this.active = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.canvas?.removeEventListener("pointerdown", this._onPointer);
        window.removeEventListener("resize", this._onResize);
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        if (this.player.x === 0 && this.player.y === 0) {
            this.player.x = this.width / 2;
            this.player.y = this.height / 2;
            this.player.tx = this.player.x;
            this.player.ty = this.player.y;
        }

        if (!this.collectible) this.spawnCollectible();
    }

    spawnCollectible() {
        const m = 40;
        this.collectible = {
            x: m + Math.random() * (this.width - m * 2),
            y: m + Math.random() * (this.height - m * 2),
            r: 18,
            pulse: Math.random() * Math.PI * 2,
        };
    }

    handlePointer(event) {
        if (!this.canvas) return;
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.player.tx = event.clientX - rect.left;
        this.player.ty = event.clientY - rect.top;
    }

    tick(now) {
        if (!this.active) return;
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        this.step(dt);
        this.draw();

        this.rafId = requestAnimationFrame(this._loop);
    }

    step(dt) {
        const p = this.player;
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.hypot(dx, dy);
        const moving = dist > 1;

        if (moving) {
            const step = Math.min(dist, p.speed * dt);
            p.x += (dx / dist) * step;
            p.y += (dy / dist) * step;
        }

        // Position the SVG sprite (centered on the player's world point).
        this.playerEl.style.transform =
            `translate(${p.x - SPRITE_HALF}px, ${p.y - SPRITE_HALF}px)`;
        this.playerEl.classList.toggle("is-moving", moving);

        const c = this.collectible;
        if (!c) return;
        c.pulse += dt * 3;

        if (Math.hypot(p.x - c.x, p.y - c.y) < p.r + c.r) {
            this.collected++;
            this.onCollect?.(this.collected);
            this.showToast?.(`Deposit recovered (${this.collected} total)`);
            this.spawnCollectible();
        }
    }

    draw() {
        const ctx = this.ctx;
        const { width: w, height: h } = this;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#0b0f14";
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        const g = 40;
        ctx.beginPath();
        for (let x = 0; x <= w; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 0; y <= h; y += g) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        // Destination marker
        ctx.strokeStyle = "rgba(120,200,255,0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.player.tx, this.player.ty, 7, 0, Math.PI * 2);
        ctx.stroke();

        // Soft shadow under the player sprite (grounding it)
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(this.player.x, this.player.y + SPRITE_HALF - 4, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Collectible (pulsing crystal)
        const c = this.collectible;
        if (c) {
            const glow = 0.55 + Math.sin(c.pulse) * 0.25;
            const halo = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 2.2);
            halo.addColorStop(0, `rgba(120,255,180,${glow * 0.5})`);
            halo.addColorStop(1, "rgba(120,255,180,0)");
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r * 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(120,255,180,${0.75 + Math.sin(c.pulse) * 0.15})`;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(230,255,240,0.95)";
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }

        // HUD text
        ctx.fillStyle = "#e8f4ff";
        ctx.font = "600 14px system-ui, -apple-system, 'Segoe UI', sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText(`Deposits collected: ${this.collected}`, 12, 12);

        ctx.fillStyle = "rgba(180,210,240,0.65)";
        ctx.font = "400 12px system-ui, -apple-system, 'Segoe UI', sans-serif";
        ctx.fillText("Tap to move · touch the deposit to mine", 12, 32);
    }
}