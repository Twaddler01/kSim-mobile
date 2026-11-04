






// src/ui/panels/FieldCanvas.js
//
// Top-down exploration demo:
//   · Camera pans over a world larger than the viewport
//   · Tap  = walk player to world position under finger
//   · Drag = pan camera (does not move player)
//   · 10 deposits live in the world, each respawns after being mined

const STRIKE_REACH = 12; // px beyond touching that counts as "in reach"
const TAP_HIT_RADIUS = 1.6; // tap hit detection, × d.r

const SPRITE_PX = 60;
const SPRITE_HALF = SPRITE_PX / 2;

const TAP_THRESHOLD = 10; // px of movement that promotes a tap to a pan

const PLAYER_SPEED = 200; // world units / second

const PLAYER_SVG = `
<svg class="sprite" viewBox="0 0 48 48" aria-hidden="true">
  <!-- Backpack (behind body) -->
  <path d="M15 28 Q15 40 24 41 Q33 40 33 28 L30 26 L18 26 Z"
        fill="#3a4453" stroke="#2a3240" stroke-width="1" stroke-linejoin="round"/>

  <!-- Chemistry vial on the strap -->
  <rect x="21" y="31" width="3" height="6" rx="1"
        fill="#88e0b0" stroke="#5a6474" stroke-width="0.6"/>
  <rect x="22" y="30" width="1" height="1.2" fill="#5a4a3a"/>

  <!-- Shoulders -->
  <path d="M11 22 Q11 19 14 18 L14 30 Q11 31 11 26 Z"
        fill="#dfe4ea" stroke="#5a6474" stroke-width="1" stroke-linejoin="round"/>
  <path d="M37 22 Q37 19 34 18 L34 30 Q37 31 37 26 Z"
        fill="#dfe4ea" stroke="#5a6474" stroke-width="1" stroke-linejoin="round"/>

  <!-- Coat back -->
  <path d="M14 20 Q20 21 24 21 Q28 21 34 20 Q35 30 24 34 Q13 30 14 20 Z"
        fill="#f0f3f7" stroke="#5a6474" stroke-width="1" stroke-linejoin="round"/>
  <!-- Left highlight facet -->
  <path d="M16 22 Q20 22 22 24 L22 30 Q18 29 16 26 Z"
        fill="#ffffff" opacity="0.75"/>
  <!-- Right shadow facet -->
  <path d="M32 22 Q28 22 26 24 L26 30 Q30 29 32 26 Z"
        fill="#c5cdd6" opacity="0.65"/>

  <!-- Pickaxe shaft -->
  <line x1="9" y1="34" x2="39" y2="27"
        stroke="#8a6a3c" stroke-width="2.2" stroke-linecap="round"/>
  <!-- Pickaxe head -->
  <path d="M37 23 L44 29 L36 33 L35 27 Z"
        fill="#aeb7c2" stroke="#5a6474" stroke-width="0.8" stroke-linejoin="round"/>

  <!-- Gloves gripping the shaft -->
  <circle cx="10" cy="33" r="2.6" fill="#3a4453" stroke="#2a3240" stroke-width="0.8"/>
  <circle cx="38" cy="27" r="2.6" fill="#3a4453" stroke="#2a3240" stroke-width="0.8"/>

  <!-- Helmet brim (front edge of dome) -->
  <path d="M15 18 Q24 22 33 18 L32 20 Q24 24 16 20 Z" fill="#a88020"/>

  <!-- Helmet dome -->
  <ellipse cx="24" cy="15" rx="8.5" ry="7.5"
           fill="#e0b030" stroke="#a88020" stroke-width="1"/>
  <path d="M18 12 Q21 9 24 9 Q22 12 20 13 Z" fill="#f5d566"/>
  <path d="M30 12 Q27 9 24 9 Q26 12 28 13 Z" fill="#c89820"/>

  <!-- Headlamp housing -->
  <circle cx="24" cy="10.5" r="3.2" fill="#5a4a2a"
          stroke="#a88020" stroke-width="0.6"/>
  <!-- Headlamp glow + core -->
  <circle class="lamp-glow" cx="24" cy="10.5" r="2.2" fill="#fffbe0"/>
  <circle cx="24" cy="10.5" r="1.1" fill="#ffffff"/>
</svg>
`;

