/**
 * Test script for database utilities
 */
const fs = require('fs');
const path = require('path');
const dbUtils = require('./database-utils');

// Display header
console.log('========================================');
console.log('Database Utilities Test');
console.log('========================================');

// Test 1: Verify all database paths
console.log('\nTest 1: Checking database paths...');
dbUtils.databasePaths.forEach((dbPath, index) => {
  const exists = fs.existsSync(dbPath);
  console.log(`${index + 1}. ${dbPath} - ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Test 2: Get newest database
console.log('\nTest 2: Finding newest database...');
const newestDb = dbUtils.getNewestDatabase();
if (newestDb) {
  console.log(`Found newest database with ${newestDb.products ? newestDb.products.length : 0} products`);
  console.log(`Last sync timestamp: ${newestDb._lastSync || 'Not set'}`);
} else {
  console.error('Failed to find newest database!');
}

// Test 3: Create test product
console.log('\nTest 3: Adding test product...');
const timestamp = new Date().getTime();
const testProduct = {
  name: `Test Product ${timestamp}`,
  slug: `test-product-${timestamp}`,
  summary: 'This is a test product',
  description: 'This is a test product description',
  content: 'Test product content',
  images: ['/uploads/test.jpg'],
  categoryId: 1,
  isFeatured: true,
  type: 'san-pham',
  features: '[]',
  phone_number: '0123456789'
};

const addResult = dbUtils.addProduct(testProduct);
if (addResult.success) {
  console.log(`Test product created with ID: ${addResult.product.id}`);
  
  // Test 4: Verify product exists in database
  console.log('\nTest 4: Verifying product in database...');
  const verifyResult = dbUtils.verifyProduct(addResult.product.id);
  if (verifyResult) {
    console.log('Test product verified in database successfully');
  } else {
    console.error('Failed to verify test product!');
  }
  
  // Test 5: Update product
  console.log('\nTest 5: Updating test product...');
  const updateResult = dbUtils.updateProduct(addResult.product.id, {
    name: `Updated Test Product ${timestamp}`,
    summary: 'Updated test product summary'
  });
  
  if (updateResult.success) {
    console.log('Test product updated successfully');
    console.log(`New name: ${updateResult.product.name}`);
    console.log(`New summary: ${updateResult.product.summary}`);
  } else {
    console.error('Failed to update test product:', updateResult.message);
  }
  
  // Clean up - remove the test product
  console.log('\nCleaning up: Removing test product...');
  const db = dbUtils.getNewestDatabase();
  if (db && db.products) {
    const productIndex = db.products.findIndex(p => parseInt(p.id) === parseInt(addResult.product.id));
    if (productIndex !== -1) {
      db.products.splice(productIndex, 1);
      dbUtils.syncDatabase(db);
      console.log('Test product removed');
    }
  }
} else {
  console.error('Failed to create test product:', addResult.message);
}

// Test 6: Force sync all database files
console.log('\nTest 6: Syncing all database files...');
const syncResult = dbUtils.syncFromNewest();
if (syncResult) {
  console.log('All database files synced successfully');
} else {
  console.error('Failed to sync database files!');
}

// Final report
console.log('\n========================================');
console.log('Database Utilities Test Summary');
console.log('========================================');
console.log('All tests completed. Check the logs above for any errors.'); 