/**
 * CORS Middleware - Special handling for cross-origin requests
 * 
 * This file provides comprehensive CORS handling for API requests,
 * particularly focusing on XHR requests and preflight responses
 */

// Main CORS middleware for all requests
const corsMiddleware = (req, res, next) => {
  // Always set these headers for every request
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests (OPTIONS) immediately
  if (req.method === 'OPTIONS') {
    console.log(`Handling preflight request for: ${req.originalUrl}`);
    return res.status(200).end();
  }

  next();
};

// CORS handler for XHR requests (typically used by browsers)
const xhrCorsHandler = (req, res, next) => {
  // Check if this is an XHR request or has the XHR header
  if (
    req.xhr || 
    (req.headers && req.headers['x-requested-with'] === 'XMLHttpRequest') ||
    (req.path && req.path.includes('/api/'))
  ) {
    console.log(`XHR CORS handling for: ${req.originalUrl}`);
    
    // Set additional headers for XHR requests
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Expose-Headers', 'Content-Length, X-JSON');
    
    // For API paths, ensure complete CORS compliance
    if (req.path && req.path.includes('/api/')) {
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Headers', '*');
    }
  }
  
  next();
};

// Special CORS handler for problematic paths observed in logs
const specificPathCorsHandler = (req, res, next) => {
  // List of paths that frequently encounter CORS issues
  const problematicPaths = [
    '/api/products',
    '/api/services',
    '/api/parent-navs',
    '/api/teams',
    '/api/news',
    '/api/videos',
    '/api/images',
    '/api/parent-navs/all-with-child',
    '/api/parent-navs/slug/'
  ];
  
  // Check if current path matches any problematic path
  const isProblematicPath = problematicPaths.some(path => 
    req.originalUrl.includes(path)
  );
  
  if (isProblematicPath) {
    console.log(`Special CORS handling for problematic path: ${req.originalUrl}`);
    
    // Set very permissive CORS headers for these paths
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    // If this is a preflight request, respond immediately
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
};

// Middleware to handle failed CORS requests that reach error handlers
const corsErrorRecovery = (err, req, res, next) => {
  // Check if error message suggests a CORS issue
  if (
    err && 
    (err.message && (
      err.message.includes('CORS') || 
      err.message.includes('cross-origin') || 
      err.message.includes('Access-Control')
    ))
  ) {
    console.log(`Recovering from CORS error: ${req.originalUrl}`);
    
    // Set recovery CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    
    // If this is a preflight request, we can just approve it
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  // Pass to next error handler if we can't recover
  next(err);
};

module.exports = {
  corsMiddleware,
  xhrCorsHandler,
  specificPathCorsHandler,
  corsErrorRecovery
}; 