export default class FieldCanvas {
    constructor({
        deposits = [],
        world = { width: 1200, height: 900 },
        respawnDelay = 3,
        backgroundCanvas = null,
        fallbackDepositCount = 10,
        onCollect,
        onRespawn,
        showToast
    } = {}) {
        this.onCollect = onCollect;
        this.onRespawn = onRespawn;
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

        // Clone so caller mutations don't leak in.
        this.world = { width: world.width, height: world.height };
        this.respawnDelay = respawnDelay;
        this.backgroundCanvas = backgroundCanvas;   // ← add
        this.fallbackDepositCount = fallbackDepositCount;

        this.camera = { x: 0, y: 0 };
        this.cameraInitialized = false;

        this.player = {
            x: this.world.width / 2,
            y: this.world.height / 2,
            tx: this.world.width / 2,
            ty: this.world.height / 2,
            r: 22,
            speed: PLAYER_SPEED
        };

        this.pendingDeposits = deposits;
        this.deposits = [];
        this.collected = 0;
        this.time = 0;

        // Active pointer state, or null when no pointer is down.
        this.pointer = null;

        this._loop = t => this.tick(t);
        this._onResize = () => this.resize();
        this._onPointerDown = e => this.handlePointerDown(e);
        this._onPointerMove = e => this.handlePointerMove(e);
        this._onPointerUp = e => this.handlePointerUp(e);
        this._onPointerCancel = e => this.handlePointerCancel(e);

        this.approachingDeposit = null;
    }

    setBackground(canvas) {
        this.backgroundCanvas = canvas;
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
            touchAction: "none"
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

        if (this.deposits.length === 0 && this.pendingDeposits.length > 0) {
            this.deposits = this.pendingDeposits.map(d => ({
                ...d,
                pulse: Math.random() * Math.PI * 2,
                active: true,
                respawnAt: 0,
                strikesLanded: 0,
                cracks: [],
                sparkles: this.makeSparkles(d.sparkleTier ?? 0, d.r ?? 22)
            }));
        } else if (this.deposits.length === 0) {
            this.spawnDeposits(this.fallbackDepositCount);
        }

        return this.element;
    }

    update() {
        this.activate();
    }

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
        this.canvas?.removeEventListener(
            "pointercancel",
            this._onPointerCancel
        );
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
                    x,
                    y,
                    r: 22,
                    pulse: Math.random() * Math.PI * 2,
                    active: true,
                    respawnAt: 0
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
            respawnAt: 0
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
            hasPanned: false
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

