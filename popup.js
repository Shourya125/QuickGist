// popup.js
console.log("Hi!");

const ele = document.getElementById("gist");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const activeTabUrl = tabs[0].url;  
  console.log("Active Tab URL:", activeTabUrl); 
  
  fetch('http://localhost:3000', {
  method: 'POST',  // Set the method to POST
  headers: {
    'Content-Type': 'application/json',  // Tell the server you're sending JSON
  },
  body: JSON.stringify({              // Convert the URL to a JSON body
    url: activeTabUrl
  }) 
})
  .then(response => {
    // Check if the response was successful
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();  // Parse the JSON response from the server
  })
  .then(data => {
    console.log('Server Response:', data);
    ele.innerHTML=data.paragraphs;  // Handle the response from the server
  })
  .catch(error => {
    console.error('Error:', error);  // Handle any errors
  });
});

