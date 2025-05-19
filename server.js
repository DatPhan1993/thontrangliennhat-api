// Import essential modules first
const jsonServer = require('json-server');
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');

// Import our database utilities
const dbUtils = require('./database-utils');

// Define all database paths at the top for consistency
const API_DB_PATH = path.join(__dirname, 'database.json');
const ROOT_DB_PATH = path.join(__dirname, '..', 'database.json');
const PUBLIC_DB_PATH = path.join(__dirname, '..', 'public', 'phunongbuondon-api', 'database.json');

// Define paths to use in the application
const DATABASE_PATH = API_DB_PATH;
let DATABASE = null;

// Middleware to ensure database is loaded
const ensureDatabaseLoaded = () => {
  if (!DATABASE) {
    try {
      DATABASE = dbUtils.getNewestDatabase();
      console.log('Database loaded from newest source');
    } catch (error) {
      console.error('Error loading database:', error);
      
      // Fallback to load from API path
      try {
        if (fs.existsSync(DATABASE_PATH)) {
          const data = fs.readFileSync(DATABASE_PATH, 'utf8');
          DATABASE = JSON.parse(data);
          console.log('Database loaded from API path');
        } else {
          console.error('No database file found at API path:', DATABASE_PATH);
          DATABASE = { products: [] };
        }
      } catch (fallbackError) {
        console.error('Error in database fallback loading:', fallbackError);
        DATABASE = { products: [] };
      }
    }
  }
  return DATABASE;
};

// Load database on startup
ensureDatabaseLoaded();

