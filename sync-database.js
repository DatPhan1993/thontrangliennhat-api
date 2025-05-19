/**
 * Database Synchronization Utility
 * 
 * This script synchronizes all database.json files across the application
 * to ensure data consistency.
 */
const fs = require('fs');
const path = require('path');

// Define paths to the database.json files
const API_DB_PATH = path.join(__dirname, 'database.json');
const ROOT_DB_PATH = path.join(__dirname, '..', 'database.json');
const PUBLIC_DB_PATH = path.join(__dirname, 'public', 'database.json');

// Define paths to the image directories
const API_IMAGES_DIR = path.join(__dirname, 'images');
const API_UPLOADS_DIR = path.join(__dirname, 'images', 'uploads');
const API_PRODUCTS_DIR = path.join(__dirname, 'images', 'products');

const ROOT_IMAGES_DIR = path.join(__dirname, '..', 'images');
const ROOT_UPLOADS_DIR = path.join(__dirname, '..', 'images', 'uploads');

const PUBLIC_IMAGES_DIR = path.join(__dirname, 'public', 'images');
const PUBLIC_UPLOADS_DIR = path.join(__dirname, 'public', 'images', 'uploads');
const PUBLIC_PRODUCTS_DIR = path.join(__dirname, 'public', 'images', 'products');

// Function to create a directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

// Function to copy a file
function copyFile(sourcePath, destinationPath) {
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destinationPath);
      console.log(`Copied: ${sourcePath} to ${destinationPath}`);
      return true;
    } else {
      console.log(`Source file does not exist: ${sourcePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error copying ${sourcePath} to ${destinationPath}:`, error);
    return false;
  }
}

// Function to sync database files
function syncDatabaseFiles() {
  console.log('Syncing database files...');
  
  // Check which database file is the newest
  let newestDbPath = API_DB_PATH;
  let newestTime = 0;
  
  const checkAndUpdateNewest = (dbPath) => {
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      if (stats.mtimeMs > newestTime) {
        newestTime = stats.mtimeMs;
        newestDbPath = dbPath;
      }
    }
  };
  
  checkAndUpdateNewest(API_DB_PATH);
  checkAndUpdateNewest(ROOT_DB_PATH);
  checkAndUpdateNewest(PUBLIC_DB_PATH);
  
  // If the newest file exists, copy it to the other locations
  if (fs.existsSync(newestDbPath)) {
    const sourceData = fs.readFileSync(newestDbPath);
    
    // Copy to API dir if not already the source
    if (newestDbPath !== API_DB_PATH) {
      fs.writeFileSync(API_DB_PATH, sourceData);
      console.log(`Copied newest database from ${newestDbPath} to ${API_DB_PATH}`);
    }
    
    // Copy to root dir if not already the source
    if (newestDbPath !== ROOT_DB_PATH) {
      fs.writeFileSync(ROOT_DB_PATH, sourceData);
      console.log(`Copied newest database from ${newestDbPath} to ${ROOT_DB_PATH}`);
    }
    
    // Copy to public dir if not already the source
    if (newestDbPath !== PUBLIC_DB_PATH) {
      // Ensure the public directory exists
      ensureDirectoryExists(path.dirname(PUBLIC_DB_PATH));
      fs.writeFileSync(PUBLIC_DB_PATH, sourceData);
      console.log(`Copied newest database from ${newestDbPath} to ${PUBLIC_DB_PATH}`);
    }
    
    return true;
  } else {
    console.error('No database file found to sync');
    return false;
  }
}

// Function to sync image directories
function syncImageDirectories() {
  console.log('Ensuring image directories exist...');
  
  // Ensure all image directories exist
  ensureDirectoryExists(API_IMAGES_DIR);
  ensureDirectoryExists(API_UPLOADS_DIR);
  ensureDirectoryExists(API_PRODUCTS_DIR);
  
  ensureDirectoryExists(ROOT_IMAGES_DIR);
  ensureDirectoryExists(ROOT_UPLOADS_DIR);
  
  ensureDirectoryExists(PUBLIC_IMAGES_DIR);
  ensureDirectoryExists(PUBLIC_UPLOADS_DIR);
  ensureDirectoryExists(PUBLIC_PRODUCTS_DIR);
  
  console.log('All image directories created or confirmed');
  
  // Now copy any existing images from API uploads to public uploads
  console.log('Syncing images between directories...');
  
  if (fs.existsSync(API_UPLOADS_DIR)) {
    const files = fs.readdirSync(API_UPLOADS_DIR);
    files.forEach(file => {
      const sourcePath = path.join(API_UPLOADS_DIR, file);
      const publicDestPath = path.join(PUBLIC_UPLOADS_DIR, file);
      const rootDestPath = path.join(ROOT_UPLOADS_DIR, file);
      
      if (fs.statSync(sourcePath).isFile()) {
        copyFile(sourcePath, publicDestPath);
        copyFile(sourcePath, rootDestPath);
      }
    });
  }
  
  // Also copy any existing images from root uploads to api and public uploads
  if (fs.existsSync(ROOT_UPLOADS_DIR)) {
    const files = fs.readdirSync(ROOT_UPLOADS_DIR);
    files.forEach(file => {
      const sourcePath = path.join(ROOT_UPLOADS_DIR, file);
      const apiDestPath = path.join(API_UPLOADS_DIR, file);
      const publicDestPath = path.join(PUBLIC_UPLOADS_DIR, file);
      
      if (fs.statSync(sourcePath).isFile()) {
        copyFile(sourcePath, apiDestPath);
        copyFile(sourcePath, publicDestPath);
      }
    });
  }
  
  console.log('Image synchronization complete');
}

// Main sync function
function syncAll() {
  try {
    // Sync database files
    const dbSynced = syncDatabaseFiles();
    if (dbSynced) {
      console.log('Database sync completed successfully');
    } else {
      console.warn('Database sync encountered issues');
    }
    
    // Sync image directories
    syncImageDirectories();
    
    console.log('All synchronization tasks completed');
    
    return true;
  } catch (error) {
    console.error('Error during sync operation:', error);
    return false;
  }
}

// Execute the sync
if (require.main === module) {
  syncAll();
}

module.exports = {
  syncDatabaseFiles,
  syncImageDirectories,
  syncAll
}; 