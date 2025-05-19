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

// Define a simple health check route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running in root handler',
    time: new Date().toISOString()
  });
});

// Redirect to the API handler
app.all('/api/*', (req, res) => {
  // Forward to /api
  res.redirect(307, req.url);
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