        if (!this.pointer.hasPanned) {
            const rect = this.canvas.getBoundingClientRect();
            const screenX = event.clientX - rect.left;
            const screenY = event.clientY - rect.top;
            const worldX = screenX + this.camera.x;
            const worldY = screenY + this.camera.y;

            const hit = this.hitTestDeposit(worldX, worldY);
            if (hit) {
                this.tryStrike(hit);
            } else {
                this.player.tx = this.clampWorldX(worldX);
                this.player.ty = this.clampWorldY(worldY);
                this.approachingDeposit = null;
            }
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

        for (const d of this.deposits) {
            if (!d.active) continue;
            // Auto-strike approaching deposit on arrival.
            if (this.approachingDeposit) {
                const d = this.approachingDeposit;
                if (!d.active) {
                    this.approachingDeposit = null;
                } else if (this.inReach(d)) {
                    this.strikeDeposit(d);
                    this.approachingDeposit = null;
                }
            }
        }

        // Respawn via the adapter so it can pick the right material.
        for (const d of this.deposits) {
            if (d.active || this.time < d.respawnAt) continue;

            const fresh = this.onRespawn
                ? this.onRespawn(d)
                : this.makeDeposit(); // ← standalone fallback

            if (fresh) {
                Object.assign(d, fresh, {
                    pulse: 0,
                    active: true,
                    respawnAt: 0,
                    strikesLanded: 0,
                    cracks: []
                });
                d.sparkles = this.makeSparkles(d.sparkleTier ?? 0, d.r ?? 22);
            }
            // If onRespawn returns null, deposit stays gone (finite field).
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
        this.playerEl.style.transform = `translate(${screenX - SPRITE_HALF}px, ${screenY - SPRITE_HALF}px)`;

        // Background.
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#0b0f14";
        ctx.fillRect(0, 0, w, h);

        this.drawWorld();
        this.drawHUD();
        this.drawMinimap();
    }

    // Grid (visible range only).
    drawGrid() {
        const ctx = this.ctx;
        const { width: w, height: h } = this;
        const cam = this.camera;
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
    }

    drawWorld() {
        const ctx = this.ctx;
        const cam = this.camera;
        const { width: w, height: h } = this;
        const { width: ww, height: wh } = this.world;

        // Background: one blit if we have a cache, else flat fill
        if (this.backgroundCanvas) {
            ctx.drawImage(
                this.backgroundCanvas,
                cam.x, cam.y, w, h,
                0, 0, w, h
            );
        } else {
            ctx.fillStyle = "#0b0f14";
            ctx.fillRect(0, 0, w, h);
        }

        ctx.save();
        ctx.translate(-cam.x, -cam.y);

        // Grid only when there's no background
        if (!this.backgroundCanvas) {
            this.drawGrid();
        }
        
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
        // Player shadow (under feet, not under the pickaxe tip)
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(
            this.player.x,
            this.player.y + SPRITE_HALF - 10, // was - 4
            11,
            3.5,
            0,
            0,
            Math.PI * 2 // was 12, 4
        );
        ctx.fill();

        // Deposits.
        for (const d of this.deposits) {
            if (!d.active) continue;

            // --- Hit shake (unchanged) ---
            const sinceHit = this.time - (d.hitFlash ?? -999);
            const shakeAmt = sinceHit < 0.12 ? (1 - sinceHit / 0.12) * 3 : 0;
            const drawX =
                d.x + (shakeAmt ? (Math.random() - 0.5) * shakeAmt * 2 : 0);
            const drawY =
                d.y + (shakeAmt ? (Math.random() - 0.5) * shakeAmt * 2 : 0);

            const scale = d.scale ?? 1;
            const rotation = d.rotation ?? 0;
            const s = d.r * 3;

            // --- 1. Ground shadow (base-anchored, scales but doesn't rotate) ---
            ctx.fillStyle = "rgba(0,0,0,0.35)";
            ctx.beginPath();
            ctx.ellipse(
                drawX,
                drawY + s * 0.35,
                s * 0.32 * scale,
                s * 0.1 * scale,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // --- 2. Crumbs (ground clutter — no rotate, no scale) ---
            if (d.crumbs) {
                for (const c of d.crumbs) {
                    ctx.globalAlpha = c.alpha;
                    ctx.fillStyle = c.color;
                    ctx.beginPath();
                    ctx.arc(
                        drawX + c.dx,
                        drawY + c.dy + s * 0.28,
                        c.r,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // --- 3. Sprite (rotated + scaled) ---
            if (d.sprite && d.sprite.complete && d.sprite.naturalWidth) {
                ctx.save();
                ctx.translate(drawX, drawY);
                ctx.rotate(rotation);
                ctx.scale(scale, scale);
                ctx.drawImage(d.sprite, -s / 2, -s / 2, s, s);
                ctx.restore();
            } else {
                // Fallback circle (still gets scale for consistency)
                const r = d.r ?? 22;
                ctx.fillStyle = "rgba(120,255,180,0.75)";
                ctx.beginPath();
                ctx.arc(drawX, drawY, r * scale, 0, Math.PI * 2);
                ctx.fill();
            }

            // Cracks
            if (d.cracks && d.cracks.length > 0) {
                ctx.strokeStyle = "rgba(0,0,0,0.55)";
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";
                for (const c of d.cracks) {
                    ctx.beginPath();
                    ctx.moveTo(
                        drawX + Math.cos(c.angle) * c.innerR,
                        drawY + Math.sin(c.angle) * c.innerR
                    );
                    ctx.lineTo(
                        drawX + Math.cos(c.angle) * c.outerR,
                        drawY + Math.sin(c.angle) * c.outerR
                    );
                    ctx.stroke();
                }
            }

            // Sparkles (ambient orbital motes, tier from richness)
            if (d.sparkleTier > 0 && d.sparkles) {
                for (const s of d.sparkles) {
                    const angle = s.baseAngle + this.time * s.orbitSpeed;
                    const sx = drawX + Math.cos(angle) * s.orbitRadius;
                    const sy = drawY + Math.sin(angle) * s.orbitRadius;
                    const twinkle =
                        0.5 +
                        0.5 * Math.sin(this.time * s.twinkleSpeed + s.phase);

                    // Soft glow
                    ctx.fillStyle = `rgba(160,255,200,${0.28 * twinkle})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, s.size * 2.2, 0, Math.PI * 2);
                    ctx.fill();

                    // Bright core
                    ctx.fillStyle = `rgba(230,255,240,${0.55 + 0.4 * twinkle})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            /*
            sparkleTable: [
                { richness: 1, tier: 0 },
                { richness: 2, tier: 1 },
                { richness: 3, tier: 3 },   // this field makes tier 3 richer
                { richness: 4, tier: 3 },
            ]
            */

            // Progress pips
            const required = d.strikesRequired ?? 1;
            if (required > 1 && d.strikesLanded > 0) {
                const pipY = drawY - d.r - 10;
                const gap = 6;
                const startX = drawX - ((required - 1) * gap) / 2;
                for (let i = 0; i < required; i++) {
                    ctx.fillStyle =
                        i < d.strikesLanded
                            ? "#7cc8ff"
                            : "rgba(255,255,255,0.18)";
                    ctx.beginPath();
                    ctx.arc(startX + i * gap, pipY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }

    drawHUD() {
        const ctx = this.ctx;
        ctx.fillStyle = "#e8f4ff";
        ctx.font = "600 14px system-ui, -apple-system, 'Segoe UI', sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText(
            this.hudText ?? `Deposits collected: ${this.collected}`,
            12,
            12
        );

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
        ctx.arc(
            mmX + this.player.x * sx,
            mmY + this.player.y * sy,
            2.5,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    hitTestDeposit(worldX, worldY) {
        for (const d of this.deposits) {
            if (!d.active) continue;
            const r = d.r * TAP_HIT_RADIUS;
            if (Math.hypot(worldX - d.x, worldY - d.y) <= r) return d;
        }
        return null;
    }

    inReach(d) {
        const p = this.player;
        return Math.hypot(p.x - d.x, p.y - d.y) <= p.r + d.r + STRIKE_REACH;
    }

    tryStrike(d) {
        if (this.inReach(d)) {
            this.strikeDeposit(d);
            return;
        }

        // Walk to deposit edge; auto-strike once on arrival.
        const p = this.player;
        const dx = d.x - p.x;
        const dy = d.y - p.y;
        const dist = Math.hypot(dx, dy);
        const stopDist = p.r + d.r + STRIKE_REACH * 0.5;

        if (dist > stopDist) {
            p.tx = this.clampWorldX(d.x - (dx / dist) * stopDist);
            p.ty = this.clampWorldY(d.y - (dy / dist) * stopDist);
        }
        this.approachingDeposit = d;
    }

    strikeDeposit(d) {
        if (!d.active) return;
        const required = d.strikesRequired ?? 1;
        if (d.strikesLanded >= required) return;

        d.strikesLanded++;
        d.hitFlash = this.time;
        d.cracks.push(this.makeCrack(d));

        if (d.strikesLanded >= required) {
            this.completeDeposit(d);
        }
    }

    makeCrack(d) {
        return {
            angle: Math.random() * Math.PI * 2,
            innerR: d.r * (0.15 + Math.random() * 0.1),
            outerR: d.r * (0.75 + Math.random() * 0.35)
        };
    }

    completeDeposit(d) {
        d.active = false;
        d.respawnAt = this.time + this.respawnDelay;
        d.strikesLanded = 0;
        d.cracks = [];

        const rect = this.canvas.getBoundingClientRect();
        const screenPos = {
            clientX: rect.left + (d.x - this.camera.x),
            clientY: rect.top + (d.y - this.camera.y)
        };

        this.onCollect?.(d, screenPos);
        this.showToast?.(`${d.label ?? "Deposit"} recovered`);
    }

    makeSparkles(tier, radius) {
        const count = [0, 2, 3, 5][tier] ?? 0;
        const sparkles = [];
        for (let i = 0; i < count; i++) {
            sparkles.push({
                baseAngle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
                orbitSpeed: 0.35 + Math.random() * 0.45,
                orbitRadius: radius * (1.5 + Math.random() * 0.5),
                twinkleSpeed: 1.8 + Math.random() * 2.2,
                phase: Math.random() * Math.PI * 2,
                size: 1.4 + Math.random() * 1.6
            });
        }
        return sparkles;
    }
}
