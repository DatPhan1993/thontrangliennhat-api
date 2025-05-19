/**
 * Database utilities for consistent database operations across the application
 */
const fs = require('fs');
const path = require('path');

// Define all possible database paths to synchronize
const databasePaths = [
  // Main API path
  path.resolve(__dirname, 'database.json'),
  // Root path
  path.resolve(__dirname, '..', 'database.json'),
  // Public path
  path.resolve(__dirname, '..', 'public', 'phunongbuondon-api', 'database.json'),
  // API upload path
  path.resolve(__dirname, '..', 'api-upload', 'database.json')
];

/**
 * Gets the newest database file among all known locations
 * @returns {Object} Database object from the newest file
 */
function getNewestDatabase() {
  console.log('Finding the newest database file...');
  let newestPath = null;
  let newestTime = 0;
  
  for (const dbPath of databasePaths) {
    try {
      if (fs.existsSync(dbPath)) {
        // Get file stats
        const stats = fs.statSync(dbPath);
        
        // Try to read the file and check lastSync
        try {
          const data = fs.readFileSync(dbPath, 'utf8');
          const db = JSON.parse(data);
          
          // Use lastSync if available, otherwise use file modification time
          let timestamp;
          if (db._lastSync) {
            timestamp = new Date(db._lastSync).getTime();
            console.log(`Database at ${dbPath} has lastSync: ${db._lastSync}`);
          } else if (db.syncInfo && db.syncInfo.lastSync) {
            timestamp = new Date(db.syncInfo.lastSync).getTime();
            console.log(`Database at ${dbPath} has syncInfo.lastSync: ${db.syncInfo.lastSync}`);
          } else {
            timestamp = stats.mtimeMs;
            console.log(`Database at ${dbPath} has no lastSync, using file mtime: ${new Date(timestamp).toISOString()}`);
          }
          
          if (timestamp > newestTime) {
            newestTime = timestamp;
            newestPath = dbPath;
          }
        } catch (parseError) {
          console.error(`Error parsing database at ${dbPath}: ${parseError.message}`);
        }
      }
    } catch (error) {
      console.error(`Error checking database at ${dbPath}: ${error.message}`);
    }
  }
  
  if (newestPath) {
    console.log(`Newest database file found at: ${newestPath}`);
    try {
      const dbContent = fs.readFileSync(newestPath, 'utf8');
      return JSON.parse(dbContent);
    } catch (error) {
      console.error(`Error reading newest database: ${error.message}`);
      return null;
    }
  } else {
    console.error('No valid database files found');
    return null;
  }
}

/**
 * Synchronizes the database to all known locations
 * @param {Object} database - The database object to synchronize
 * @returns {boolean} Whether synchronization was successful
 */
