// pricing.js - Pricing formulas
const baseRates = {
  treeRemoval: 300,
  stumpGrinding: 150,
  trimming: 100,
};

function calculateJobCost(jobType) {
  return baseRates[jobType] || 0;
}

export { calculateJobCost };
