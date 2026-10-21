export const initialGameData = {
  version: 1, stage: 0, clicks: 0, discoveryRoll: 0,
  resources: { energy: 0, water: 0, molecules: 0, knowledge: 0 },
  upgrades: { efficientClicks: 0, autoStir: 0 }, discoveries: [],
  log: ["The world is quiet. Something may be forming in the primordial soup."], lastTick: Date.now()
};
export const resourceDefinitions = {
  energy: { label: "Energy", icon: "⚡", description: "Fuel for early chemistry." },
  water: { label: "Water", icon: "💧", description: "A stable medium for reactions." },
  molecules: { label: "Molecules", icon: "🫧", description: "Small building blocks of life." },
  knowledge: { label: "Knowledge", icon: "🧠", description: "Insights gained from discoveries." }
};
export const discoveries = [
  { id:"water", name:"Liquid Water", icon:"💧", description:"A solvent makes complex reactions possible.", requirement:12, reward:{water:8,knowledge:1} },
  { id:"organic", name:"Organic Molecules", icon:"🧬", description:"Carbon-based compounds begin to accumulate.", requirement:28, reward:{molecules:8,knowledge:2} },
  { id:"membrane", name:"Lipid Membranes", icon:"🫧", description:"Tiny boundaries begin separating chemistry from the soup.", requirement:55, reward:{molecules:15,knowledge:4} },
  { id:"replication", name:"Self-Replication", icon:"🧬", description:"A molecule-like system starts making copies.", requirement:90, reward:{molecules:25,knowledge:8} }
];
export const upgradeDefinitions = [
  { id:"efficientClicks", name:"Concentrated Reactions", icon:"⚗️", description:"Gain more energy each time you stir.", baseCost:{energy:12}, maxLevel:10 },
  { id:"autoStir", name:"Thermal Currents", icon:"♨️", description:"Automatically stir the soup once per second per level.", baseCost:{energy:25,water:4}, maxLevel:5 }
];
