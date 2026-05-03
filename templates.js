// templates.js - Handle quote and invoice text
function generateQuote(jobDetails) {
  return `
    <h3>Quote for: ${jobDetails.jobType}</h3>
    <p>Customer: ${jobDetails.customerName}</p>
    <p>Total Cost: $${jobDetails.totalCost}</p>
  `;
}

export { generateQuote };
