// CommonJS modules version
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCORS() {
  try {
    console.log('Testing CORS configuration...');
    
    // Test the root endpoint
    const rootResponse = await fetch('http://localhost:3000/', {
      method: 'GET',
      headers: {
        'Origin': 'https://example.com', // Simulate request from different origin
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Root endpoint response status:', rootResponse.status);
    console.log('CORS headers:', {
      'Access-Control-Allow-Origin': rootResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': rootResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': rootResponse.headers.get('Access-Control-Allow-Headers')
    });
    
    // Test an API endpoint
    const apiResponse = await fetch('http://localhost:3000/api/products', {
      method: 'GET',
      headers: {
        'Origin': 'https://example.com', // Simulate request from different origin
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\nAPI endpoint response status:', apiResponse.status);
    console.log('CORS headers:', {
      'Access-Control-Allow-Origin': apiResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': apiResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': apiResponse.headers.get('Access-Control-Allow-Headers')
    });
    
    // Test data from API endpoint
    const data = await apiResponse.json();
    console.log('\nAPI response data structure:', Object.keys(data));
    
  } catch (error) {
    console.error('Error testing CORS:', error);
  }
}

testCORS(); 