import React from 'react';

// ============ COMPONENTS ============

// This component renders the user data
function UserComponent(props: any) {
  const userData = props.userData;
  const userDetails = props.userDetails;
  
  // Loop through the items
  const items = userData.map((item: any) => {
    // Check if item is valid
    return <div key={item.id}>{item.name}</div>;
  });
  
  // Returns the JSX
  return <div>{items}</div>;
}

// Helper component - feel free to modify as needed
const helper = () => <div>Loading...</div>;

export default UserComponent;
