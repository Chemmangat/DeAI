// Good code - should have minimal or no issues

// Why we cache: reduces API calls during peak hours
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item, 0);
}

const user = { id: 1, name: "Alice" };
const isActive = true;
const fn = (x) => x * 2;

// Business logic: apply discount only for premium members
function applyDiscount(price, isPremium) {
  return isPremium ? price * 0.9 : price;
}
