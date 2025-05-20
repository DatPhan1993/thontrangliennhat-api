/**
 * API Test Script
 * This script tests API endpoints and verifies CORS and image handling
 */

// Import fetch using dynamic import for CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Base URL for API calls
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Test a specific API endpoint
async function testApiEndpoint(endpoint) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Testing endpoint: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Origin': 'https://thontrangliennhat.com',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log('CORS Headers:');
    console.log(`  Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`  Access-Control-Allow-Methods: ${response.headers.get('Access-Control-Allow-Methods')}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Response data: ${JSON.stringify(data).slice(0, 100)}...`);
    } else {
      console.log(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed to test endpoint ${endpoint}:`, error.message);
  }
  
  console.log('---');
}

// Test image handling
async function testImageEndpoint(imagePath) {
  try {
    const url = `${API_BASE_URL}${imagePath}`;
    console.log(`Testing image: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Origin': 'https://thontrangliennhat.com'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log('CORS Headers:');
    console.log(`  Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
    
    if (response.ok) {
      const contentType = response.headers.get('Content-Type');
      const contentLength = response.headers.get('Content-Length');
      console.log(`Content-Type: ${contentType}`);
      console.log(`Content-Length: ${contentLength || 'unknown'}`);
      console.log('Image loaded successfully');
    } else {
      console.log(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed to test image ${imagePath}:`, error.message);
  }
  
  console.log('---');
}

// Test OPTIONS preflight request
async function testPreflightRequest(endpoint) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Testing preflight for: ${url}`);
    
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://thontrangliennhat.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-Requested-With'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log('CORS Headers:');
    console.log(`  Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`  Access-Control-Allow-Methods: ${response.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`  Access-Control-Allow-Headers: ${response.headers.get('Access-Control-Allow-Headers')}`);
    
    if (response.status === 200 || response.status === 204) {
      console.log('Preflight request successful');
    } else {
      console.log(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed preflight test for ${endpoint}:`, error.message);
  }
  
  console.log('---');
}

// Run all tests
async function runTests() {
  console.log('Starting API and CORS tests...\n');
  
  // Test API endpoints
  await testApiEndpoint('/api/products');
  await testApiEndpoint('/api/services');
  await testApiEndpoint('/api/teams');
  await testApiEndpoint('/api/parent-navs/all-with-child');
  
  // Test preflight requests
  await testPreflightRequest('/api/products');
  await testPreflightRequest('/api/services');
  
  // Test image endpoints
  await testImageEndpoint('/images/placeholder.jpg');
  await testImageEndpoint('/uploads/default.jpg');
  await testImageEndpoint('/images/nonexistent-image.jpg'); // Should return placeholder
  
  console.log('All tests completed');
}

// Run the tests
runTests(); 