function syncDatabase(database) {
  try {
    console.log('Syncing database across all locations...');
    
    // Validate database structure
    if (!database || typeof database !== 'object') {
      console.error('Invalid database structure provided for sync');
      return false;
    }
    
    if (!database.products || !Array.isArray(database.products)) {
      console.warn('Database has no products array or it is not an array');
    } else {
      console.log(`Database contains ${database.products.length} products`);
    }
    
    // Update synchronization timestamps
    if (!database.syncInfo) {
      database.syncInfo = {};
    }
    
    const syncTimestamp = new Date().toISOString();
    database._lastSync = syncTimestamp;
    database.syncInfo.lastSync = syncTimestamp;
    
    // Format database for writing (consistent indentation)
    const formattedData = JSON.stringify(database, null, 2);
    
    // Write to all paths
    let successCount = 0;
    
    for (const dbPath of databasePaths) {
      try {
        // Create directory if it doesn't exist
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created directory: ${dir}`);
        }
        
        // Write database file
        fs.writeFileSync(dbPath, formattedData, 'utf8');
        
        // Verify the file was written
        const fileExists = fs.existsSync(dbPath);
        const fileStats = fileExists ? fs.statSync(dbPath) : null;
        console.log(`Synced database to: ${dbPath} (exists=${fileExists}, size=${fileStats ? fileStats.size : 0} bytes)`);
        
        if (fileExists) {
          successCount++;
        }
      } catch (pathError) {
        console.error(`Failed to sync database to ${dbPath}: ${pathError.message}`);
      }
    }
    
    console.log(`Database sync completed. Successfully synced to ${successCount}/${databasePaths.length} locations.`);
    return successCount > 0;
  } catch (error) {
    console.error(`Error in syncDatabase: ${error.message}`);
    return false;
  }
}

/**
 * Update a product in the database and sync to all locations
 * @param {number|string} productId - ID of the product to update
 * @param {Object} productData - New product data
 * @returns {Object} Result object with success status and message/product
 */
function updateProduct(productId, productData) {
  try {
    // Get the newest database
    const database = getNewestDatabase();
    if (!database) {
      return { success: false, message: 'Failed to read database' };
    }
    
    // Ensure products array exists
    if (!database.products || !Array.isArray(database.products)) {
      database.products = [];
    }
    
    // Find the product by ID
    const numericId = parseInt(productId, 10);
    const productIndex = database.products.findIndex(p => parseInt(p.id, 10) === numericId);
    
    if (productIndex === -1) {
      return { success: false, message: `Product with ID ${productId} not found` };
    }
    
    // Update the product
    database.products[productIndex] = {
      ...database.products[productIndex],
      ...productData,
      updatedAt: new Date().toISOString()
    };
    
    // Sync the database
    const syncResult = syncDatabase(database);
    
    if (!syncResult) {
      return { success: false, message: 'Failed to sync database after product update' };
    }
    
    return { 
      success: true, 
      message: 'Product updated successfully',
      product: database.products[productIndex]
    };
  } catch (error) {
    console.error(`Error updating product: ${error.message}`);
    return { success: false, message: `Error updating product: ${error.message}` };
  }
}

/**
 * Add a product to the database and sync to all locations
 * @param {Object} productData - Product data to add
 * @returns {Object} Result object with success status and message/product
 */
function addProduct(productData) {
  try {
    // Get the newest database
    const database = getNewestDatabase();
    if (!database) {
      return { success: false, message: 'Failed to read database' };
    }
    
    // Ensure products array exists
    if (!database.products || !Array.isArray(database.products)) {
      database.products = [];
    }
    
    // Generate a new product ID
    const maxId = database.products.length > 0 
      ? Math.max(...database.products.map(p => parseInt(p.id || 0, 10)))
      : 0;
    
    const newProductId = maxId + 1;
    
    // Create the new product
    const newProduct = {
      ...productData,
      id: newProductId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to products array
    database.products.push(newProduct);
    
    // Sync the database
    const syncResult = syncDatabase(database);
    
    if (!syncResult) {
      return { success: false, message: 'Failed to sync database after adding product' };
    }
    
    return { 
      success: true, 
      message: 'Product added successfully',
      product: newProduct
    };
  } catch (error) {
    console.error(`Error adding product: ${error.message}`);
    return { success: false, message: `Error adding product: ${error.message}` };
  }
}

/**
 * Verify a product is in the database
 * @param {number|string} productId - ID of the product to verify
 * @returns {boolean} Whether the product was found
 */
function verifyProduct(productId) {
  try {
    // Convert ID to number for comparison
    const numericId = parseInt(productId, 10);
    
    // Check all database files
    for (const dbPath of databasePaths) {
      try {
        if (fs.existsSync(dbPath)) {
          const data = fs.readFileSync(dbPath, 'utf8');
          const database = JSON.parse(data);
          
          if (database.products && Array.isArray(database.products)) {
            const product = database.products.find(p => parseInt(p.id, 10) === numericId);
            
            if (product) {
              console.log(`Product ${productId} found in ${dbPath}`);
              return true;
            }
          }
        }
      } catch (error) {
        console.error(`Error checking for product in ${dbPath}: ${error.message}`);
      }
    }
    
    console.warn(`Product ${productId} not found in any database file`);
    return false;
  } catch (error) {
    console.error(`Error verifying product: ${error.message}`);
    return false;
  }
}

/**
 * Sync from the newest database to all locations
 * @returns {boolean} Whether synchronization was successful
 */
function syncFromNewest() {
  const database = getNewestDatabase();
  if (!database) {
    return false;
  }
  
  return syncDatabase(database);
}

// Export utility functions
module.exports = {
  databasePaths,
  getNewestDatabase,
  syncDatabase,
  updateProduct,
  addProduct,
  verifyProduct,
  syncFromNewest
}; 