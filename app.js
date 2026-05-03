// Basic app.js structure

// Initialize variables or constants if needed
let basePrice = 100; // Example
let extraCosts = 50; // Example

// Example function for calculating total price
function calculateTotal() {
  let total = basePrice + extraCosts;
  document.getElementById("totalPrice").textContent = `$${total}`;
}

// Event listener for button clicks
document.getElementById("calculateBtn").addEventListener("click", calculateTotal);
