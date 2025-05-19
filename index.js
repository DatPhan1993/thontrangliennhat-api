// Import Express and create a basic Express app
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: '*'
}));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Import API routes
const apiRoutes = require('./api/index.js');

// Mount API routes
app.use('/api', apiRoutes);

// Define a simple health check route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API server is running',
    endpoints: [
      '/api/products',
      '/api/services',
      '/api/teams',
      '/api/parent-navs'
    ],
    time: new Date().toISOString()
  });
});

// Handle 404s
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.url}`);
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.url
  });
});

// Start server if running directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel
module.exports = app; 