// Hàm để ghi database
const writeDatabase = (data) => {
  try {
    // Use our new database utilities to write to all locations
    const result = dbUtils.syncDatabase(data);
    
    // Update in-memory database
    DATABASE = data;
    
    return result;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
};

// Use json-server for REST API
const server = jsonServer.create();
const router = jsonServer.router(DATABASE_PATH);
const middlewares = jsonServer.defaults();

// Định nghĩa nơi lưu trữ cho upload files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Sử dụng middlewares
server.use(middlewares);
server.use(express.json());

// Routes

// Get all products
server.get('/api/products', (req, res) => {
  ensureDatabaseLoaded();
  
  // Verify DATABASE.products exists and is an array
  if (!DATABASE.products || !Array.isArray(DATABASE.products)) {
    DATABASE.products = [];
  }
  
  // Sort by createdAt, newest first
  const products = [...DATABASE.products].sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  
  return res.status(200).jsonp({
    statusCode: 200,
    data: products
  });
});

// Get product by ID
server.get('/api/products/:id', (req, res) => {
  ensureDatabaseLoaded();
  
  const id = parseInt(req.params.id);
  
  // Verify DATABASE.products exists and is an array
  if (!DATABASE.products || !Array.isArray(DATABASE.products)) {
    DATABASE.products = [];
  }
  
  const product = DATABASE.products.find(p => parseInt(p.id) === id);
  
  if (!product) {
    return res.status(404).jsonp({
      statusCode: 404,
      message: 'Product not found'
    });
  }
  
  return res.status(200).jsonp({
    statusCode: 200,
    data: product
  });
});

// Create a product
server.post('/api/products', upload.array('images[]', 5), (req, res) => {
  try {
    ensureDatabaseLoaded();
    
    // Extract uploaded image paths
    const uploadedImages = (req.files || []).map(file => {
      return `/uploads/${file.filename}`;
    });
    
    // Extract product data from request body
    const {
      name,
      slug: requestSlug,
      summary,
      description,
      price,
      discountPrice,
      categoryId,
      isFeatured,
      type,
      content,
      features,
      phone_number
    } = req.body;
    
    // Generate slug from name if not provided
    const slug = requestSlug || slugify(name, { lower: true });
    
    // Create product object
    const newProduct = {
      name,
      slug,
      summary,
      description,
      price: price ? parseInt(price) : null,
      discountPrice: discountPrice ? parseInt(discountPrice) : null,
      images: uploadedImages.length > 0 ? uploadedImages : [],
      categoryId: categoryId ? parseInt(categoryId) : null,
      isFeatured: isFeatured === 'true',
      views: 0,
      type: type || 'san-pham',
      content,
      features: features || '[]',
      phone_number
    };
    
    // Add the product using our utility
    const result = dbUtils.addProduct(newProduct);
    
    if (result.success) {
      // Update router database
      router.db.setState(DATABASE);
      
      return res.status(201).jsonp({
        statusCode: 201,
        message: 'Product created successfully',
        data: result.product
      });
    } else {
      return res.status(500).jsonp({
        statusCode: 500,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).jsonp({
      statusCode: 500,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update a product
server.post('/api/products/:id', upload.array('images[]', 5), (req, res) => {
  try {
    ensureDatabaseLoaded();
    
    const id = parseInt(req.params.id);
    
    // Extract uploaded image paths
    const uploadedImages = (req.files || []).map(file => {
      return `/uploads/${file.filename}`;
    });
    
    // Find the product first
    const productIndex = DATABASE.products.findIndex(p => parseInt(p.id) === id);
    
    if (productIndex === -1) {
      return res.status(404).jsonp({
        statusCode: 404,
        message: 'Product not found'
      });
    }
    
    // Get existing product
    const existingProduct = DATABASE.products[productIndex];
    
    // Extract product data from request body
    const {
      name,
      slug: requestSlug,
      summary,
      description,
      price,
      discountPrice,
      categoryId,
      isFeatured,
      type,
      content,
      features,
      phone_number
    } = req.body;
    
    // Generate slug from name if not provided
    const slug = requestSlug || (name ? slugify(name, { lower: true }) : existingProduct.slug);
    
    // Prepare images array - if new images are uploaded, replace the old ones
    let images = existingProduct.images || [];
    
    // If new images are uploaded, use them
    if (uploadedImages.length > 0) {
      // Handle existing images format (could be string or array)
      if (typeof images === 'string') {
        // If the existing images is a string, convert to array before replacing
        images = [images];
      }
      
      // In this case we replace with new images
      if (req.body.replaceImages === 'true') {
        images = uploadedImages;
      } else {
        // Append new images to existing ones
        images = Array.isArray(images) ? [...images, ...uploadedImages] : uploadedImages;
      }
    } else if (req.body.images) {
      // If images are sent as JSON string, parse them
      try {
        const parsedImages = JSON.parse(req.body.images);
        images = Array.isArray(parsedImages) ? parsedImages : [parsedImages];
      } catch (e) {
        // If parsing fails, assume it's a single image string
        images = [req.body.images];
      }
    }
    
    // Create updated product object
    const updatedProduct = {
      ...existingProduct,
      name: name || existingProduct.name,
      slug,
      summary: summary || existingProduct.summary,
      description: description || existingProduct.description,
      price: price ? parseInt(price) : existingProduct.price,
      discountPrice: discountPrice ? parseInt(discountPrice) : existingProduct.discountPrice,
      images,
      categoryId: categoryId ? parseInt(categoryId) : existingProduct.categoryId,
      isFeatured: isFeatured === 'true' || (isFeatured !== 'false' && existingProduct.isFeatured),
      type: type || existingProduct.type,
      content: content || existingProduct.content,
      features: features || existingProduct.features || '[]',
      phone_number: phone_number || existingProduct.phone_number,
      updatedAt: new Date().toISOString()
    };
    
    // Update the product using our utility
    const result = dbUtils.updateProduct(id, updatedProduct);
    
    if (result.success) {
      // Update in-memory and router database
      DATABASE = dbUtils.getNewestDatabase();
      router.db.setState(DATABASE);
      
      return res.status(200).jsonp({
        statusCode: 200,
        message: 'Product updated successfully',
        data: result.product
      });
    } else {
      return res.status(500).jsonp({
        statusCode: 500,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).jsonp({
      statusCode: 500,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete a product
server.delete('/api/products/:id', (req, res) => {
  try {
    ensureDatabaseLoaded();
    
    const id = parseInt(req.params.id);
    
    // Find the product
    const productIndex = DATABASE.products.findIndex(p => parseInt(p.id) === id);
    
    if (productIndex === -1) {
      return res.status(404).jsonp({
        statusCode: 404,
        message: 'Product not found'
      });
    }
    
    // Remove the product
    DATABASE.products.splice(productIndex, 1);
    
    // Save the database
    if (writeDatabase(DATABASE)) {
      return res.status(200).jsonp({
        statusCode: 200,
        message: 'Product deleted successfully'
      });
    } else {
      return res.status(500).jsonp({
        statusCode: 500,
        message: 'Error writing to database'
      });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).jsonp({
      statusCode: 500,
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin API endpoint to update the database
server.post('/api/admin/update-database', (req, res) => {
  try {
    console.log('Admin database update request received');
    
    if (!req.body || !req.body.database) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Missing database in request body'
      });
    }
    
    // Validate the database structure
    const newDb = req.body.database;
    if (!newDb || typeof newDb !== 'object') {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid database format'
      });
    }
    
    // Standardize experiences.images format
    if (newDb.experiences && Array.isArray(newDb.experiences)) {
      newDb.experiences = newDb.experiences.map(experience => {
        if (experience.images) {
          if (typeof experience.images === 'string') {
            experience.images = [experience.images];
          }
        } else {
          experience.images = [];
        }
        return experience;
      });
    }
    
    // Use our database utility to synchronize all database files
    const syncResult = dbUtils.syncDatabase(newDb);
    
    if (!syncResult) {
      throw new Error('Failed to synchronize database files');
    }
    
    // Update in-memory database
    DATABASE = newDb;
    
    // Update router database
    router.db.setState(newDb);
    
    // Success response
    res.json({
      statusCode: 200,
      message: 'Database updated successfully'
    });
  } catch (error) {
    console.error('Error updating database:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating database: ' + error.message
    });
  }
});

// Admin API endpoint to sync database files
server.post('/api/admin/sync-database', (req, res) => {
  try {
    console.log('Database sync request received');
    
    // Use our utility to sync from the newest database file
    const syncResult = dbUtils.syncFromNewest();
    
    if (!syncResult) {
      throw new Error('Database synchronization failed');
    }
    
    // Update in-memory database
    DATABASE = dbUtils.getNewestDatabase();
    
    // Update router database state
    router.db.setState(DATABASE);
    
    res.json({
      statusCode: 200,
      message: 'Database files synchronized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing database files:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error syncing database files: ' + error.message
    });
  }
});

// Admin API endpoint to run the sync-database.js script
server.post('/api/admin/run-sync-script', (req, res) => {
  try {
    console.log('Received request to run database sync');
    
    // Use our utility directly instead of executing script
    const result = dbUtils.syncFromNewest();
    
    if (result) {
      // Update in-memory database
      DATABASE = dbUtils.getNewestDatabase();
      
      // Update router database state
      router.db.setState(DATABASE);
      
      return res.json({
        statusCode: 200,
        message: 'Database sync executed successfully'
      });
    } else {
      return res.status(500).json({
        statusCode: 500,
        message: 'Database sync failed'
      });
    }
  } catch (error) {
    console.error('Error processing sync request:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error processing sync request: ' + error.message
    });
  }
});

// Also add a simplified endpoint at the root level for frontend access
server.post('/run-sync-script', (req, res) => {
  try {
    console.log('Received request to run database sync from frontend');
    
    // Use our utility directly instead of executing script
    const result = dbUtils.syncFromNewest();
    
    if (result) {
      // Update in-memory database
      DATABASE = dbUtils.getNewestDatabase();
      
      // Update router database state
      router.db.setState(DATABASE);
      
      return res.json({
        success: true,
        message: 'Database sync completed successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Database sync failed'
      });
    }
  } catch (error) {
    console.error('Error processing frontend sync request:', error);
    res.status(500).json({
      success: false,
      message: 'Error running database sync'
    });
  }
});

// Endpoint for saving database.json directly
server.post('/save-database', (req, res) => {
  try {
    console.log('Direct database save request received');
    
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Missing database in request body'
      });
    }
    
    // Use our database utility to sync
    const syncResult = dbUtils.syncDatabase(req.body);
    
    if (!syncResult) {
      throw new Error('Failed to save database');
    }
    
    // Update in-memory database
    DATABASE = req.body;
    
    // Update router database
    router.db.setState(req.body);
    
    // Success response
    res.json({
      success: true,
      message: 'Database saved successfully'
    });
  } catch (error) {
    console.error('Error saving database:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving database: ' + error.message
    });
  }
});

// Other routes

// Use the router for any routes not explicitly defined
server.use(router);

// Handle image URLs that are failing
if (req.url.includes('/images/uploads/')) {
    const imageName = path.basename(req.url);
    
    // Set CORS headers for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Special handling for known problematic images
    if (imageName === '1747193559802-784322977.jpg' || imageName === '1747213249793-521951070.jpg') {
        console.log(`Special handling for known problematic image: ${imageName}`);
        
        // Try to serve from various locations
        const possiblePaths = [
            path.join(__dirname, 'uploads', imageName),
            path.join(__dirname, 'public', 'images', 'uploads', imageName),
            path.join(__dirname, 'images', 'uploads', imageName),
            path.join(__dirname, 'phunongbuondon-api', 'images', 'uploads', imageName),
            path.join(__dirname, 'phunongbuondon-api', 'uploads', imageName),
            path.join(__dirname, 'phunongbuondon-api', 'public', 'images', 'uploads', imageName)
        ];
        
        for (const filePath of possiblePaths) {
            console.log(`Checking path: ${filePath}`);
            if (serveStaticFile(req, res, filePath)) {
                console.log(`Successfully served problematic image from: ${filePath}`);
                return;
            }
        }
        
        // If image still not found, try to copy it from other locations
        try {
            const sourceLocations = [
                path.join(__dirname, 'uploads'),
                path.join(__dirname, 'phunongbuondon-api', 'uploads'),
                path.join(__dirname, 'phunongbuondon-api', 'images', 'uploads')
            ];
            
            const destinationDir = path.join(__dirname, 'public', 'images', 'uploads');
            
            // Ensure destination directory exists
            if (!fs.existsSync(destinationDir)) {
                fs.mkdirSync(destinationDir, { recursive: true });
                console.log(`Created directory: ${destinationDir}`);
            }
            
            for (const sourceDir of sourceLocations) {
                const sourcePath = path.join(sourceDir, imageName);
                if (fs.existsSync(sourcePath)) {
                    const destPath = path.join(destinationDir, imageName);
                    fs.copyFileSync(sourcePath, destPath);
                    console.log(`Copied image from ${sourcePath} to ${destPath}`);
                    
                    // Try serving the newly copied file
                    if (serveStaticFile(req, res, destPath)) {
                        console.log(`Successfully served newly copied image from: ${destPath}`);
                        return;
                    }
                }
            }
        } catch (error) {
            console.error(`Error copying problematic image: ${error}`);
        }
    }
    
    // Try to serve from various locations
    const possiblePaths = [
        path.join(__dirname, 'uploads', imageName),
        path.join(__dirname, 'public', 'images', 'uploads', imageName),
        path.join(__dirname, 'images', 'uploads', imageName),
        path.join(__dirname, 'phunongbuondon-api', 'images', 'uploads', imageName)
    ];
    
    for (const filePath of possiblePaths) {
        if (serveStaticFile(req, res, filePath)) {
            return;
        }
    }
}

// Export the Express app
module.exports = server; 