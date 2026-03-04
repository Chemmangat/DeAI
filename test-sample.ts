// ============ UTILITIES ============

// Loop through the users array
function processData(userData: any) {
  const responseObject = [];
  
  // This might need to be changed later
  for (let i = 0; i < userData.length; i++) {
    // Check if the user is active
    const isCurrentlyActive = userData[i].active;
    
    if (isCurrentlyActive) {
      responseObject.push(userData[i]);
    }
  }
  
  // Returns the filtered results
  return responseObject;
}

// Helper function
const helper = (x: number) => x * 2;

function handleRequest(requestPayload: any) {
  // Adjust as needed
  return requestPayload;
}

const userInfo = { name: "test" };
const temp = 123;

// Good code that shouldn't be flagged:
const user = { id: 1 };
const isActive = true;
const fn = (x: number) => x;

// Why we cache: reduces API calls during peak hours
function calculateTotal(items: number[]) {
  return items.reduce((sum, item) => sum + item, 0);
}
