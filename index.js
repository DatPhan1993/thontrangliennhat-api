// Import Express and create a basic Express app
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// Import our custom CORS middleware
const { corsMiddleware, xhrCorsHandler, specificPathCorsHandler, corsErrorRecovery } = require('./cors-middleware');

// Import our image proxy router
const imageRouter = require('./image-proxy');

// Import our direct image workaround router
const imageWorkaroundRouter = require('./image-workaround');

// Apply primary CORS middleware
app.use(corsMiddleware);

// Apply XHR-specific CORS handling
app.use(xhrCorsHandler);

// Apply specific path CORS handling
app.use(specificPathCorsHandler);

// Keep standard CORS middleware as a fallback
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: 'X-Requested-With, Content-Type, Accept, Authorization',
  credentials: true
}));

// Import our custom error handling middleware
const { errorHandler, notFoundHandler, corsErrorHandler } = require('./error-middleware');

// Import API routes
const apiRoutes = require('./api/index.js');

// Apply direct image workarounds for specific problematic images
app.use(imageWorkaroundRouter);

// Mount API routes
app.use('/api', apiRoutes);

// Mount image routes using our image proxy
app.use('/images', imageRouter);
app.use('/uploads', imageRouter);

// Add a diagnostics endpoint to troubleshoot image issues
app.get('/diagnostics/images', (req, res) => {
  console.log('Running image diagnostics...');
  
  // Check image directories
  const imageDirs = [
    { path: path.join(__dirname, 'images'), name: 'images/' },
    { path: path.join(__dirname, 'uploads'), name: 'uploads/' },
    { path: path.join(__dirname, 'public', 'images'), name: 'public/images/' },
    { path: path.join(__dirname, 'public', 'uploads'), name: 'public/uploads/' },
    { path: path.join(__dirname, 'images', 'uploads'), name: 'images/uploads/' },
    { path: path.join(__dirname, 'public', 'images', 'uploads'), name: 'public/images/uploads/' },
    { path: path.join('/tmp', 'uploads'), name: '/tmp/uploads/' }
  ];
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    directories: [],
    fileCount: 0,
    specificImages: {}
  };
  
  // Check each directory
  imageDirs.forEach(dir => {
    const exists = fs.existsSync(dir.path);
    const files = exists ? fs.readdirSync(dir.path).filter(f => 
      f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.gif')
    ) : [];
    
    diagnostics.directories.push({
      path: dir.name,
      exists,
      fileCount: files.length,
      files: files.slice(0, 10) // Just show first 10 to avoid overwhelming
    });
    
    diagnostics.fileCount += files.length;
  });
  
  // Check for specific problematic images
  [
    '174747165113-639500359.jpg',
    '174747145118-118603841.jpg',
    '174747127664-970349078.jpg'
  ].forEach(imageName => {
    diagnostics.specificImages[imageName] = {};
    
    imageDirs.forEach(dir => {
      const imagePath = path.join(dir.path, imageName);
      diagnostics.specificImages[imageName][dir.name] = fs.existsSync(imagePath);
    });
  });
  
  res.json(diagnostics);
});

// Serve static files from the public directory
app.use(express.static('public'));

// Define a simple health check route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API server is running',
    endpoints: [
      '/api/products',
      '/api/services',
      '/api/teams',
      '/api/parent-navs',
      '/api/images',
      '/diagnostics/images'
    ],
    time: new Date().toISOString()
  });
});

// Error handling for 404s (must be before the error handlers)
app.use(notFoundHandler);

// Apply CORS error handling
app.use(corsErrorHandler);

// Apply CORS error recovery
app.use(corsErrorRecovery);

// Apply global error handling
app.use(errorHandler);

// Start server if running directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel
module.exports = app; 