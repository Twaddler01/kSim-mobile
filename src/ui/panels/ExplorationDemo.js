// src/ui/panels/ExplorationDemo.js
//
// Top-down exploration demo:
//   · Camera pans over a world larger than the viewport
//   · Tap  = walk player to world position under finger
//   · Drag = pan camera (does not move player)
//   · 10 deposits live in the world, each respawns after being mined

const SPRITE_PX = 40;
const SPRITE_HALF = SPRITE_PX / 2;

const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 900;

const DEPOSIT_COUNT = 10;
const RESPAWN_DELAY = 3;      // seconds
const TAP_THRESHOLD = 10;     // px of movement that promotes a tap to a pan

const PLAYER_SPEED = 200;     // world units / second

const PLAYER_SVG = `
<svg class="sprite" viewBox="0 0 32 32" aria-hidden="true">
  <polygon points="16,3 26,10 26,22 16,29 6,22 6,10"
           fill="#3a4453" stroke="#7cc8ff" stroke-width="1.2" stroke-linejoin="round"/>
  <polygon points="16,3 26,10 16,14"  fill="#586378"/>
  <polygon points="16,3 16,14 6,10"   fill="#4a5464"/>
  <polygon points="6,10 16,14 6,22"   fill="#434c5c"/>
  <polygon points="26,10 26,22 16,14" fill="#525c6e"/>
  <polygon points="6,22 16,29 16,14"  fill="#4e5868"/>
  <polygon points="26,22 16,14 16,29" fill="#5a6578"/>
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

        this.dpr = 1;
        this.width = 0;
        this.height = 0;

        this.world = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
        this.camera = { x: 0, y: 0 };
        this.cameraInitialized = false;

        this.player = {
            x: WORLD_WIDTH / 2,
            y: WORLD_HEIGHT / 2,
            tx: WORLD_WIDTH / 2,
            ty: WORLD_HEIGHT / 2,
            r: 16,
            speed: PLAYER_SPEED,
        };

        this.deposits = [];
        this.collected = 0;
        this.time = 0;

        // Active pointer state, or null when no pointer is down.
        this.pointer = null;

        this._loop = (t) => this.tick(t);
        this._onResize = () => this.resize();
        this._onPointerDown = (e) => this.handlePointerDown(e);
        this._onPointerMove = (e) => this.handlePointerMove(e);
        this._onPointerUp = (e) => this.handlePointerUp(e);
        this._onPointerCancel = (e) => this.handlePointerCancel(e);
    }

    // ---------------------------------------------------------------
    // DOM
    // ---------------------------------------------------------------

    getElement() {
        if (this.element) return this.element;

        this.canvas = document.createElement("canvas");
        Object.assign(this.canvas.style, {
            display: "block",
            width: "100%",
            height: "340px",
            borderRadius: "10px",
            background: "#0b0f14",
            cursor: "grab",
            touchAction: "none",
        });
        this.ctx = this.canvas.getContext("2d");

        this.playerEl = document.createElement("div");
        this.playerEl.className = "exploration-player";
        this.playerEl.innerHTML = PLAYER_SVG;

        this.element = document.createElement("div");
        this.element.className = "exploration-demo";
        this.element.appendChild(this.canvas);
        this.element.appendChild(this.playerEl);

        requestAnimationFrame(() => this.resize());

        if (this.deposits.length === 0) {
            this.spawnDeposits(DEPOSIT_COUNT);
        }

        return this.element;
    }

    update() { this.activate(); }

    activate() {
        if (this.active || !this.canvas) return;
        this.active = true;

        this.resize();
        this.canvas.addEventListener("pointerdown", this._onPointerDown);
        this.canvas.addEventListener("pointermove", this._onPointerMove);
        this.canvas.addEventListener("pointerup", this._onPointerUp);
        this.canvas.addEventListener("pointercancel", this._onPointerCancel);
        window.addEventListener("resize", this._onResize);

        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this._loop);
    }

    deactivate() {
        this.active = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.canvas?.removeEventListener("pointerdown", this._onPointerDown);
        this.canvas?.removeEventListener("pointermove", this._onPointerMove);
        this.canvas?.removeEventListener("pointerup", this._onPointerUp);
        this.canvas?.removeEventListener("pointercancel", this._onPointerCancel);
        window.removeEventListener("resize", this._onResize);
        this.pointer = null;
    }

    // ---------------------------------------------------------------
    // Sizing / camera helpers
    // ---------------------------------------------------------------

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

        if (!this.cameraInitialized) {
            this.centerCameraOnPlayer();
            this.cameraInitialized = true;
        } else {
            this.camera.x = this.clampCameraX(this.camera.x);
            this.camera.y = this.clampCameraY(this.camera.y);
        }
    }

    centerCameraOnPlayer() {
        this.camera.x = this.clampCameraX(this.player.x - this.width / 2);
        this.camera.y = this.clampCameraY(this.player.y - this.height / 2);
    }

    clampCameraX(x) {
        return Math.max(0, Math.min(x, this.world.width - this.width));
    }

    clampCameraY(y) {
        return Math.max(0, Math.min(y, this.world.height - this.height));
    }

    clampWorldX(x) {
        return Math.max(0, Math.min(x, this.world.width));
    }

    clampWorldY(y) {
        return Math.max(0, Math.min(y, this.world.height));
    }

    // ---------------------------------------------------------------
    // Deposits
    // ---------------------------------------------------------------

    spawnDeposits(count) {
        for (let i = 0; i < count; i++) {
            this.deposits.push(this.makeDeposit());
        }
    }

    makeDeposit() {
        const m = 60;
        for (let attempt = 0; attempt < 60; attempt++) {
            const x = m + Math.random() * (this.world.width - m * 2);
            const y = m + Math.random() * (this.world.height - m * 2);

            const tooCloseToDeposit = this.deposits.some(
                d => d.active && Math.hypot(d.x - x, d.y - y) < 100
            );
            const tooCloseToPlayer =
                Math.hypot(this.player.x - x, this.player.y - y) < 120;

            if (!tooCloseToDeposit && !tooCloseToPlayer) {
                return {
                    x, y,
                    r: 16,
                    pulse: Math.random() * Math.PI * 2,
                    active: true,
                    respawnAt: 0,
                };
            }
        }
        // Fallback: place anywhere within margins.
        return {
            x: m + Math.random() * (this.world.width - m * 2),
            y: m + Math.random() * (this.world.height - m * 2),
            r: 16,
            pulse: 0,
            active: true,
            respawnAt: 0,
        };
    }

    // ---------------------------------------------------------------
    // Pointer — tap vs. swipe
    // ---------------------------------------------------------------

    handlePointerDown(event) {
        event.preventDefault();
        if (this.pointer) return; // ignore secondary touches

        const rect = this.canvas.getBoundingClientRect();
        this.pointer = {
            id: event.pointerId,
            startX: event.clientX - rect.left,
            startY: event.clientY - rect.top,
            startCameraX: this.camera.x,
            startCameraY: this.camera.y,
            hasPanned: false,
        };
        this.canvas.setPointerCapture?.(event.pointerId);
    }

    handlePointerMove(event) {
        if (!this.pointer || event.pointerId !== this.pointer.id) return;
        event.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const dx = x - this.pointer.startX;
        const dy = y - this.pointer.startY;

        if (!this.pointer.hasPanned && Math.hypot(dx, dy) > TAP_THRESHOLD) {
            this.pointer.hasPanned = true;
            this.canvas.style.cursor = "grabbing";
        }

        if (this.pointer.hasPanned) {
            this.camera.x = this.clampCameraX(this.pointer.startCameraX - dx);
            this.camera.y = this.clampCameraY(this.pointer.startCameraY - dy);
        }
    }

    handlePointerUp(event) {
        if (!this.pointer || event.pointerId !== this.pointer.id) return;

        // If the pointer never crossed the threshold, treat it as a tap.
        if (!this.pointer.hasPanned) {
            const rect = this.canvas.getBoundingClientRect();
            const screenX = event.clientX - rect.left;
            const screenY = event.clientY - rect.top;
            this.player.tx = this.clampWorldX(screenX + this.camera.x);
            this.player.ty = this.clampWorldY(screenY + this.camera.y);
        }

        this.canvas.releasePointerCapture?.(event.pointerId);
        this.canvas.style.cursor = "grab";
        this.pointer = null;
    }

    handlePointerCancel(event) {
        if (!this.pointer || event.pointerId !== this.pointer.id) return;
        this.canvas.style.cursor = "grab";
        this.pointer = null;
    }

    // ---------------------------------------------------------------
    // Loop
    // ---------------------------------------------------------------

    tick(now) {
        if (!this.active) return;
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        this.step(dt);
        this.draw();

        this.rafId = requestAnimationFrame(this._loop);
    }

    step(dt) {
        this.time += dt;

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

        this.playerEl.classList.toggle("is-moving", moving);

        // Collect any deposit we touch.
        for (const d of this.deposits) {
            if (!d.active) continue;
            if (Math.hypot(p.x - d.x, p.y - d.y) < p.r + d.r) {
                d.active = false;
                d.respawnAt = this.time + RESPAWN_DELAY;
                this.collected++;
                this.onCollect?.(this.collected);
                this.showToast?.(`Deposit recovered (${this.collected} total)`);
            }
        }

        // Respawn collected deposits.
        for (const d of this.deposits) {
            if (d.active) continue;
            if (this.time >= d.respawnAt) {
                Object.assign(d, this.makeDeposit());
            }
        }

        // Animate pulses.
        for (const d of this.deposits) {
            d.pulse += dt * 3;
        }
    }

    draw() {
        const ctx = this.ctx;
        const { width: w, height: h } = this;

        // Position the SVG overlay in screen space.
        const screenX = this.player.x - this.camera.x;
        const screenY = this.player.y - this.camera.y;
        this.playerEl.style.transform =
            `translate(${screenX - SPRITE_HALF}px, ${screenY - SPRITE_HALF}px)`;

        // Background.
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#0b0f14";
        ctx.fillRect(0, 0, w, h);

        this.drawWorld();
        this.drawHUD();
        this.drawMinimap();
    }

    drawWorld() {
        const ctx = this.ctx;
        const cam = this.camera;
        const { width: w, height: h } = this;
        const { width: ww, height: wh } = this.world;

        ctx.save();
        ctx.translate(-cam.x, -cam.y);

        // Grid (visible range only).
        const g = 40;
        const startX = Math.floor(cam.x / g) * g;
        const startY = Math.floor(cam.y / g) * g;
        const endX = cam.x + w;
        const endY = cam.y + h;

        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += g) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += g) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();

        // World bounds.
        ctx.strokeStyle = "rgba(120,200,255,0.25)";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, ww, wh);

        // Destination marker.
        ctx.strokeStyle = "rgba(120,200,255,0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.player.tx, this.player.ty, 7, 0, Math.PI * 2);
        ctx.stroke();

        // Player shadow (in world space, under the SVG sprite).
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(
            this.player.x,
            this.player.y + SPRITE_HALF - 4,
            12, 4, 0, 0, Math.PI * 2
        );
        ctx.fill();

        // Deposits.
        for (const d of this.deposits) {
            if (!d.active) continue;

            const glow = 0.55 + Math.sin(d.pulse) * 0.25;
            const halo = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 2.2);
            halo.addColorStop(0, `rgba(120,255,180,${glow * 0.5})`);
            halo.addColorStop(1, "rgba(120,255,180,0)");
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r * 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(120,255,180,${0.75 + Math.sin(d.pulse) * 0.15})`;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(230,255,240,0.95)";
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawHUD() {
        const ctx = this.ctx;
        ctx.fillStyle = "#e8f4ff";
        ctx.font = "600 14px system-ui, -apple-system, 'Segoe UI', sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText(`Deposits collected: ${this.collected}`, 12, 12);

        ctx.fillStyle = "rgba(180,210,240,0.65)";
        ctx.font = "400 12px system-ui, -apple-system, 'Segoe UI', sans-serif";
        ctx.fillText("Tap to move · drag to pan · mine the deposits", 12, 32);
    }

    drawMinimap() {
        const ctx = this.ctx;
        const { width: w, height: h } = this;

        const mmW = 120;
        const mmH = 90;
        const mmX = w - mmW - 10;
        const mmY = h - mmH - 10;
        const sx = mmW / this.world.width;
        const sy = mmH / this.world.height;

        // Panel.
        ctx.fillStyle = "rgba(10,15,22,0.85)";
        ctx.fillRect(mmX, mmY, mmW, mmH);
        ctx.strokeStyle = "rgba(120,200,255,0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(mmX, mmY, mmW, mmH);

        // Viewport frame.
        ctx.strokeStyle = "rgba(120,200,255,0.4)";
        ctx.strokeRect(
            mmX + this.camera.x * sx,
            mmY + this.camera.y * sy,
            this.width * sx,
            this.height * sy
        );

        // Deposits.
        for (const d of this.deposits) {
            if (!d.active) continue;
            ctx.fillStyle = "rgba(120,255,180,0.9)";
            ctx.beginPath();
            ctx.arc(mmX + d.x * sx, mmY + d.y * sy, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Player.
        ctx.fillStyle = "#7cc8ff";
        ctx.beginPath();
        ctx.arc(mmX + this.player.x * sx, mmY + this.player.y * sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}