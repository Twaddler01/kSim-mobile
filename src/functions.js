import { discoveries, upgradeDefinitions } from "./data.js";

export function formatNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value);
}
export function addLog(game, message) {
  game.log.unshift(message);
  game.log = game.log.slice(0, 7);
}
export function canAfford(game, cost) {
  return Object.entries(cost).every(([key, amount]) => game.resources[key] >= amount);
}
export function payCost(game, cost) {
  if (!canAfford(game, cost)) return false;
  for (const [key, amount] of Object.entries(cost)) game.resources[key] -= amount;
  return true;
}
export function upgradeCost(definition, level) {
  return Object.fromEntries(Object.entries(definition.baseCost).map(([key, amount]) => [key, Math.ceil(amount * Math.pow(1.65, level))]));
}
export function stir(game, multiplier = 1) {
  const energyGain = (1 + game.upgrades.efficientClicks) * multiplier;
  game.resources.energy += energyGain;
  game.clicks++;
  game.discoveryRoll++;
  // A little early-game randomness makes each tap feel less mechanical.
  if (Math.random() < 0.18) game.resources.molecules += multiplier;
  checkDiscoveries(game);
  return { energy: energyGain };
}
export function checkDiscoveries(game) {
  for (const item of discoveries) {
    if (game.discoveries.includes(item.id) || game.clicks < item.requirement) continue;
    game.discoveries.push(item.id);
    for (const [key, amount] of Object.entries(item.reward)) game.resources[key] += amount;
    addLog(game, `Discovery: ${item.name}! Rewards added to your inventory.`);
  }
}
export function buyUpgrade(game, id) {
  const definition = upgradeDefinitions.find(item => item.id === id);
  if (!definition) return { ok:false, reason:"Unknown upgrade." };
  const level = game.upgrades[id];
  if (level >= definition.maxLevel) return { ok:false, reason:"Maximum level reached." };
  const cost = upgradeCost(definition, level);
  if (!payCost(game, cost)) return { ok:false, reason:"Not enough resources." };
  game.upgrades[id]++;
  addLog(game, `${definition.name} upgraded to level ${game.upgrades[id]}.`);
  return { ok:true };
}
export function costLabel(cost) {
  return Object.entries(cost).map(([key, value]) => `${value} ${key}`).join(" · ");
}
