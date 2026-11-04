Knob Currently Where it should live Notes
spawnTable fields.js fields.js ✅ already right
richnessTable fields.js fields.js ✅ already right
unlockTrigger fields.js fields.js ✅ already right
visualVariant fields.js fields.js ✅ cosmetic, fine
icon / name / description fields.js fields.js ✅
material.field.dropChance materials.js delete Dead — spawnTable superseded it
tier materials.js materials.js Currently descriptive only
DEPOSIT_COUNT = 10 FieldScene.js (code) fields.js Should be per-field
WORLD_W/H = 1200/900 FieldScene.js (code) fields.js Should be per-field
RESPAWN_DELAY = 3 FieldCanvas.js (code) fields.js Should be per-field
SPRITE_PX = 60 FieldCanvas.js (code) code Presentation, stays
PLAYER_SPEED = 200 FieldCanvas.js (code) code Global constant, stays
TAP_THRESHOLD = 10 FieldCanvas.js (code) code Input feel, stays
STRIKE_REACH = 12 FieldCanvas.js (code) code Interaction feel, stays
TAP_HIT_RADIUS = 1.6 FieldCanvas.js (code) code Hit detection, stays
selectStrikes fallback 1 + richness FieldScene.js data + code fallback Needs data hook
selectSparkleTier fallback richness - 1 FieldScene.js data + code fallback Needs data hook
makeSparkles tier counts [0,2,3,5] FieldCanvas.js (code) code Fixed per tier, stays
Sparkle orbit/twinkle ranges FieldCanvas.js (code) code Presentation, stays
Crack line params FieldCanvas.js (code) code Visual feel, stays
Shake amplitude/duration FieldCanvas.js (code) code Visual feel, stays
strikeCountTable — fields.js (new) Per-field override
sparkleTable — fields.js (new) Per-field override
mineTimeMultiplier — fields.js (future) Tool-scaling hook
growthSpots — fields.js (future) Vein expansion