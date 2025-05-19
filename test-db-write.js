const fs = require('fs');
const path = require('path');

// Database file paths - test both root and api folders
const apiDbPath = path.resolve(__dirname, 'database.json');
const rootDbPath = path.resolve(__dirname, '..', 'database.json');
const backupPaths = {
  api: path.resolve(__dirname, 'database.json.backup'),
  root: path.resolve(__dirname, '..', 'database.json.backup')
};

console.log('Testing database write functionality');
console.log('API database path:', apiDbPath);
console.log('Root database path:', rootDbPath);

// Create unique test product for this run
const timestamp = new Date().getTime();
const testProductId = 9999;
const testProduct = {
  id: testProductId,
  name: `Test Product ${timestamp}`,
  slug: `test-product-${timestamp}`,
  summary: 'Summary of test product',
  description: 'Description of test product',
  content: 'Content of test product',
  images: ['/uploads/test.jpg'],
  categoryId: 1,
  child_nav_id: 1,
  features: '[]',
  phone_number: '0123456789',
  isFeatured: true,
  views: 0,
  type: 'san-pham',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

try {
  // First, create backups
  console.log('Creating backups...');
  
  if (fs.existsSync(apiDbPath)) {
    fs.copyFileSync(apiDbPath, backupPaths.api);
    console.log('API database backup created at:', backupPaths.api);
  } else {
    console.log('API database file does not exist, no backup needed');
  }
  
  if (fs.existsSync(rootDbPath)) {
    fs.copyFileSync(rootDbPath, backupPaths.root);
    console.log('Root database backup created at:', backupPaths.root);
  } else {
    console.log('Root database file does not exist, no backup needed');
  }
  
  // Test API database first
  console.log('\n--- Testing API database.json ---');
  if (!fs.existsSync(apiDbPath)) {
    console.log('API database does not exist. Creating it with a minimal structure.');
    const emptyDb = { products: [] };
    fs.writeFileSync(apiDbPath, JSON.stringify(emptyDb, null, 2), 'utf8');
  }
  
  console.log('Reading API database...');
  let apiDb = JSON.parse(fs.readFileSync(apiDbPath, 'utf8'));
  
  // Ensure products array exists
  if (!apiDb.products) {
    apiDb.products = [];
  }
  
  console.log(`API database read successfully. Contains ${apiDb.products.length} products.`);
  
  // Add our test product
  apiDb.products.push(testProduct);
  
  // Write back to API database
  console.log('Writing test product to API database...');
  fs.writeFileSync(apiDbPath, JSON.stringify(apiDb, null, 2), 'utf8');
  
  // Verify API database write
  console.log('Verifying API database write...');
  const verifyApiDb = JSON.parse(fs.readFileSync(apiDbPath, 'utf8'));
  const foundInApiDb = verifyApiDb.products.find(p => p.id === testProductId);
  
  if (foundInApiDb) {
    console.log(`API database verification successful. Test product "${foundInApiDb.name}" found.`);
  } else {
    console.error('API database verification failed! Test product not found after write.');
  }
  
  // Now test the root database
  console.log('\n--- Testing root database.json ---');
  if (!fs.existsSync(rootDbPath)) {
    console.log('Root database does not exist. Creating it with a minimal structure.');
    const emptyDb = { products: [] };
    fs.writeFileSync(rootDbPath, JSON.stringify(emptyDb, null, 2), 'utf8');
  }
  
  console.log('Reading root database...');
  let rootDb = JSON.parse(fs.readFileSync(rootDbPath, 'utf8'));
  
  // Ensure products array exists
  if (!rootDb.products) {
    rootDb.products = [];
  }
  
  console.log(`Root database read successfully. Contains ${rootDb.products.length} products.`);
  
  // Add our test product
  rootDb.products.push(testProduct);
  
  // Write back to root database
  console.log('Writing test product to root database...');
  fs.writeFileSync(rootDbPath, JSON.stringify(rootDb, null, 2), 'utf8');
  
  // Verify root database write
  console.log('Verifying root database write...');
  const verifyRootDb = JSON.parse(fs.readFileSync(rootDbPath, 'utf8'));
  const foundInRootDb = verifyRootDb.products.find(p => p.id === testProductId);
  
  if (foundInRootDb) {
    console.log(`Root database verification successful. Test product "${foundInRootDb.name}" found.`);
  } else {
    console.error('Root database verification failed! Test product not found after write.');
  }
  
  // Final result
  const apiSuccess = !!foundInApiDb;
  const rootSuccess = !!foundInRootDb;
  
  console.log('\n--- Final Results ---');
  console.log(`API database write: ${apiSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Root database write: ${rootSuccess ? 'SUCCESS' : 'FAILED'}`);
  
  if (apiSuccess && rootSuccess) {
    console.log('✅ All database write tests PASSED');
  } else {
    console.log('❌ Some database write tests FAILED');
  }
  
  // Restore backups
  console.log('\nRestoring backups...');
  
  if (fs.existsSync(backupPaths.api)) {
    fs.copyFileSync(backupPaths.api, apiDbPath);
    console.log('API database backup restored');
  }
  
  if (fs.existsSync(backupPaths.root)) {
    fs.copyFileSync(backupPaths.root, rootDbPath);
    console.log('Root database backup restored');
  }
  
  console.log('Database write tests completed.');
} catch (error) {
  console.error('Error during database write test:', error);
} 