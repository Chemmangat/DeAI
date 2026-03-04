// ============ UTILITIES ============

// Loop through the users array
function processData(userData: any) {
  const responses = [];

  
  // This might need to be changed later
  for (let i = 0; i < userData.length; i++) {
    // Check if the user is active
    const isActive = userData[i].active;
    
    if (isActive) {
      responses.push(userData[i]);
    }
  }
  
  // Returns the filtered results
  return responses;
}

// Helper function
const helper = (x: number) => x * 2;

function handleRequest(requestPayload: any) {
  // Adjust as needed
  return requestPayload;
}

const userInfo = { name: "test" };
const temp = 123;
