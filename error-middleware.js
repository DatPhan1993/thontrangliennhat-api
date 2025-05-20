/**
 * Error handling middleware for API requests
 * This file provides centralized error handling for all API routes
 */

// Error types
const ERROR_TYPES = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  AUTHORIZATION: 'AUTHORIZATION',
  INTERNAL: 'INTERNAL',
  CORS: 'CORS',
  DATABASE: 'DATABASE'
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);
  
  // Default error response
  let statusCode = 500;
  let errorType = ERROR_TYPES.INTERNAL;
  let message = 'An unexpected error occurred';
  
  // Check error type if it was set
  if (err.type) {
    switch (err.type) {
      case ERROR_TYPES.NOT_FOUND:
        statusCode = 404;
        message = err.message || 'Resource not found';
        break;
      case ERROR_TYPES.VALIDATION:
        statusCode = 400;
        message = err.message || 'Invalid request data';
        break;
      case ERROR_TYPES.AUTHORIZATION:
        statusCode = 403;
        message = err.message || 'Not authorized';
        break;
      case ERROR_TYPES.CORS:
        statusCode = 403;
        message = err.message || 'CORS error - cross-origin request blocked';
        break;
      case ERROR_TYPES.DATABASE:
        statusCode = 500;
        message = err.message || 'Database error';
        break;
      default:
        // Use defaults for INTERNAL
        break;
    }
    errorType = err.type;
  }
  
  // Always log database errors with full details
  if (errorType === ERROR_TYPES.DATABASE) {
    console.error('Database Error Details:', err.stack || err);
  }
  
  // If this is a response to an OPTIONS request or a CORS error, set CORS headers
  if (req.method === 'OPTIONS' || errorType === ERROR_TYPES.CORS) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // For OPTIONS requests, immediately return
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  // Return standardized error response
  return res.status(statusCode).json({
    statusCode: statusCode,
    success: false,
    error: {
      type: errorType,
      message: message
    },
    timestamp: new Date().toISOString()
  });
};

// Not found handler - called when no routes match
const notFoundHandler = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.type = ERROR_TYPES.NOT_FOUND;
  next(err);
};

// CORS error handler - specifically for catching CORS issues
const corsErrorHandler = (err, req, res, next) => {
  // Check if this is a CORS error
  if (err.message && (
    err.message.includes('CORS') || 
    err.message.includes('cross-origin') || 
    err.message.includes('Access-Control-Allow-Origin')
  )) {
    err.type = ERROR_TYPES.CORS;
  }
  next(err);
};

// Export all middleware functions and constants
module.exports = {
  errorHandler,
  notFoundHandler,
  corsErrorHandler,
  ERROR_TYPES
}; 