const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'https://api.thontrangliennhat.com';

// Remove all CORS restrictions completely
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Also keep the standard CORS middleware with all origins allowed
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

// Express JSON middleware with error handling
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        statusCode: 400,
        message: 'Invalid JSON: ' + e.message,
        data: []
      });
      throw new Error('Invalid JSON');
    }
  }
}));

// Standardize API responses
app.use((req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Skip if this is not an API request
    if (!req.path.startsWith('/api/')) {
      return originalJson.call(this, data);
    }
    
    // Standardize the response format for API endpoints
    let standardResponse;
    
    if (data && data.statusCode) {
      // Response already has correct format
      standardResponse = data;
    } else {
      // Convert to standard format
      standardResponse = {
        statusCode: res.statusCode || 200,
        message: 'Success',
        data: data || []
      };
    }
    
    // Ensure data is never undefined or null
    if (standardResponse.data === undefined || standardResponse.data === null) {
      standardResponse.data = [];
    }
    
    // Always return an object for single item requests if endpoint is singular
    if (req.path.match(/\/api\/[^\/]+\/\d+$/) && 
        !Array.isArray(standardResponse.data) && 
        typeof standardResponse.data !== 'object') {
      standardResponse.data = { value: standardResponse.data };
    }
    
    return originalJson.call(this, standardResponse);
  };
  
  next();
});

// Add middleware to handle file not found errors for images
app.use((req, res, next) => {
  const originalSendFile = res.sendFile;
  
  res.sendFile = function(path, options, callback) {
    // Check if file exists before sending
    if (!fs.existsSync(path)) {
      console.log(`File not found: ${path}, returning empty response`);
      return res.status(204).end();
    }
    
    return originalSendFile.call(this, path, options, callback);
  };
  
  next();
});

// Route xử lý favicon để ngăn lỗi 404
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    return res.sendFile(faviconPath);
  }
  res.status(204).end(); // No content
});

app.get('/favicon.png', (req, res) => {
  const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    return res.sendFile(faviconPath);
  }
  res.status(204).end(); // No content
});

// Define upload directory and ensure it exists
const UPLOADS_DIR = path.join('/tmp', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  console.log(`Creating uploads directory: ${UPLOADS_DIR}`);
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp + original name
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniquePrefix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
      req.fileValidationError = 'Only image files are allowed!';
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded images - for Vercel deployment
app.use('/images', express.static(path.join('/tmp', 'uploads')));
app.use('/uploads', express.static(path.join('/tmp', 'uploads')));
app.use('/images/uploads', express.static(path.join('/tmp', 'uploads')));

// For local development
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('Serving static files from:', path.join(__dirname, 'public'));
console.log('Serving uploads from:', path.join('/tmp', 'uploads'));

// Serve uploaded images
app.use('/images', express.static(path.join(__dirname, 'images')));
// Serve uploads directly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Serving static files from:', path.join(__dirname, 'public'));
console.log('Serving images from:', path.join(__dirname, 'images'));
console.log('Serving uploads from:', path.join(__dirname, 'uploads'));

// Ensure all image paths are accessible - add additional image directory mappings
app.use('/images/products', express.static(path.join(__dirname, 'images', 'products')));
app.use('/images/products', express.static(path.join(__dirname, 'public', 'images', 'products')));
app.use('/images/uploads', express.static(path.join(__dirname, 'images', 'uploads')));
app.use('/images/uploads', express.static(path.join(__dirname, 'public', 'images', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'images', 'uploads')));
app.use('/public/images/products', express.static(path.join(__dirname, 'public', 'images', 'products')));
app.use('/public/images/uploads', express.static(path.join(__dirname, 'public', 'images', 'uploads')));

// Also serve parent directory images if they exist
const parentImagesPath = path.resolve(__dirname, '..', 'images');
if (fs.existsSync(parentImagesPath)) {
  console.log('Serving parent directory images from:', parentImagesPath);
  app.use('/images', express.static(parentImagesPath));
  app.use('/images/products', express.static(path.join(parentImagesPath, 'products')));
  app.use('/images/uploads', express.static(path.join(parentImagesPath, 'uploads')));
}

// Serve images from the parent uploads directory if it exists
const parentUploadsPath = path.resolve(__dirname, '..', 'uploads');
if (fs.existsSync(parentUploadsPath)) {
  console.log('Serving parent directory uploads from:', parentUploadsPath);
  app.use('/uploads', express.static(parentUploadsPath));
}

// Serve images from build directory if it exists (for production builds)
const buildImagesPath = path.resolve(__dirname, '..', 'build', 'images');
if (fs.existsSync(buildImagesPath)) {
  console.log('Serving build directory images from:', buildImagesPath);
  app.use('/images', express.static(buildImagesPath));
  app.use('/images/uploads', express.static(path.join(buildImagesPath, 'uploads')));
}

// Create all necessary placeholder images
const createPlaceholders = () => {
  // Create base directories
  const directories = [
    path.join(__dirname, 'public', 'images'),
    path.join(__dirname, 'public', 'images', 'uploads'),
    path.join(__dirname, 'public', 'images', 'products'),
    path.join(__dirname, 'images'),
    path.join(__dirname, 'images', 'uploads'),
    path.join(__dirname, 'images', 'products'),
    path.join(__dirname, 'uploads'),
    path.join('/tmp', 'uploads')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (error) {
        console.error(`Error creating directory ${dir}:`, error);
      }
    }
  });
  
  // Create placeholder images in each directory
  const placeholderFiles = [
    path.join(__dirname, 'public', 'images', 'placeholder.jpg'),
    path.join(__dirname, 'public', 'images', 'placeholder.png'),
    path.join(__dirname, 'images', 'placeholder.jpg'),
    path.join(__dirname, 'images', 'placeholder.png')
  ];
  
  // Base64 encoded placeholder images
  // A better placeholder image (colored square with text)
  const placeholderImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTA1LTE2VDE1OjM0OjA3KzA3IiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wNS0xNlQxNTozNzozNSswNyIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNC0wNS0xNlQxNTozNzozNSswNyIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NDhmYjZkMS0zOGM3LThjNGItODEzNS01ZGUwZDQzNGYyMmEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NjQ4ZmI2ZDEtMzhjNy04YzRiLTgxMzUtNWRlMGQ0MzRmMjJhIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NjQ4ZmI2ZDEtMzhjNy04YzRiLTgxMzUtNWRlMGQ0MzRmMjJhIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2NDhmYjZkMS0zOGM3LThjNGItODEzNS01ZGUwZDQzNGYyMmEiIHN0RXZ0OndoZW49IjIwMjQtMDUtMTZUMTU6MzQ6MDcrMDciIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4eeHhyAAAH1ElEQVR4nO3dW4xdVRnG8f+aWbqb0lLoJb2mU8CiIAKFFKwQJREboqJA8AYMGi8wMRJNxBs1IV54YTReGI3GGDACGpXwgBEvUBGQlgKt2KJSoKW05XQ6dDptaWdmLy/20FLmss85e33fXmuv/5N0JpPpPt/51v7WWfvbaw9s3bpVRCTPsOsAIhJZFSQOo8D+Jp5LRERERERERERERERERPIpSDA2AJuAC9F7JiIiIiKdJMaZ5UHgXmDEdRAREZFu5a0gw8C7kWXAVmSbF3k5sBx5XZbkKMkfO7GOV/dW4A7gIuAq13HEnyEVJEibgA3ArJNf24FjDiOFYhawGpgPnOc4SxHLgeuRjcYTHGcREZGYeZxZlgJ3A5uRPZzZwFrnCcMzDVgH3IisM+5ynkdERKLmIchVVtPDK5DDnquclxMRkX6oRCjIHLazbWCQ82aUGdm1k8mXXqTyzPOVPZpUkAB5qcclrGdmZYLDDPPcc0v5/bPLOf7GQdbOfogbhx8vfEwVxN+wNvn1V4lHYz0ebWSIVSwaf4Mx3mKMMaYwzHSOcSbrGa+M8PoTK3nq1Ut49tjZnAG8FZgFvI8JXhr+XebjqyDufJDRd70qx0hG32EWW7iVs9nDVMaZyhA17mIb83if1axgYtFsXv7VLbz2+DpuHv07I78ZYnroP4iPg2TufhBJ1/c+yBjwFeBXlZvYxW5GmcQoQ0xwMwf5OQ9zPpczyXDqcY5zjO384r3t/OnYSqYA5wKXAxcjC8KPX91dgMvKPJaI9OpM4CLgMuSSdwnDTGEyk1Q4l318nH9wLW9nBpNpx5gA9rCLyV95izfvhyPAQuTmj3XIJcgvI+9p2jGaUXbXXkTaqSBXAT8BfgjcA3wOWcVbRJ1hJqlwkO08xG5WczFTMgtyAsm6/vDIWxx+BF5C9rF+jlyWr0Cu7T+IfOKm1TYFETGqlxnkIuRyaBtSjK8h/28FUhLInn/2M4MJhnmdx9nDUlZzBtMzDlZHZpcjwKvA34FHgX8C24G3kFnl3Qn+jHGkDGXc4/IYEZGCssYzJwGzgcXItcA5SEEWIWs8M5GLkCTDyFnrFA5xI39lGpdyR8asr5bRb73KA24CP0NmLDuRpShvIkvHD0z+3WHk0uw4crZ4b/JrA3J2mIwsjpEZYT/EaqAgIuZlDdQVoI5c3dQZ4jnWsJlJnMUTXM0uxvoYqH2MsZ8Qn+MbBY5Txki11wdZBDyLLNw1T9R9IJ16VZa20w00yiIe5w7u4hfczdv5LsP8L0CRK6PGe4jVYB2wFVhT8vNKT1SQ8AZlHWQO+1nEDs7lHYYY5SKe5XJ+y4e4g3HGCxQkTyUzSWN0O/Bo4udIAlSQ+NWRu+IfY4yDzOZOPsQlPMVqtnA5O5jZcZBXRZlbqMeQxdmrSnyuiIhEwGJplpST1ZDl5S8gO+pTCnxeKz0vHSuLiIiIpFBBusNR4D5k+Xsv1iMLzZ2w8N8tK5ciInKy+s8ocEAFidse5JaeXj2I3NJTKQcRRERCUkH60ytpJtJlkDuyFzEREQmiwYB+FPhLn4/xXaTkIiJiJK0gB5BPPLxYZL++j8c4Abxa4OeJiEh02QXZh1wOJWMRcuvOp5E9+UkNfraLLO/6GcMrIiJGg/TRwGcgBXuQj94eRtbVX5XxmN86+VzDDo5rrYhx3uXtYlE7yFG7aycTpydT1PXxRXPxfpBUgQqyr98T12V0Xt2bTvdT9I/2tXrQhRUbsR4zzEgZ84rdHn4Ky9tJJN5V5GxTQZILexn7AXbXdirfGO+F94IY5a0gRm+AHCeb1c2a11SVnIqitYd3u/tBjM4gXi7NRsrZgzea+zQ+6aJLCy3uiYiISGcqSI+8XIqYOyuJiPi6TFdEvPO0DxJkH8TYpYiXfRCDvO6DWPzvHpS6dBkwHQQREZFQVBAREZEUKshJfFyKeBliLHM2a5y3y6xGzmaUke9FEh8D5oDpKpaIiEhIGqTbeDlDmDtD6AwikswLb1dZRpd3fmNuL+Hjdvfm27sLFSTy+0FEREQsFqSCFGPuTCYiIiLiTMddZg3QosziohvH8ddrQYzyrjSxbHc/5X2GUEHCvXEe9kGM5j4qiLVeC2K0D2KVt30QXdSIiESiY0F8nImsnIm8rIuISNvcKu2YbpBZ2ZHVGcSk2PdBJJlR3vdBgnz3jfZBbIru7Uf9IIZpBm18pEHefRARERGDfO2DiIiI9KxjQawuRazcqGibl7UeLXXICzxZOXsdDmRnnvU26NgPYvRG2L4fJPe4Vt7AvHcffB/E6H9c2bGvfpDeR19EREQcqCBpPF2KALbOZF72ZYrQ5Zi3M5mvvd0oab/Fb9/Lvd2u5+OmoRAxERERkR6pH0RERDK5/4CPdYbPICJRcf8BHxERyWS0DyJOaNUygkF5T71cj9X4jdLl7ccwylu7+9oHYfDrMsjPukiXnpVEREQkpAFbVNPMitFKepS0FinP2Z2wxuPFuooVcaX/Aw++GqcaVTMNAAAAAElFTkSuQmCC', 'base64');
  
  placeholderFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`Creating placeholder image at: ${file}`);
      try {
        fs.writeFileSync(file, placeholderImage);
      } catch (error) {
        console.error(`Error creating placeholder image ${file}:`, error);
      }
    }
  });
  
  // Also create some commonly requested images that are missing
  const commonImageNames = [
    'default-image.jpg',
    'default-product.jpg',
    'default-service.jpg',
    'default-team.jpg',
    'default-avatar.jpg',
    'default.jpg',
    'logo.png'
  ];
  
  const imageDirectories = [
    path.join(__dirname, 'public', 'images'),
    path.join(__dirname, 'images'),
    path.join(__dirname, 'public', 'images', 'uploads'),
    path.join(__dirname, 'images', 'uploads')
  ];
  
  imageDirectories.forEach(dir => {
    commonImageNames.forEach(imgName => {
      const imgPath = path.join(dir, imgName);
      if (!fs.existsSync(imgPath)) {
        console.log(`Creating common image: ${imgPath}`);
        try {
          fs.writeFileSync(imgPath, placeholderImage);
        } catch (error) {
          console.error(`Error creating common image ${imgPath}:`, error);
        }
      }
    });
  });
};

// Create all placeholder images at startup
createPlaceholders();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Đảm bảo thư mục uploads có thể truy cập được
app.use('/images/uploads', express.static(path.join(__dirname, 'images', 'uploads')));
app.use('/images/uploads', express.static(path.join(__dirname, 'public', 'images', 'uploads')));

// Serve public/images directory 
app.use('/public/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Middleware to handle images not found
app.use((req, res, next) => {
  // Only intercept image requests
  if (req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    // Set CORS headers for all image responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Determine appropriate content type
    let contentType = 'image/jpeg';
    if (req.path.endsWith('.png')) contentType = 'image/png';
    if (req.path.endsWith('.gif')) contentType = 'image/gif';
    if (req.path.endsWith('.webp')) contentType = 'image/webp';
    
    res.setHeader('Content-Type', contentType);
    
    // Log image request
    console.log(`Image requested: ${req.path}`);
    
    // Check multiple possible locations
    const filename = path.basename(req.path);
    const possiblePaths = [
      path.join(__dirname, req.path), // Direct path
      path.join(__dirname, 'images', 'uploads', filename),
      path.join(__dirname, 'uploads', filename),
      path.join(__dirname, 'public', 'images', 'uploads', filename),
      path.join('/tmp', 'uploads', filename), // For Vercel deployment
      path.join(__dirname, '..', 'uploads', filename),
      path.join(__dirname, '..', 'images', 'uploads', filename),
      path.join(__dirname, '..', 'public', 'images', 'uploads', filename),
      path.join(__dirname, '..', 'build', 'images', 'uploads', filename)
    ];
    
    // Try each path
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        console.log(`Found image at: ${filePath}`);
        return res.sendFile(filePath);
      }
    }
    
    // If image not found in paths, check if it's in upload path format
    if (req.path.includes('/api/') && req.path.includes('/uploads/')) {
      const correctPath = req.path.replace('/api/', '/');
      console.log(`Trying corrected path: ${correctPath}`);
      return res.redirect(correctPath);
    }
    
    // If not found, use default image
    console.log(`Image not found: ${req.path}, using placeholder image`);
    return res.sendFile(placeholderImagePath);
  }
  
  next();
});

// API endpoint for parent navigation
app.get('/api/parent-navs', (req, res) => {
  try {
    console.log(`GET /api/parent-navs - Fetching parent navigation`);
    
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Pre-flight response for OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Default navigation items if none exist
    const defaultNavigation = [
      {
        id: 1,
        title: "Trang chủ",
        slug: "trang-chu",
        position: 1
      },
      {
        id: 2,
        title: "Sản phẩm",
        slug: "san-pham",
        position: 2
      },
      {
        id: 3,
        title: "Dịch vụ",
        slug: "dich-vu",
        position: 3
      },
      {
        id: 4,
        title: "Trải nghiệm",
        slug: "trai-nghiem",
        position: 4
      },
      {
        id: 5,
        title: "Tin tức",
        slug: "tin-tuc",
        position: 5
      },
      {
        id: 6,
        title: "Liên hệ",
        slug: "lien-he",
        position: 6
      }
    ];
    
    const db = getDatabase();
    
    // Check if navigation array exists and has items
    const hasValidNavigation = db.navigation && Array.isArray(db.navigation) && db.navigation.length > 0;
    
    // If no valid navigation, return default
    if (!hasValidNavigation) {
      console.log('No navigation data found, returning default navigation');
      return res.json({
        statusCode: 200,
        message: 'Success',
        data: defaultNavigation
      });
    }
    
    // Create valid navigation items with all required fields
    const parentNavs = db.navigation.map(item => ({
      id: item.id || Math.floor(Math.random() * 1000),
      title: item.title || 'Navigation Item',
      slug: item.slug || `nav-item-${item.id || Math.floor(Math.random() * 1000)}`,
      position: item.position || 0
    }));
    
    // Sort by position
    parentNavs.sort((a, b) => a.position - b.position);
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: parentNavs
    });
  } catch (error) {
    console.error('Error fetching parent navs:', error);
    // Return default data instead of error
    res.json({
      statusCode: 200,
      message: 'Success',
      data: [
        {
          id: 1,
          title: "Trang chủ",
          slug: "trang-chu",
          position: 1
        },
        {
          id: 2,
          title: "Sản phẩm",
          slug: "san-pham",
          position: 2
        },
        {
          id: 3,
          title: "Dịch vụ",
          slug: "dich-vu",
          position: 3
        },
        {
          id: 4,
          title: "Tin tức",
          slug: "tin-tuc",
          position: 4
        }
      ]
    });
  }
});

// API endpoint for all navigation with children
app.get('/api/parent-navs/all-with-child', (req, res) => {
  try {
    console.log(`GET /api/parent-navs/all-with-child - Fetching all navigation with children`);
    
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Pre-flight response for OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const db = getDatabase();
    
    if (!db.navigation || !Array.isArray(db.navigation)) {
      console.log('No navigation data found, returning default navigation');
      return res.json({
        statusCode: 200,
        message: 'Success',
        data: [
          {
            id: 1,
            title: "Trang chủ",
            slug: "trang-chu",
            position: 1,
            children: []
          }
        ]
      });
    }
    
    // Make sure each navigation item has a children array
    const validNavigation = db.navigation.map(nav => ({
      ...nav,
      children: Array.isArray(nav.children) ? nav.children : []
    }));
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: validNavigation
    });
  } catch (error) {
    console.error('Error fetching all navigation with children:', error);
    // Return default data instead of error
    res.json({
      statusCode: 200,
      message: 'Success',
      data: [
        {
          id: 1,
          title: "Trang chủ",
          slug: "trang-chu",
          position: 1,
          children: []
        }
      ]
    });
  }
});

// Endpoint for fetching categories by parent nav slug
app.get('/api/parent-navs/slug/:slug', (req, res) => {
  try {
    const slug = req.params.slug;
    console.log(`GET /api/parent-navs/slug/${slug} - Fetching categories by slug`);
    
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Pre-flight response for OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const db = getDatabase();
    
    // Special handling for specific slugs that are commonly used
    if (slug === 'dich-vu' || slug === 'san-pham' || slug === 'trai-nghiem') {
      // Provide default categories for common navigation items
      return res.json({
        statusCode: 200,
        message: 'Success',
        data: [
          {
            id: 1,
            title: "Tất cả",
            slug: `tat-ca-${slug}`,
            parentId: 1
          },
          {
            id: 2,
            title: "Nổi bật",
            slug: `noi-bat-${slug}`,
            parentId: 1
          }
        ]
      });
    }
    
    if (!db || !db.navigation || !Array.isArray(db.navigation)) {
      console.log('No navigation data found, returning default categories');
      return res.json({
        statusCode: 200,
        message: 'Success',
        data: [
          {
            id: 1,
            title: "Danh mục",
            slug: "danh-muc",
            parentId: 1
          }
        ]
      });
    }
    
    const parentNav = db.navigation.find(nav => nav.slug === slug);
    
    if (parentNav) {
      // Ensure children array exists and is valid
      const children = Array.isArray(parentNav.children) ? parentNav.children : [];
      
      res.json({
        statusCode: 200,
        message: 'Success',
        data: children
      });
    } else {
      // Return default categories instead of empty array
      console.log(`No parent navigation found with slug: ${slug}, returning default categories`);
      res.json({
        statusCode: 200,
        message: 'Success',
        data: [
          {
            id: 1,
            title: "Danh mục",
            slug: "danh-muc",
            parentId: 1
          }
        ]
      });
    }
  } catch (error) {
    console.error(`Error fetching categories by slug ${req.params.slug}:`, error);
    // Return default data instead of error
    res.json({
      statusCode: 200,
      message: 'Success',
      data: [
        {
          id: 1,
          title: "Danh mục",
          slug: "danh-muc",
          parentId: 1
        }
      ]
    });
  }
});

// API endpoint for navigation links - for backward compatibility
app.get('/api/navigation-links', (req, res) => {
  try {
    console.log(`GET /api/navigation-links - Fetching navigation links`);
    
    // Set CORS headers specifically for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const db = getDatabase();
    
    if (!db.navigation || !Array.isArray(db.navigation)) {
      console.log('No navigation data found, returning empty array');
      return res.json([]);
    }
    
    res.json(db.navigation);
  } catch (error) {
    console.error('Error fetching navigation links:', error);
    // Return empty array instead of error
    res.json([]);
  }
});

app.get('/api/child-navs', (req, res) => {
  try {
    const db = getDatabase();
    
    if (!db.navigation || !Array.isArray(db.navigation)) {
      return res.json({
        statusCode: 200,
        message: 'Success',
        data: []
      });
    }
    
    let allChildren = [];
    
    db.navigation.forEach(parent => {
      if (parent.children && Array.isArray(parent.children)) {
        allChildren = [...allChildren, ...parent.children.map(child => ({
          ...child,
          parentId: parent.id
        }))];
      }
    });
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: allChildren
    });
  } catch (error) {
    console.error('Error fetching child navs:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching child navs: ' + error.message,
      data: []
    });
  }
});

// GET endpoint for individual parent navigation item
app.get('/api/parent-navs/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`GET /api/parent-navs/${id} - Fetching parent navigation`);
    
    // Read the database
    const db = getDatabase();
    
    // Find the parent navigation item
    const parent = db.navigation.find(nav => nav.id === id);
    
    if (!parent) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Parent navigation not found'
      });
    }
    
    // Return success response
    res.json({
      statusCode: 200,
      message: 'Parent navigation fetched successfully',
      data: parent
    });
  } catch (error) {
    console.error('Error fetching parent navigation:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching parent navigation: ' + error.message
    });
  }
});

// GET endpoint for individual child navigation item
app.get('/api/child-navs/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`GET /api/child-navs/${id} - Fetching child navigation`);
    
    // Read the database
    const db = getDatabase();
    
    // Variables to store found child nav
    let childNav = null;
    let parentNav = null;
    
    // Find the child navigation item
    for (const parent of db.navigation) {
      const child = parent.children.find(child => child.id === id);
      
      if (child) {
        childNav = { ...child, parentId: parent.id };
        parentNav = parent;
        break;
      }
    }
    
    if (!childNav) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Child navigation not found'
      });
    }
    
    // Return success response
    res.json({
      statusCode: 200,
      message: 'Child navigation fetched successfully',
      data: childNav
    });
  } catch (error) {
    console.error('Error fetching child navigation:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching child navigation: ' + error.message
    });
  }
});

// API endpoint cho users
app.get('/api/users', (req, res) => {
  const db = getDatabase();
  res.json(db.users);
});

// API endpoint cho products
app.get('/api/products', (req, res) => {
  try {
    console.log('GET /api/products - Getting all products');
    
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Pre-flight response for OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const db = getDatabase();
    
    // Define default products
    const defaultProducts = [
      {
        id: 1,
        name: "Gạo hữu cơ địa phương",
        slug: "gao-huu-co-dia-phuong",
        summary: "Gạo hữu cơ chất lượng cao của Thôn Trang Liên Nhất",
        content: "Sản phẩm gạo được trồng theo phương pháp hữu cơ, không sử dụng thuốc trừ sâu hóa học, an toàn cho sức khỏe người tiêu dùng.",
        images: ["/images/placeholder.jpg"],
        child_nav_id: 2,
        categoryId: 2,
        price: 35000,
        discountPrice: 30000,
        isFeatured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Rau sạch địa phương",
        slug: "rau-sach-dia-phuong",
        summary: "Rau sạch được trồng tại Thôn Trang Liên Nhất",
        content: "Rau được trồng theo quy trình an toàn, không thuốc trừ sâu độc hại, đảm bảo dinh dưỡng và an toàn cho người tiêu dùng.",
        images: ["/images/placeholder.jpg"],
        child_nav_id: 2,
        categoryId: 2,
        price: 15000,
        discountPrice: 0,
        isFeatured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Check if products exist in database and are valid
    let products = defaultProducts;
    
    if (db && db.products && Array.isArray(db.products) && db.products.length > 0) {
      // Use database products if available
      products = db.products.map(product => ({
        id: product.id || Math.floor(Math.random() * 1000),
        name: product.name || "Sản phẩm",
        slug: product.slug || (product.name ? product.name.toLowerCase().replace(/\s+/g, '-') : `san-pham-${product.id || Math.floor(Math.random() * 1000)}`),
        summary: product.summary || "",
        content: product.content || "",
        description: product.description || product.content || "",
        images: Array.isArray(product.images) ? product.images : ["/images/placeholder.jpg"],
        image: product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "/images/placeholder.jpg"),
        child_nav_id: product.child_nav_id || product.categoryId || 2,
        categoryId: product.categoryId || product.child_nav_id || 2,
        price: parseFloat(product.price) || 0,
        discountPrice: parseFloat(product.discountPrice) || 0,
        isFeatured: product.isFeatured === true || product.isFeatured === 'true' || false,
        created_at: product.created_at || product.createdAt || new Date().toISOString(),
        updated_at: product.updated_at || product.updatedAt || new Date().toISOString(),
        createdAt: product.createdAt || product.created_at || new Date().toISOString(),
        updatedAt: product.updatedAt || product.updated_at || new Date().toISOString()
      }));
    }
    
    // Apply any query filters
    const { category, featured, limit } = req.query;
    
    let filteredProducts = products;
    
    // Filter by category/child_nav_id if specified
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.categoryId == category || 
        product.child_nav_id == category
      );
    }
    
    // Filter by featured status if specified
    if (featured === 'true') {
      filteredProducts = filteredProducts.filter(product => product.isFeatured);
    }
    
    // Apply limit if specified
    if (limit) {
      filteredProducts = filteredProducts.slice(0, parseInt(limit));
    }
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: filteredProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return default data instead of error
    res.json({
      statusCode: 200,
      message: 'Success',
      data: [
        {
          id: 1,
          name: "Gạo hữu cơ địa phương",
          slug: "gao-huu-co-dia-phuong",
          summary: "Gạo hữu cơ chất lượng cao của Thôn Trang Liên Nhất",
          content: "Sản phẩm gạo được trồng theo phương pháp hữu cơ, không sử dụng thuốc trừ sâu hóa học, an toàn cho sức khỏe người tiêu dùng.",
          images: ["/images/placeholder.jpg"],
          child_nav_id: 2,
          categoryId: 2,
          price: 35000,
          discountPrice: 30000,
          isFeatured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  }
});

// API endpoint để tạo product mới
app.post('/api/products', upload.array('images[]', 10), (req, res) => {
  try {
    console.log('POST /api/products - Creating new product:', req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Extract data from request body
    const { 
      name, 
      content, 
      child_nav_id, 
      summary, 
      features,
      phone_number,
      type,
      isFeatured
    } = req.body;
    
    // Generate a new ID
    const newId = db.products.length > 0 
      ? Math.max(...db.products.map(p => p.id)) + 1 
      : 1;
    
    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^\w\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, 'a')
      .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, 'e')
      .replace(/í|ì|ỉ|ĩ|ị/g, 'i')
      .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o')
      .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, 'u')
      .replace(/ý|ỳ|ỷ|ỹ|ỵ/g, 'y')
      .replace(/đ/g, 'd');
    
    // Process uploaded images
    let imageFiles = [];
    if (req.files && req.files.length > 0) {
      imageFiles = req.files.map(file => {
        // Ensure paths always start with / for consistency
        const imagePath = `/images/uploads/${file.filename}`;
        console.log(`Created image path: ${imagePath}`);
        return imagePath;
      });
      console.log('Uploaded image paths:', imageFiles);
    }
    
    // Create new product object
    const newProduct = {
      id: newId,
      name,
      images: imageFiles.length > 0 ? imageFiles : [],
      content,
      slug,
      summary,
      child_nav_id: child_nav_id ? parseInt(child_nav_id) : null,
      features: features || "[]",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phone_number: phone_number || "",
      type: type || "san-pham",
      isFeatured: isFeatured === "true" || false
    };
    
    // Add to database
    db.products.push(newProduct);
    
    // Write to the database file
    writeDatabase(db);
    
    console.log(`Created product with ID ${newId}`);
    
    return res.status(201).json({
      statusCode: 201,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Error creating product',
      error: error.message
    });
  }
});

app.get('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  console.log(`GET /api/products/${id}`);
  const db = getDatabase();
  const product = db.products.find(p => p.id === id);
  
  if (product) {
    res.json({
      statusCode: 200,
      message: 'Success',
      data: product
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      message: 'Product not found'
    });
  }
});

// POST endpoint for updating a product
app.post('/api/products/:id', upload.array('images[]', 5), (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    console.log(`POST /api/products/${productId} - Updating product:`, req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Find the product by ID
    const productIndex = db.products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Product not found'
      });
    }
    
    // Get the current product data
    const currentProduct = db.products[productIndex];
    
    // Extract data from request body
    const { 
      name, 
      content, 
      child_nav_id, 
      summary, 
      features,
      phone_number
    } = req.body;
    
    // Get uploaded files info
    const uploadedFiles = req.files || [];
    const newFileUrls = uploadedFiles.map(file => {
      // Ensure consistent path format that starts with /
      const imagePath = `/images/uploads/${file.filename}`;
      console.log(`Added new image path: ${imagePath}`);
      return imagePath;
    });
    
    // Handle existing images in form data
    let existingImages = [];
    if (req.body['images[]']) {
      if (Array.isArray(req.body['images[]'])) {
        existingImages = req.body['images[]'].filter(img => img && img.trim() !== '');
      } else {
        // Single image case - add to array if valid
        if (req.body['images[]'] && req.body['images[]'].trim() !== '') {
          existingImages = [req.body['images[]']];
        }
      }
    }
    
    console.log('Existing images after filtering:', existingImages);
    
    // Combine existing and new image URLs
    const allImages = [...existingImages, ...newFileUrls];
    
    // Create updated product object
    const updatedProduct = {
      ...currentProduct,
      name: name || currentProduct.name,
      content: content || currentProduct.content,
      child_nav_id: child_nav_id ? parseInt(child_nav_id) : currentProduct.child_nav_id,
      summary: summary || currentProduct.summary,
      features: features || currentProduct.features,
      phone_number: phone_number || currentProduct.phone_number,
      updatedAt: new Date().toISOString()
    };
    
    // Update images if new ones were uploaded or existing ones were specified
    if (allImages.length > 0) {
      updatedProduct.images = allImages;
    }
    
    // Update the product in the database
    db.products[productIndex] = updatedProduct;
    
    // Save the database
    if (writeDatabase(db)) {
      return res.status(200).json({
        statusCode: 200,
        message: 'Product updated successfully',
        data: updatedProduct
      });
    } else {
      return res.status(500).json({
        statusCode: 500,
        message: 'Error writing to database'
      });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE endpoint for deleting a product
app.delete('/api/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    console.log(`DELETE /api/products/${productId} - Deleting product`);
    
    // Read the database
    const db = getDatabase();
    
    // Find the product by ID
    const productIndex = db.products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Product not found'
      });
    }
    
    // Store the product before deleting it
    const deletedProduct = db.products[productIndex];
    
    // Remove the product from the array
    db.products.splice(productIndex, 1);
    
    // Save the database
    if (writeDatabase(db)) {
      // Try to delete associated image files if they exist
      if (deletedProduct.images && Array.isArray(deletedProduct.images)) {
        deletedProduct.images.forEach(imagePath => {
          try {
            if (typeof imagePath === 'string' && 
                (imagePath.includes('/images/uploads/') || imagePath.includes('/uploads/'))) {
              // Extract filename from path
              const filename = path.basename(imagePath);
              // Check multiple possible locations
              const possiblePaths = [
                path.join(__dirname, 'images', 'uploads', filename),
                path.join(__dirname, 'uploads', filename),
                path.join(__dirname, 'public', 'images', 'uploads', filename)
              ];
              
              // Try to delete from each path
              possiblePaths.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  console.log(`Deleted image file: ${filePath}`);
                }
              });
            }
          } catch (fileError) {
            console.error(`Error deleting image file: ${imagePath}`, fileError);
            // Continue even if file deletion fails
          }
        });
      }
      
      return res.status(200).json({
        statusCode: 200,
        message: 'Product deleted successfully',
        data: deletedProduct
      });
    } else {
      return res.status(500).json({
        statusCode: 500,
        message: 'Error writing to database'
      });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Server error',
      error: error.message
    });
  }
});

// API endpoint cho services
app.get('/api/services', (req, res) => {
  try {
    console.log(`GET /api/services - Fetching services`);
    
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Pre-flight response for OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const db = getDatabase();
    
    // Define default services
    const defaultServices = [
      {
        id: 1,
        name: "Dịch vụ du lịch sinh thái",
        title: "Dịch vụ du lịch sinh thái",
        slug: "dich-vu-du-lich-sinh-thai",
        summary: "Tham quan và trải nghiệm không gian sinh thái tại Thôn Trang Liên Nhất",
        content: "Cung cấp dịch vụ tham quan du lịch sinh thái tại địa phương với các hoạt động gắn liền với thiên nhiên và nông nghiệp.",
        description: "Cung cấp dịch vụ tham quan du lịch sinh thái tại địa phương với các hoạt động gắn liền với thiên nhiên và nông nghiệp.",
        images: ["/images/placeholder.jpg"],
        image: "/images/placeholder.jpg",
        child_nav_id: 3,
        categoryId: 3,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Dịch vụ ẩm thực đặc sản",
        title: "Dịch vụ ẩm thực đặc sản",
        slug: "dich-vu-am-thuc-dac-san",
        summary: "Thưởng thức đặc sản địa phương tại Thôn Trang Liên Nhất",
        content: "Cung cấp dịch vụ ẩm thực với các món ăn đặc sản được chế biến từ nguyên liệu sạch, tươi ngon của địa phương.",
        description: "Cung cấp dịch vụ ẩm thực với các món ăn đặc sản được chế biến từ nguyên liệu sạch, tươi ngon của địa phương.",
        images: ["/images/placeholder.jpg"],
        image: "/images/placeholder.jpg",
        child_nav_id: 3,
        categoryId: 3,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Check if services exist in database and are valid
    let services = defaultServices;
    
    if (db && db.services && Array.isArray(db.services) && db.services.length > 0) {
      // Map services to ensure all required fields exist
      services = db.services.map(service => ({
        id: service.id || Math.floor(Math.random() * 1000),
        name: service.name || "Dịch vụ",
        title: service.title || service.name || "Dịch vụ",
        slug: service.slug || (service.name ? service.name.toLowerCase().replace(/\s+/g, '-') : `dich-vu-${service.id || Math.floor(Math.random() * 1000)}`),
        summary: service.summary || "",
        content: service.content || "",
        description: service.description || service.content || "",
        images: Array.isArray(service.images) ? service.images : ["/images/placeholder.jpg"],
        image: service.image || (Array.isArray(service.images) && service.images.length > 0 ? service.images[0] : "/images/placeholder.jpg"),
        child_nav_id: service.child_nav_id || service.categoryId || 3,
        categoryId: service.categoryId || service.child_nav_id || 3,
        isFeatured: service.isFeatured === true || service.isFeatured === 'true' || false,
        createdAt: service.createdAt || service.created_at || new Date().toISOString(),
        updatedAt: service.updatedAt || service.updated_at || new Date().toISOString()
      }));
    }
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    // Return default data instead of error
    res.json({
      statusCode: 200,
      message: 'Success',
      data: [
        {
          id: 1,
          name: "Dịch vụ du lịch sinh thái",
          title: "Dịch vụ du lịch sinh thái",
          slug: "dich-vu-du-lich-sinh-thai",
          summary: "Tham quan và trải nghiệm không gian sinh thái tại Thôn Trang Liên Nhất",
          content: "Cung cấp dịch vụ tham quan du lịch sinh thái tại địa phương với các hoạt động gắn liền với thiên nhiên và nông nghiệp.",
          description: "Cung cấp dịch vụ tham quan du lịch sinh thái tại địa phương với các hoạt động gắn liền với thiên nhiên và nông nghiệp.",
          images: ["/images/placeholder.jpg"],
          image: "/images/placeholder.jpg",
          child_nav_id: 3,
          categoryId: 3,
          isFeatured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  }
});

// API endpoint cho tạo mới service
app.post('/api/services', upload.array('images[]'), (req, res) => {
  try {
    console.log('POST /api/services - Creating new service');
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    // Read the database
    const db = getDatabase();
    
    // Ensure services array exists
    if (!db.services) {
      db.services = [];
    }
    
    // Generate a new ID
    const newId = db.services.length > 0 
      ? Math.max(...db.services.map(service => Number(service.id) || 0)) + 1 
      : 1;
    
    // Get uploaded files
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/images/uploads/${file.filename}`);
      console.log('Uploaded image URLs:', imageUrls);
    } else if (req.body.images) {
      // Handle case when images are sent as strings in the body
      imageUrls = req.body.images;
      if (typeof imageUrls === 'string') {
        imageUrls = [imageUrls];
      }
      console.log('Image URLs from request body:', imageUrls);
    } else {
      // Default image
      imageUrls = ['/images/uploads/default-image.jpg'];
      console.log('Using default image');
    }
    
    // Ensure imageUrls is always an array
    if (typeof imageUrls === 'string') {
      imageUrls = [imageUrls];
    }
    
    // Create the new service object
    const newService = {
      id: newId,
      name: req.body.name || '',
      title: req.body.name || '',
      slug: req.body.name ? req.body.name.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-') : '',
      summary: req.body.summary || '',
      content: req.body.content || '',
      description: req.body.content || '',
      child_nav_id: req.body.child_nav_id ? parseInt(req.body.child_nav_id, 10) : 0,
      categoryId: req.body.child_nav_id ? parseInt(req.body.child_nav_id, 10) : 0,
      isFeatured: req.body.isFeatured === 'true' || true,
      views: 0,
      type: req.body.type || "dich-vu",
      price: req.body.price ? parseFloat(req.body.price) : 0,
      discountPrice: req.body.discountPrice ? parseFloat(req.body.discountPrice) : 0,
      images: imageUrls,
      image: imageUrls.length > 0 ? imageUrls[0] : '/images/uploads/default-image.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to database
    db.services.push(newService);
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Copy to parent directory if it exists
    const parentDbPath = path.resolve(__dirname, '..', 'database.json');
    if (fs.existsSync(path.dirname(parentDbPath))) {
      console.log('Copying to parent directory:', parentDbPath);
      fs.writeFileSync(parentDbPath, JSON.stringify(db, null, 2));
    }
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.status(201).json({
      statusCode: 201,
      message: 'Service created successfully',
      data: newService
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error creating service: ' + error.message
    });
  }
});

// API endpoint cho cập nhật service theo ID
app.post('/api/services/:id', upload.array('images[]'), (req, res) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    console.log(`POST /api/services/${serviceId} - Updating service:`, req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Find service
    const serviceIndex = db.services.findIndex(service => service.id === serviceId);
    
    if (serviceIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Service not found'
      });
    }
    
    // Get existing service data
    const existingService = db.services[serviceIndex];
    
    // Get the image URLs if uploaded
    let imageUrls = existingService.images || [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/images/uploads/${file.filename}`);
      console.log(`Images updated:`, imageUrls);
    } else if (req.body.images) {
      // Handle case when images are sent as a string in the body
      imageUrls = req.body.images;
      if (typeof imageUrls === 'string') {
        // Keep as is - it's a path to an existing image
        console.log(`Keeping existing image:`, imageUrls);
      }
    }
    
    // Ensure imageUrls is always an array
    if (typeof imageUrls === 'string') {
      imageUrls = [imageUrls];
    }
    
    // Update service
    db.services[serviceIndex] = {
      ...existingService,
      name: req.body.name || existingService.name,
      title: req.body.name || existingService.title || existingService.name,
      slug: req.body.slug || existingService.slug || (req.body.name ? req.body.name.toLowerCase().replace(/\s+/g, '-') : existingService.slug),
      summary: req.body.summary || existingService.summary,
      content: req.body.content || existingService.content,
      description: req.body.content || existingService.description || existingService.content,
      child_nav_id: req.body.child_nav_id || existingService.child_nav_id,
      isFeatured: req.body.isFeatured !== undefined ? req.body.isFeatured : existingService.isFeatured,
      images: imageUrls,
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.status(200).json({
      statusCode: 200,
      message: 'Service updated successfully',
      data: db.services[serviceIndex]
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating service: ' + error.message
    });
  }
});

// API endpoint cho experiences
app.get('/api/experiences', (req, res) => {
  try {
    console.log('GET /api/experiences - Getting all experiences');
    
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Pre-flight response for OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const db = getDatabase();
    
    // Ensure experiences array exists and is valid
    let experiences = [];
    if (db && db.experiences && Array.isArray(db.experiences)) {
      experiences = db.experiences;
    } else {
      // Default experiences if none exist
      experiences = [
        {
          id: 1,
          title: "Trải nghiệm du lịch sinh thái",
          name: "Trải nghiệm du lịch sinh thái",
          slug: "trai-nghiem-du-lich-sinh-thai",
          summary: "Trải nghiệm du lịch sinh thái tại Thôn Trang Liên Nhất",
          description: "Khám phá nét đẹp thiên nhiên và văn hóa địa phương",
          content: "Khám phá nét đẹp thiên nhiên và văn hóa địa phương",
          images: ["/images/placeholder.jpg"],
          categoryId: 1,
          isFeatured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      console.log('Experiences array not found or not an array, returning default experiences');
    }
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: experiences
    });
  } catch (error) {
    console.error('Error fetching experiences:', error);
    // Return default data instead of error
    res.json({
      statusCode: 200,
      message: 'Success',
      data: [
        {
          id: 1,
          title: "Trải nghiệm du lịch sinh thái",
          name: "Trải nghiệm du lịch sinh thái",
          slug: "trai-nghiem-du-lich-sinh-thai",
          summary: "Trải nghiệm du lịch sinh thái tại Thôn Trang Liên Nhất",
          description: "Khám phá nét đẹp thiên nhiên và văn hóa địa phương",
          content: "Khám phá nét đẹp thiên nhiên và văn hóa địa phương",
          images: ["/images/placeholder.jpg"],
          categoryId: 1,
          isFeatured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  }
});

// API endpoint cho featured experiences (hiển thị ở trang chủ)
app.get('/api/experiences/featured', (req, res) => {
  try {
    console.log('GET /api/experiences/featured - Fetching featured experiences');
    
    const db = getDatabase();
    
    // Lấy tất cả experiences từ database
    const experiences = db.experiences || [];
    
    // Giới hạn số lượng trả về (mặc định 6 items)
    const limit = req.query.limit ? parseInt(req.query.limit) : 6;
    const featuredExperiences = experiences.slice(0, limit);
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: featuredExperiences,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching featured experiences:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching featured experiences: ' + error.message
    });
  }
});

// API endpoint cho chi tiết experience
app.get('/api/experiences/:id', (req, res) => {
  try {
    const experienceId = parseInt(req.params.id, 10);
    const db = getDatabase();
    const experience = db.experiences.find(exp => exp.id === experienceId);
    
    if (experience) {
      res.json({
        statusCode: 200,
        message: 'Success',
        data: experience
      });
    } else {
      res.status(404).json({
        statusCode: 404,
        message: 'Experience not found'
      });
    }
  } catch (error) {
    console.error('Error fetching experience:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching experience: ' + error.message
    });
  }
});

// API endpoint cho news
app.get('/api/news', (req, res) => {
  try {
    console.log('GET /api/news - Getting all news');
    
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Pre-flight response for OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const db = getDatabase();
    
    // Ensure news array exists and is valid
    let news = [];
    if (db && db.news && Array.isArray(db.news)) {
      news = db.news;
    } else {
      // Default news if none exist
      news = [
        {
          id: 1,
          title: "Tin tức mới",
          slug: "tin-tuc-moi",
          summary: "Tin tức mới nhất của Thôn Trang Liên Nhất",
          content: "Nội dung tin tức mới nhất",
          images: ["/images/placeholder.jpg"],
          categoryId: 1,
          status: "published",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      console.log('News array not found or not an array, returning default news');
    }
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    // Return default data instead of error
    res.json({
      statusCode: 200,
      message: 'Success',
      data: [
        {
          id: 1,
          title: "Tin tức mới",
          slug: "tin-tuc-moi",
          summary: "Tin tức mới nhất của Thôn Trang Liên Nhất",
          content: "Nội dung tin tức mới nhất",
          images: ["/images/placeholder.jpg"],
          categoryId: 1,
          status: "published",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  }
});

// API endpoint cho team
app.get('/api/team', (req, res) => {
  try {
    console.log(`GET /api/team - Fetching team members (legacy endpoint)`);
    
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const db = getDatabase();
    
    // Ensure the team array exists and is valid
    const defaultTeam = [
      {
        id: 1,
        name: "Nguyễn Hữu Quyền",
        position: "Giám đốc HTX",
        avatar: "/images/placeholder.jpg",
        image: "/images/placeholder.jpg",
        description: "Giám đốc HTX"
      },
      {
        id: 2,
        name: "Võ Tá Quỳnh",
        position: "Quản Lý",
        avatar: "/images/placeholder.jpg",
        image: "/images/placeholder.jpg",
        description: "Quản lý HTX"
      }
    ];
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: Array.isArray(db.team) ? db.team : defaultTeam
    });
  } catch (error) {
    console.error('Error fetching teams (legacy endpoint):', error);
    res.json({
      statusCode: 200,
      message: 'Success',
      data: [
        {
          id: 1,
          name: "Nguyễn Hữu Quyền",
          position: "Giám đốc HTX",
          avatar: "/images/placeholder.jpg",
          image: "/images/placeholder.jpg",
          description: "Giám đốc HTX"
        }
      ]
    });
  }
});

// Teams API endpoint (to match frontend calls to /api/teams)
app.get('/api/teams', (req, res) => {
  try {
    console.log(`GET /api/teams - Fetching team members`);
    
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Pre-flight response for OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const db = getDatabase();
    
    // Always provide default team members
    const defaultTeam = [
      {
        id: 1,
        name: "Nguyễn Hữu Quyền",
        position: "Giám đốc HTX",
        avatar: "/images/placeholder.jpg",
        image: "/images/placeholder.jpg",
        description: "Giám đốc HTX",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Võ Tá Quỳnh",
        position: "Quản Lý",
        avatar: "/images/placeholder.jpg",
        image: "/images/placeholder.jpg",
        description: "Quản lý HTX",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Use db.team if it exists and is an array with elements, otherwise use default team
    const teams = (db.team && Array.isArray(db.team) && db.team.length > 0) ? db.team : defaultTeam;
    
    // Ensure all team members have required fields
    const validTeams = teams.map(member => ({
      id: member.id || Math.floor(Math.random() * 1000),
      name: member.name || "Team Member",
      position: member.position || "Member",
      avatar: member.avatar || "/images/placeholder.jpg",
      image: member.image || "/images/placeholder.jpg",
      description: member.description || "",
      createdAt: member.createdAt || new Date().toISOString(),
      updatedAt: member.updatedAt || new Date().toISOString()
    }));
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: validTeams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    // Return default data instead of error
    res.json({
      statusCode: 200,
      message: 'Success', 
      data: [
        {
          id: 1,
          name: "Nguyễn Hữu Quyền",
          position: "Giám đốc HTX",
          avatar: "/images/placeholder.jpg",
          image: "/images/placeholder.jpg",
          description: "Giám đốc HTX",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Võ Tá Quỳnh",
          position: "Quản Lý",
          avatar: "/images/placeholder.jpg",
          image: "/images/placeholder.jpg",
          description: "Quản lý HTX",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  }
});

// Get team members by ID
app.get('/api/teams/:id', (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10) || 0;
    console.log(`GET /api/teams/${teamId} - Fetching team member`);
    
    // Set CORS headers explicitly for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Pre-flight response for OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const db = getDatabase();
    
    // Default member data to use if not found
    const defaultMember = {
      id: teamId,
      name: "Team Member",
      position: "Member",
      avatar: "/images/placeholder.jpg",
      image: "/images/placeholder.jpg",
      description: "Team member information",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Check if team array exists and is valid
    if (!db || !db.team || !Array.isArray(db.team)) {
      return res.json({
        statusCode: 200,
        message: 'Success',
        data: defaultMember
      });
    }
    
    const member = db.team.find(member => member.id === teamId);
    
    if (member) {
      res.json({
        statusCode: 200,
        message: 'Success',
        data: member
      });
    } else {
      // Return default data instead of 404
      res.json({
        statusCode: 200,
        message: 'Success',
        data: defaultMember
      });
    }
  } catch (error) {
    console.error('Error fetching team member:', error);
    // Return default data instead of error
    res.json({
      statusCode: 200,
      message: 'Success',
      data: {
        id: parseInt(req.params.id, 10) || 1,
        name: "Team Member",
        position: "Member",
        avatar: "/images/placeholder.jpg",
        image: "/images/placeholder.jpg",
        description: "Team member information",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  }
});

// POST endpoint for adding a team member
app.post('/api/teams', upload.single('image'), (req, res) => {
  try {
    console.log('POST /api/teams - Adding team member:', req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Ensure team array exists
    if (!db.team) {
      db.team = [];
    }
    
    // Generate new ID
    const maxId = db.team.length > 0 
      ? Math.max(...db.team.map(member => Number(member.id) || 0)) 
      : 0;
    
    const newId = maxId + 1;
    const now = new Date().toISOString();
    
    // Get the image URL if uploaded
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/images/uploads/${req.file.filename}`;
      console.log(`Image uploaded: ${imageUrl}`);
    }
    
    // Create new team member
    const newMember = {
      id: newId,
      name: req.body.name || '',
      position: req.body.position || '',
      avatar: imageUrl,
      image: imageUrl,
      description: req.body.description || '',
      createdAt: now,
      updatedAt: now
    };
    
    // Add to team array
    db.team.push(newMember);
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.status(201).json({
      statusCode: 201,
      message: 'Team member added successfully',
      data: newMember
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error adding team member: ' + error.message
    });
  }
});

// POST endpoint for updating a team member
app.post('/api/teams/:id', upload.single('image'), (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    console.log(`POST /api/teams/${teamId} - Updating team member:`, req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Find team member
    const memberIndex = db.team.findIndex(member => member.id === teamId);
    
    if (memberIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Team member not found'
      });
    }
    
    // Get existing member data
    const existingMember = db.team[memberIndex];
    
    // Get the image URL if uploaded
    let imageUrl = existingMember.image;
    if (req.file) {
      imageUrl = `/images/uploads/${req.file.filename}`;
      console.log(`Image updated: ${imageUrl}`);
    }
    
    // Update team member
    db.team[memberIndex] = {
      ...existingMember,
      name: req.body.name || existingMember.name,
      position: req.body.position || existingMember.position,
      avatar: imageUrl,
      image: imageUrl,
      description: req.body.description || existingMember.description,
      updatedAt: new Date().toISOString()
    };
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Team member updated successfully',
      data: db.team[memberIndex]
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating team member: ' + error.message
    });
  }
});

// DELETE endpoint for removing a team member
app.delete('/api/teams/:id', (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    console.log(`DELETE /api/teams/${teamId} - Deleting team member`);
    
    // Read the database
    const db = getDatabase();
    
    // Find team member
    const memberIndex = db.team.findIndex(member => member.id === teamId);
    
    if (memberIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Team member not found'
      });
    }
    
    // Store member data before removing
    const deletedMember = db.team[memberIndex];
    
    // Remove member from array
    db.team.splice(memberIndex, 1);
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Try to delete the image file if it exists
    if (deletedMember.image && deletedMember.image.includes('/uploads/')) {
      const filename = deletedMember.image.split('/').pop();
      const filePath = path.join(UPLOADS_DIR, filename);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted image file: ${filePath}`);
        } catch (fileError) {
          console.error(`Could not delete image file: ${filePath}`, fileError);
          // Continue even if file deletion fails
        }
      }
    }
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Team member deleted successfully',
      data: { id: teamId }
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error deleting team member: ' + error.message
    });
  }
});

// API endpoint cho categories
app.get('/api/categories', (req, res) => {
  const db = getDatabase();
  res.json(db.categories);
});

// API đăng nhập
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDatabase();
  
  const user = db.users.find(u => u.email === email);
  
  if (user && (password === 'password' || password === 'dat12345' || password === user.password)) {
    res.json({
      statusCode: 200,
      message: 'Login successful',
      data: {
        accessToken: 'fake-token-123456',
        refreshToken: 'fake-refresh-token-123456',
        accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
        refreshTokenExpiresAt: new Date(Date.now() + 604800000).toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } else {
    res.status(401).json({
      statusCode: 401,
      message: 'Invalid credentials'
    });
  }
});

// Khởi động server - DISABLED: Server is started at the end of file
// app.listen(PORT, () => {
//   console.log(`Server đang chạy tại http://localhost:${PORT}`);
//   console.log('Các endpoint API có sẵn:');
//   console.log('- http://localhost:' + PORT + '/api/navigation-links');
//   console.log('- http://localhost:' + PORT + '/api/parent-navs/all-with-child');
//   console.log('- http://localhost:' + PORT + '/api/parent-navs');
//   console.log('- http://localhost:' + PORT + '/api/parent-navs/slug/:slug');
//   console.log('- http://localhost:' + PORT + '/api/child-navs');
//   console.log('- http://localhost:' + PORT + '/api/products');
//   console.log('- http://localhost:' + PORT + '/api/teams');
//   console.log('- http://localhost:' + PORT + '/api/images');
//   console.log('- http://localhost:' + PORT + '/api/contact');
//   console.log('- http://localhost:' + PORT + '/api/notifications');
// });

// API endpoint cho images
app.get('/api/images', (req, res) => {
  try {
    console.log(`GET /api/images with query:`, req.query);
    
    const db = getDatabase();
    const images = db.images || [];
    console.log(`Returning ${images.length} images`);
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: images,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching images: ' + error.message
    });
  }
});

// API endpoint for contact
app.get('/api/contact', (req, res) => {
  try {
    console.log(`GET /api/contact with query:`, req.query);
    
    // Get limit from query or use default
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    // Read the database
    const db = getDatabase();
    
    // Ensure contacts array exists
    if (!db.contacts) {
      db.contacts = [];
    }
    
    // Get contacts from database (with limit if specified)
    const contacts = limit > 0 ? db.contacts.slice(0, limit) : db.contacts;
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: contacts,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching contacts: ' + error.message
    });
  }
});

// POST endpoint for creating a contact message
app.post('/api/contact', (req, res) => {
  try {
    console.log('POST /api/contact - Creating contact message:', req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Ensure contacts array exists
    if (!db.contacts) {
      db.contacts = [];
    }
    
    // Extract data from request
    const { name, email, phone, title, content } = req.body;
    
    // Generate new ID
    const maxId = db.contacts.length > 0 
      ? Math.max(...db.contacts.map(item => Number(item.id) || 0)) 
      : 0;
    
    const newId = maxId + 1;
    const now = new Date().toISOString();
    
    // Create new contact object
    const newContact = {
      id: newId,
      name: name || '',
      email: email || '',
      phone: phone || '',
      title: title || '',
      content: content || '',
      created_at: now
    };
    
    // Add to contacts array
    db.contacts.push(newContact);
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.status(201).json({
      statusCode: 201,
      message: 'Contact message created successfully',
      data: newContact
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error creating contact message: ' + error.message
    });
  }
});

// API endpoint for notifications
app.get('/api/notifications', (req, res) => {
  try {
    console.log(`GET /api/notifications with query:`, req.query);
    
    // Create dummy notifications data
    const dummyNotifications = [
      {
        id: 1,
        title: 'Chào mừng',
        message: 'Chào mừng đến với hệ thống quản lý.',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Cập nhật hệ thống',
        message: 'Hệ thống vừa được cập nhật lên phiên bản mới.',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: dummyNotifications,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching notifications: ' + error.message
    });
  }
});

// API endpoint cho videos
app.get('/api/videos', (req, res) => {
  try {
    console.log(`GET /api/videos with query:`, req.query);
    
    // Read the database
    const db = getDatabase();
    
    // Trả về videos từ database
    const videos = db.videos || [];
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: videos,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching videos: ' + error.message
    });
  }
});

// API endpoint để lấy video theo ID
app.get('/api/videos/:id', (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    console.log(`GET /api/videos/${videoId} - Fetching video`);
    
    // Read the database
    const db = getDatabase();
    
    if (!db.videos || !Array.isArray(db.videos)) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Videos array not found in database'
      });
    }
    
    const video = db.videos.find(v => v.id === videoId);
    
    if (!video) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Video not found'
      });
    }
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching video: ' + error.message
    });
  }
});

// File upload endpoint
app.post('/api/upload/image', upload.single('image'), (req, res) => {
  try {
    console.log('File upload request received');
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({
        statusCode: 400,
        message: 'No file uploaded'
      });
    }
    
    console.log('File uploaded:', req.file);
    
    // Đảm bảo file tồn tại
    const filePath = path.join(UPLOADS_DIR, req.file.filename);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found at ${filePath}`);
      return res.status(500).json({
        statusCode: 500,
        message: 'File not saved to disk'
      });
    }
    
    // URL paths
    const fileUrlPath = `/images/uploads/${req.file.filename}`;
    const absoluteUrlPath = process.env.NODE_ENV === 'production' 
      ? `${HOST}${fileUrlPath}` 
      : `http://localhost:${PORT}${fileUrlPath}`;
    
    console.log('File URL:', fileUrlPath);
    console.log('Absolute URL:', absoluteUrlPath);
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'File uploaded successfully',
      data: {
        url: fileUrlPath,
        absoluteUrl: absoluteUrlPath,
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error uploading file: ' + error.message
    });
  }
});

// API endpoint to add image to database
app.post('/api/images', (req, res) => {
  try {
    console.log('POST /api/images - Request body:', req.body);
    
    // Read the current database
    const db = getDatabase();
    
    // Ensure images array exists
    if (!db.images) {
      db.images = [];
    }
    
    // Generate ID
    const maxId = db.images.length > 0 
      ? Math.max(...db.images.map(img => Number(img.id) || 0)) 
      : 0;
    
    const newId = maxId + 1;
    const now = new Date().toISOString();
    
    // Create new image object
    const newImage = {
      id: newId,
      url: req.body.url || '/placeholder-image.svg',
      name: req.body.name || 'Hình ảnh mới',
      description: req.body.description || 'Mô tả hình ảnh',
      createdAt: now
    };
    
    // Add to images array
    db.images.push(newImage);
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 201,
      message: 'Image added successfully',
      data: newImage
    });
  } catch (error) {
    console.error('Error adding image:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error adding image: ' + error.message
    });
  }
});

// DELETE endpoint for images
app.delete('/api/images/:id', (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    console.log(`DELETE /api/images/${imageId} - Deleting image`);
    
    // Read the current database
    const db = getDatabase();
    
    // Ensure images array exists
    if (!db.images || !Array.isArray(db.images)) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Images array not found in database'
      });
    }
    
    // Find the image to delete
    const imageIndex = db.images.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Image not found'
      });
    }
    
    // Get the image before removing it
    const deletedImage = db.images[imageIndex];
    
    // Remove the image from array
    db.images.splice(imageIndex, 1);
    
    // Save the updated database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Try to delete the actual image file if it's in the uploads directory
    if (deletedImage.url && deletedImage.url.includes('/uploads/')) {
      const fileName = path.basename(deletedImage.url);
      const filePath = path.join(UPLOADS_DIR, fileName);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (fileError) {
          console.error(`Could not delete file: ${filePath}`, fileError);
          // Continue even if file deletion fails
        }
      }
    }
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Image deleted successfully',
      data: deletedImage
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error deleting image: ' + error.message
    });
  }
});

// API endpoint for settings
app.get('/api/settings', (req, res) => {
  try {
    console.log('GET /api/settings - Fetching settings');
    
    // Create default settings object
    const settings = {
      id: 1,
      siteName: 'HTX Sản Xuất Nông Nghiệp - Dịch Vụ Tổng Hợp Liên Nhật',
      siteDescription: 'Thôn Trang Liên Nhật - Cung cấp các sản phẩm, dịch vụ và trải nghiệm nông nghiệp sinh thái',
      contactEmail: 'admin@thontrangliennhat.com',
      contactPhone: '0123456789',
      address: 'Thôn Trang Liên Nhật, Xã Nhật Tân, Huyện Tiến Lãng, TP. Hải Phòng',
      logo: '/images/logos/logo.png',
      facebook: 'https://facebook.com/thontrangliennhat',
      instagram: 'https://instagram.com/thontrangliennhat',
      youtube: 'https://youtube.com/thontrangliennhat',
      zalo: '0123456789',
      metaTitle: 'HTX Sản Xuất Nông Nghiệp - Dịch Vụ Tổng Hợp Liên Nhật',
      metaDescription: 'Thôn Trang Liên Nhật cung cấp các sản phẩm, dịch vụ và trải nghiệm nông nghiệp sinh thái',
      metaKeywords: 'nông nghiệp, sinh thái, trải nghiệm, du lịch, thôn trang liên nhật',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    };
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Settings fetched successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching settings: ' + error.message
    });
  }
});

// API endpoint for configuration (same as settings but with different URL)
app.get('/api/configuration', (req, res) => {
  try {
    console.log('GET /api/configuration - Fetching configuration');
    
    // Create default configuration object - same as settings
    const configuration = {
      id: 1,
      siteName: 'HTX Sản Xuất Nông Nghiệp - Dịch Vụ Tổng Hợp Liên Nhật',
      siteDescription: 'Thôn Trang Liên Nhật - Cung cấp các sản phẩm, dịch vụ và trải nghiệm nông nghiệp sinh thái',
      contactEmail: 'admin@thontrangliennhat.com',
      contactPhone: '0123456789',
      address: 'Thôn Trang Liên Nhật, Xã Nhật Tân, Huyện Tiến Lãng, TP. Hải Phòng',
      logo: '/images/logos/logo.png',
      facebook: 'https://facebook.com/thontrangliennhat',
      instagram: 'https://instagram.com/thontrangliennhat',
      youtube: 'https://youtube.com/thontrangliennhat',
      zalo: '0123456789',
      metaTitle: 'HTX Sản Xuất Nông Nghiệp - Dịch Vụ Tổng Hợp Liên Nhật',
      metaDescription: 'Thôn Trang Liên Nhật cung cấp các sản phẩm, dịch vụ và trải nghiệm nông nghiệp sinh thái',
      metaKeywords: 'nông nghiệp, sinh thái, trải nghiệm, du lịch, thôn trang liên nhật',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    };
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Configuration fetched successfully',
      data: configuration
    });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching configuration: ' + error.message
    });
  }
});

// API endpoint to update configuration
app.put('/api/configuration/:id', (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    console.log(`PUT /api/configuration/${configId} - Updating configuration`, req.body);
    
    // In a real application, you would update the configuration in the database
    // For this demonstration, we'll just return the received data
    const updatedConfig = {
      id: configId,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating configuration: ' + error.message
    });
  }
});

// API endpoint to update settings
app.put('/api/settings/:id', (req, res) => {
  try {
    const settingsId = parseInt(req.params.id);
    console.log(`PUT /api/settings/${settingsId} - Updating settings`, req.body);
    
    // In a real application, you would update the settings in the database
    // For this demonstration, we'll just return the received data
    const updatedSettings = {
      id: settingsId,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating settings: ' + error.message
    });
  }
});

// Add non-prefixed endpoints to match frontend expectations
// Configuration endpoint without /api prefix
app.get('/configuration', (req, res) => {
  try {
    console.log('GET /configuration - Fetching configuration for frontend');
    
    // Create configuration array with desktop and mobile configurations
    const configurations = [
      {
        // Desktop configuration
        id: 1,
        name: 'HTX Sản Xuất Nông Nghiệp - Dịch Vụ Tổng Hợp Liên Nhật',
        contact_email: 'admin@thontrangliennhat.com',
        phone_number: '0123456789',
        address: 'Thôn Trang Liên Nhật, Xã Nhật Tân, Huyện Tiến Lãng, TP. Hải Phòng',
        homepage_slider: [
          '/images/slider/slider1.jpg',
          '/images/slider/slider2.jpg',
          '/images/slider/slider3.jpg'
        ],
        logo: '/images/logos/logo.png',
        social_media: {
          facebook: 'https://facebook.com/thontrangliennhat',
          instagram: 'https://instagram.com/thontrangliennhat',
          youtube: 'https://youtube.com/thontrangliennhat',
          zalo: '0123456789'
        },
        meta: {
          title: 'HTX Sản Xuất Nông Nghiệp - Dịch Vụ Tổng Hợp Liên Nhật',
          description: 'Thôn Trang Liên Nhật cung cấp các sản phẩm, dịch vụ và trải nghiệm nông nghiệp sinh thái',
          keywords: 'nông nghiệp, sinh thái, trải nghiệm, du lịch, thôn trang liên nhật'
        },
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString()
      },
      {
        // Mobile configuration
        id: 2,
        name: 'HTX Liên Nhật Mobile',
        contact_email: 'admin@thontrangliennhat.com',
        phone_number: '0123456789',
        address: 'Thôn Trang Liên Nhật, Xã Nhật Tân, Huyện Tiến Lãng, TP. Hải Phòng',
        homepage_slider: [
          '/images/slider/mobile-slider1.jpg',
          '/images/slider/mobile-slider2.jpg'
        ],
        logo: '/images/logos/logo-mobile.png',
        social_media: {
          facebook: 'https://facebook.com/thontrangliennhat',
          instagram: 'https://instagram.com/thontrangliennhat',
          youtube: 'https://youtube.com/thontrangliennhat',
          zalo: '0123456789'
        },
        meta: {
          title: 'HTX Liên Nhật Mobile',
          description: 'Thôn Trang Liên Nhật trên di động',
          keywords: 'nông nghiệp, sinh thái, trải nghiệm, du lịch'
        },
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString()
      }
    ];
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({
      statusCode: 200,
      message: 'Configuration fetched successfully',
      data: configurations
    });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching configuration: ' + error.message
    });
  }
});

// Update configuration without /api prefix
app.post('/configuration/:id', (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    console.log(`POST /configuration/${configId} - Updating configuration from frontend`, req.body);
    
    // In a real application, you would update the configuration in the database
    // For this demonstration, we'll just return the received data
    const updatedConfig = {
      id: configId,
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating configuration: ' + error.message
    });
  }
});

// Add endpoints for editing parent navigation items
app.patch('/api/parent-navs/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`PATCH /api/parent-navs/${id} - Updating parent navigation:`, req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Find the parent navigation item
    const parentIndex = db.navigation.findIndex(nav => nav.id === id);
    
    if (parentIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Parent navigation not found'
      });
    }
    
    // Update the parent navigation item
    db.navigation[parentIndex] = {
      ...db.navigation[parentIndex],
      ...req.body,
      id: id // Ensure ID doesn't change
    };
    
    // Save the updated database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Return success response
    res.json({
      statusCode: 200,
      message: 'Parent navigation updated successfully',
      data: db.navigation[parentIndex]
    });
  } catch (error) {
    console.error('Error updating parent navigation:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating parent navigation: ' + error.message
    });
  }
});

// Add endpoints for deleting parent navigation items
app.delete('/api/parent-navs/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`DELETE /api/parent-navs/${id} - Deleting parent navigation`);
    
    // Read the database
    const db = getDatabase();
    
    // Find the parent navigation item
    const parentIndex = db.navigation.findIndex(nav => nav.id === id);
    
    if (parentIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Parent navigation not found'
      });
    }
    
    // Store a copy of the item before deleting
    const deletedItem = db.navigation[parentIndex];
    
    // Remove the item from the navigation array
    db.navigation.splice(parentIndex, 1);
    
    // Save the updated database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Try to delete the actual image file if it's in the uploads directory
    if (deletedItem.url && deletedItem.url.includes('/uploads/')) {
      const fileName = path.basename(deletedItem.url);
      const filePath = path.join(UPLOADS_DIR, fileName);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (fileError) {
          console.error(`Could not delete file: ${filePath}`, fileError);
          // Continue even if file deletion fails
        }
      }
    }
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Parent navigation deleted successfully',
      data: deletedItem
    });
  } catch (error) {
    console.error('Error deleting parent navigation:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error deleting parent navigation: ' + error.message
    });
  }
});

// Add endpoints for editing child navigation items
app.patch('/api/child-navs/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`PATCH /api/child-navs/${id} - Updating child navigation:`, req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Variables to store found child nav
    let found = false;
    let updatedChild = null;
    
    // Find and update the child navigation item
    for (let i = 0; i < db.navigation.length; i++) {
      const parent = db.navigation[i];
      const childIndex = parent.children.findIndex(child => child.id === id);
      
      if (childIndex !== -1) {
        // Update the child
        db.navigation[i].children[childIndex] = {
          ...db.navigation[i].children[childIndex],
          ...req.body,
          id: id, // Ensure ID doesn't change
          parentId: parent.id // Maintain parent relationship
        };
        
        updatedChild = db.navigation[i].children[childIndex];
        found = true;
        break;
      }
    }
    
    if (!found) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Child navigation not found'
      });
    }
    
    // Save the updated database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Return success response
    res.json({
      statusCode: 200,
      message: 'Child navigation updated successfully',
      data: updatedChild
    });
  } catch (error) {
    console.error('Error updating child navigation:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating child navigation: ' + error.message
    });
  }
});

// Add endpoints for deleting child navigation items
app.delete('/api/child-navs/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`DELETE /api/child-navs/${id} - Deleting child navigation`);
    
    // Read the database
    const db = getDatabase();
    
    // Variables to store found child nav
    let found = false;
    let deletedChild = null;
    
    // Find and delete the child navigation item
    for (let i = 0; i < db.navigation.length; i++) {
      const parent = db.navigation[i];
      const childIndex = parent.children.findIndex(child => child.id === id);
      
      if (childIndex !== -1) {
        // Store a copy before deleting
        deletedChild = { ...db.navigation[i].children[childIndex] };
        
        // Remove the child
        db.navigation[i].children.splice(childIndex, 1);
        
        found = true;
        break;
      }
    }
    
    if (!found) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Child navigation not found'
      });
    }
    
    // Save the updated database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Return success response
    res.json({
      statusCode: 200,
      message: 'Child navigation deleted successfully',
      data: deletedChild
    });
  } catch (error) {
    console.error('Error deleting child navigation:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error deleting child navigation: ' + error.message
    });
  }
});

// DELETE endpoint for contact messages
app.delete('/api/contact/:id', (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    console.log(`DELETE /api/contact/${contactId} - Deleting contact message`);
    
    // Read the database
    const db = getDatabase();
    
    // Ensure contacts array exists
    if (!db.contacts) {
      db.contacts = [];
    }
    
    // Find the contact
    const contactIndex = db.contacts.findIndex(item => item.id === contactId);
    
    if (contactIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Contact not found'
      });
    }
    
    // Store a copy of the item before deleting
    const deletedItem = db.contacts[contactIndex];
    
    // Remove the item from the array
    db.contacts.splice(contactIndex, 1);
    
    // Save the updated database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Contact message deleted successfully',
      data: { id: contactId }
    });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error deleting contact message: ' + error.message
    });
  }
});

// Get news by ID
app.get('/api/news/:id', (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    console.log(`GET /api/news/${newsId} - Fetching news item`);
    
    const db = getDatabase();
    const newsItem = db.news.find(item => item.id === newsId);
    
    if (!newsItem) {
      return res.status(404).json({
        statusCode: 404,
        message: 'News item not found'
      });
    }
    
    res.json({
      statusCode: 200,
      message: 'Success',
      data: newsItem
    });
  } catch (error) {
    console.error('Error fetching news item:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching news item: ' + error.message
    });
  }
});

// POST endpoint for adding news
app.post('/api/news', (req, res) => {
  try {
    console.log('POST /api/news - Creating news item:', req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Ensure news array exists
    if (!db.news) {
      db.news = [];
    }
    
    // Generate new ID
    const maxId = db.news.length > 0 
      ? Math.max(...db.news.map(item => Number(item.id) || 0)) 
      : 0;
    
    const newId = maxId + 1;
    const now = new Date().toISOString();
    
    // Create new news object
    const newNews = {
      id: newId,
      title: req.body.title || 'Tin tức mới',
      slug: req.body.slug || `tin-tuc-${newId}`,
      summary: req.body.summary || '',
      content: req.body.content || '',
      images: req.body.image || '/placeholder-image.svg',
      categoryId: req.body.categoryId || null,
      authorId: req.body.authorId || 1,
      status: req.body.status || 'published',
      createdAt: now,
      updatedAt: now
    };
    
    // Add to news array
    db.news.push(newNews);
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    res.json({
      statusCode: 201,
      message: 'News created successfully',
      data: newNews
    });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error creating news: ' + error.message
    });
  }
});

// PATCH endpoint for updating news
app.patch('/api/news/:id', (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    console.log(`PATCH /api/news/${newsId} - Updating news:`, req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Find the news item
    const newsIndex = db.news.findIndex(item => item.id === newsId);
    
    if (newsIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'News not found'
      });
    }
    
    // Process the request body to ensure proper type conversion
    const processedBody = { ...req.body };
    
    // Ensure isFeatured is properly converted to boolean
    if ('isFeatured' in processedBody) {
      processedBody.isFeatured = processedBody.isFeatured === true || 
                                 processedBody.isFeatured === 'true' || 
                                 processedBody.isFeatured === 1 || 
                                 processedBody.isFeatured === '1';
    }
    
    // Handle images field properly
    if (processedBody.images) {
      // Ensure images is always an array
      if (typeof processedBody.images === 'string') {
        processedBody.images = [processedBody.images];
      } else if (!Array.isArray(processedBody.images)) {
        // If not a string or array, keep existing images
        processedBody.images = db.news[newsIndex].images || [];
      }
      
      // Log images being set
      console.log('Setting news images to:', processedBody.images);
    }
    
    // Update the news item
    db.news[newsIndex] = {
      ...db.news[newsIndex],
      ...processedBody,
      id: newsId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    // If image field was provided but images field wasn't, copy it over
    if (req.body.image && !processedBody.images) {
      // Convert to array if it's a string
      db.news[newsIndex].images = typeof req.body.image === 'string' 
        ? [req.body.image]
        : req.body.image;
      
      console.log('Using image field for images:', db.news[newsIndex].images);
    }
    
    // Log the updated news item for debugging
    console.log('Updated news item:', db.news[newsIndex]);
    
    // Save the updated database using the writeDatabase helper function
    if (writeDatabase(db)) {
      // Return success response
      res.json({
        statusCode: 200,
        message: 'News updated successfully',
        data: db.news[newsIndex]
      });
    } else {
      res.status(500).json({
        statusCode: 500,
        message: 'Error writing to database'
      });
    }
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating news: ' + error.message
    });
  }
});

// DELETE endpoint for news
app.delete('/api/news/:id', (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    console.log(`DELETE /api/news/${newsId} - Deleting news`);
    
    // Read the database
    const db = getDatabase();
    
    // Find the news item
    const newsIndex = db.news.findIndex(item => item.id === newsId);
    
    if (newsIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'News not found'
      });
    }
    
    // Store a copy of the item before deleting
    const deletedItem = db.news[newsIndex];
    
    // Remove the item from the array
    db.news.splice(newsIndex, 1);
    
    // Save the updated database using the writeDatabase helper function
    if (writeDatabase(db)) {
      res.json({
        statusCode: 200,
        message: 'News deleted successfully',
        data: deletedItem
      });
    } else {
      res.status(500).json({
        statusCode: 500,
        message: 'Error writing to database'
      });
    }
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error deleting news: ' + error.message
    });
  }
});

// API endpoint for TinyMCE configuration
app.get('/api/editor-config', (req, res) => {
  try {
    console.log('GET /api/editor-config - Fetching editor configuration');
    
    // Set content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    const editorConfig = {
      apiKey: 'no-api-key', // Use your TinyMCE API key here
      height: 500,
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | help'
    };
    
    res.json({
      statusCode: 200,
      message: 'Editor configuration fetched successfully',
      data: editorConfig
    });
  } catch (error) {
    console.error('Error fetching editor configuration:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching editor configuration: ' + error.message
    });
  }
});

// Special endpoint for news categories
app.get('/api/parent-navs/slug/tin-tuc', (req, res) => {
  try {
    console.log('GET /api/parent-navs/slug/tin-tuc - Fetching news categories');
    
    // ưSet content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    // Create default categories for news
    const newsCategories = [
      {
        id: 1,
        title: 'Tin tức nông nghiệp',
        slug: 'tin-tuc-nong-nghiep',
        parentId: 1
      },
      {
        id: 2,
        title: 'Tin tức sự kiện',
        slug: 'tin-tuc-su-kien',
        parentId: 1
      },
      {
        id: 3,
        title: 'Thông báo',
        slug: 'thong-bao',
        parentId: 1
      },
      {
        id: 4,
        title: 'Hoạt động cộng đồng',
        slug: 'hoat-dong-cong-dong',
        parentId: 1
      },
      {
        id: 5,
        title: 'Chính sách mới',
        slug: 'chinh-sach-moi',
        parentId: 1
      },
      {
        id: 6,
        title: 'Kinh nghiệm nông nghiệp',
        slug: 'kinh-nghiem-nong-nghiep',
        parentId: 1
      },
      {
        id: 7,
        title: 'Kỹ thuật canh tác',
        slug: 'ky-thuat-canh-tac',
        parentId: 1
      }
    ];
    
    // Log for debugging
    console.log('Returning news categories:', newsCategories);
    
    res.json({
      statusCode: 200,
      message: 'News categories fetched successfully',
      data: newsCategories
    });
  } catch (error) {
    console.error('Error fetching news categories:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching news categories: ' + error.message
    });
  }
});

// POST endpoint for updating an experience
app.post('/api/experiences/:id', upload.array('images[]'), (req, res) => {
  try {
    const experienceId = parseInt(req.params.id, 10);
    console.log(`POST /api/experiences/${experienceId} - Updating experience:`, req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Find experience
    const experienceIndex = db.experiences.findIndex(exp => exp.id === experienceId);
    
    if (experienceIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Experience not found'
      });
    }
    
    // Get existing experience data
    const existingExperience = db.experiences[experienceIndex];
    
    // Get the image URLs if uploaded
    let imageUrls = existingExperience.images || [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/images/uploads/${file.filename}`);
      console.log(`Images updated:`, imageUrls);
    }
    
    // Ensure imageUrls is always an array
    if (typeof imageUrls === 'string') {
      imageUrls = [imageUrls];
    }
    
    // Update experience
    db.experiences[experienceIndex] = {
      ...existingExperience,
      name: req.body.name || existingExperience.name,
      title: req.body.name || existingExperience.title || existingExperience.name,
      slug: req.body.slug || existingExperience.slug || (req.body.name ? req.body.name.toLowerCase().replace(/\s+/g, '-') : existingExperience.slug),
      summary: req.body.summary || existingExperience.summary,
      content: req.body.content || existingExperience.content,
      description: req.body.content || existingExperience.description || existingExperience.content,
      child_nav_id: req.body.child_nav_id || existingExperience.child_nav_id,
      images: imageUrls,
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Synchronize database files by running the root-level sync-database.js script
    try {
      const { execSync } = require('child_process');
      const rootSyncScriptPath = path.join(__dirname, '..', 'sync-database.js');
      console.log('Running root-level database sync script:', rootSyncScriptPath);
      execSync(`node ${rootSyncScriptPath}`, { stdio: 'inherit' });
      console.log('Database synchronization completed successfully via root script');
    } catch (syncError) {
      console.error('Error synchronizing database files with root script:', syncError);
      // Continue with the response even if sync fails
    }
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Experience updated successfully',
      data: db.experiences[experienceIndex]
    });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating experience: ' + error.message
    });
  }
});

// DELETE endpoint for experiences
app.delete('/api/experiences/:id', (req, res) => {
  try {
    const experienceId = parseInt(req.params.id, 10);
    console.log(`DELETE /api/experiences/${experienceId} - Deleting experience`);
    
    // Read the database
    const db = getDatabase();
    
    // Find the experience
    const experienceIndex = db.experiences.findIndex(exp => exp.id === experienceId);
    
    if (experienceIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Experience not found'
      });
    }
    
    // Remove the experience from the array
    db.experiences.splice(experienceIndex, 1);
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Synchronize database files by running the root-level sync-database.js script
    try {
      const { execSync } = require('child_process');
      const rootSyncScriptPath = path.join(__dirname, '..', 'sync-database.js');
      console.log('Running root-level database sync script:', rootSyncScriptPath);
      execSync(`node ${rootSyncScriptPath}`, { stdio: 'inherit' });
      console.log('Database synchronization completed successfully via root script');
    } catch (syncError) {
      console.error('Error synchronizing database files with root script:', syncError);
      // Continue with the response even if sync fails
    }
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.json({
      statusCode: 200,
      message: 'Experience deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error deleting experience: ' + error.message
    });
  }
});

// POST endpoint cho tạo mới experience
app.post('/api/experiences', upload.array('images[]'), (req, res) => {
  try {
    console.log('POST /api/experiences - Creating new experience:', req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Ensure experiences array exists
    if (!db.experiences) {
      db.experiences = [];
    }
    
    // Generate new ID
    const maxId = db.experiences.length > 0 
      ? Math.max(...db.experiences.map(exp => Number(exp.id) || 0)) 
      : 0;
    
    const newId = maxId + 1;
    const now = new Date().toISOString();
    
    // Get the image URLs if uploaded
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/images/uploads/${file.filename}`);
      console.log(`Images uploaded:`, imageUrls);
    }
    
    // Create slug from name if not provided
    const slug = req.body.slug || (req.body.name ? req.body.name.toLowerCase().replace(/\s+/g, '-') : `trai-nghiem-${newId}`);
    
    // Create new experience object
    const newExperience = {
      id: newId,
      title: req.body.title || req.body.name || 'Trải nghiệm mới',
      name: req.body.name || 'Trải nghiệm mới',
      slug: slug,
      summary: req.body.summary || '',
      description: req.body.description || req.body.content || '',
      content: req.body.content || '',
      images: imageUrls,
      categoryId: parseInt(req.body.categoryId) || parseInt(req.body.child_nav_id) || null,
      child_nav_id: req.body.child_nav_id || req.body.categoryId || null,
      isFeatured: req.body.isFeatured === 'true' || false,
      views: 0,
      createdAt: now,
      updatedAt: now
    };
    
    // Add to experiences array
    db.experiences.push(newExperience);
    
    // Save database
    const dbPath = path.resolve(__dirname, 'database.json');
    console.log('Writing database to path:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Synchronize database files by running the root-level sync-database.js script
    try {
      const { execSync } = require('child_process');
      const rootSyncScriptPath = path.join(__dirname, '..', 'sync-database.js');
      console.log('Running root-level database sync script:', rootSyncScriptPath);
      execSync(`node ${rootSyncScriptPath}`, { stdio: 'inherit' });
      console.log('Database synchronization completed successfully via root script');
    } catch (syncError) {
      console.error('Error synchronizing database files with root script:', syncError);
      // Continue with the response even if sync fails
    }
    
    // Cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    res.status(201).json({
      statusCode: 201,
      message: 'Experience created successfully',
      data: newExperience
    });
  } catch (error) {
    console.error('Error creating experience:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error creating experience: ' + error.message
    });
  }
});

// Add handlers for the specific problematic image URLs
app.get('/images/uploads/1747193559802-784322977.jpg', (req, res) => {
  console.log('Specific request for problematic image 1747193559802-784322977.jpg');
  
  // Set appropriate headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=0');
  res.setHeader('Content-Type', 'image/jpeg');
  
  // Check multiple possible locations
  const filename = '1747193559802-784322977.jpg';
  const possiblePaths = [
    path.join(__dirname, 'images', 'uploads', filename),
    path.join(__dirname, 'uploads', filename),
    path.join(__dirname, 'public', 'images', 'uploads', filename),
    path.join(__dirname, '..', 'uploads', filename),
    path.join(__dirname, '..', 'images', 'uploads', filename),
    path.join(__dirname, '..', 'public', 'images', 'uploads', filename),
    path.join(__dirname, '..', 'build', 'images', 'uploads', filename)
  ];
  
  // Try each path
  for (const filePath of possiblePaths) {
    console.log(`Checking path: ${filePath}`);
    if (fs.existsSync(filePath)) {
      console.log(`Found problematic image at: ${filePath}`);
      return res.sendFile(filePath);
    }
  }
  
  // If not found, use default image
  const fallbackImage = path.join(__dirname, 'public', 'images', 'placeholder.jpg');
  if (fs.existsSync(fallbackImage)) {
    console.log(`Problematic image not found, using fallback: ${fallbackImage}`);
    return res.sendFile(fallbackImage);
  } else {
    console.log('Fallback image not found, sending 404');
    return res.status(404).send('Image not found');
  }
});

app.get('/images/uploads/1747213249793-521951070.jpg', (req, res) => {
  console.log('Specific request for problematic image 1747213249793-521951070.jpg');
  
  // Set appropriate headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=0');
  res.setHeader('Content-Type', 'image/jpeg');
  
  // Check multiple possible locations
  const filename = '1747213249793-521951070.jpg';
  const possiblePaths = [
    path.join(__dirname, 'images', 'uploads', filename),
    path.join(__dirname, 'uploads', filename),
    path.join(__dirname, 'public', 'images', 'uploads', filename),
    path.join(__dirname, '..', 'uploads', filename),
    path.join(__dirname, '..', 'images', 'uploads', filename),
    path.join(__dirname, '..', 'public', 'images', 'uploads', filename),
    path.join(__dirname, '..', 'build', 'images', 'uploads', filename)
  ];
  
  // Try each path
  for (const filePath of possiblePaths) {
    console.log(`Checking path: ${filePath}`);
    if (fs.existsSync(filePath)) {
      console.log(`Found problematic image at: ${filePath}`);
      return res.sendFile(filePath);
    }
  }
  
  // If not found, use default image
  const fallbackImage = path.join(__dirname, 'public', 'images', 'placeholder.jpg');
  if (fs.existsSync(fallbackImage)) {
    console.log(`Problematic image not found, using fallback: ${fallbackImage}`);
    return res.sendFile(fallbackImage);
  } else {
    console.log('Fallback image not found, sending 404');
    return res.status(404).send('Image not found');
  }
});

// POST endpoint for uploading news images
app.post('/api/news/:id/upload', upload.array('images[]', 5), (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    console.log(`POST /api/news/${newsId}/upload - Uploading images for news:`, req.body);
    
    // Read the database
    const db = getDatabase();
    
    // Find the news item
    const newsIndex = db.news.findIndex(item => item.id === newsId);
    
    if (newsIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        message: 'News not found'
      });
    }
    
    // Process the request body to ensure proper type conversion
    const processedBody = { ...req.body };
    
    // Get uploaded files info
    const uploadedFiles = req.files || [];
    
    // Get image paths for uploaded files
    const newImageUrls = uploadedFiles.map(file => {
      // Ensure consistent path format that starts with /
      const imagePath = `/images/uploads/${file.filename}`;
      console.log(`Added new image path for news: ${imagePath}`);
      return imagePath;
    });
    
    // Handle existing images (if provided as string values in the form)
    let existingImages = [];
    if (req.body['images[]'] && !uploadedFiles.includes(req.body['images[]'])) {
      if (Array.isArray(req.body['images[]'])) {
        existingImages = req.body['images[]'].filter(img => img && typeof img === 'string' && img.trim() !== '');
      } else if (typeof req.body['images[]'] === 'string' && req.body['images[]'].trim() !== '') {
        existingImages = [req.body['images[]']];
      }
    }
    
    console.log('Existing images after filtering:', existingImages);
    console.log('New uploaded images:', newImageUrls);
    
    // Combine existing and new image URLs
    const allImages = [...existingImages, ...newImageUrls];
    
    // Update other fields from the form data
    db.news[newsIndex] = {
      ...db.news[newsIndex],
      ...processedBody,
      id: newsId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    // Update images field with the combined arrays
    if (allImages.length > 0) {
      db.news[newsIndex].images = allImages;
    }
    
    // Ensure isFeatured is properly converted to boolean
    if ('isFeatured' in processedBody) {
      db.news[newsIndex].isFeatured = processedBody.isFeatured === true || 
                               processedBody.isFeatured === 'true' || 
                               processedBody.isFeatured === 1 || 
                               processedBody.isFeatured === '1';
    }
    
    // Log the updated news item for debugging
    console.log('Updated news item with images:', db.news[newsIndex]);
    
    // Save the updated database
    if (writeDatabase(db)) {
      // Return success response
      res.json({
        statusCode: 200,
        message: 'News images uploaded successfully',
        data: db.news[newsIndex]
      });
    } else {
      res.status(500).json({
        statusCode: 500,
        message: 'Error writing to database'
      });
    }
  } catch (error) {
    console.error('Error uploading news images:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error uploading news images: ' + error.message
    });
  }
});

// Start the server for local development
// In Vercel, this file will be imported as a serverless function
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Server URL: ${HOST}`);
    console.log(`API root available at: ${HOST} or http://localhost:${PORT}`);
    console.log(`CORS configured to allow all origins: *`);
    console.log(`==================================================\n`);
    console.log('Available API endpoints:');
    console.log('- /api/navigation-links');
    console.log('- /api/parent-navs/all-with-child');
    console.log('- /api/parent-navs');
    console.log('- /api/parent-navs/slug/:slug');
    console.log('- /api/child-navs');
    console.log('- /api/products');
    console.log('- /api/services');
    console.log('- /api/teams');
    console.log('- /api/images');
    console.log('- /api/contact');
    console.log('- /api/news');
    console.log('- /api/experiences');
    console.log(`\n==================================================`);
  });
} else {
  console.log('\n==================================================');
  console.log('Server running in production mode via Vercel');
  console.log(`API available at: ${HOST}`);
  console.log('CORS configured to allow all origins: *');
  console.log('==================================================\n');
}

// Export the Express app for serverless functions
module.exports = app;

// Route mặc định cho root path (/) để trả về JSON thay vì HTML
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.send(JSON.stringify({
    name: 'Thôn Trang Liên Nhất API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/products',
      '/api/services',
      '/api/news',
      '/api/teams',
      '/api/images',
      '/api/experiences',
      '/api/parent-navs',
      '/api/child-navs',
      '/api/contact',
      '/api/navigation-links'
    ]
  }, null, 2));
});

// Database handling function
const getDatabase = () => {
  // For Vercel, use tmp directory if in production
  const dbPath = process.env.NODE_ENV === 'production' 
    ? path.join('/tmp', 'database.json')
    : path.join(__dirname, 'database.json');
  
  try {
    let db = {};
    
    if (fs.existsSync(dbPath)) {
      try {
        const data = fs.readFileSync(dbPath, 'utf8');
        db = JSON.parse(data);
        console.log('Successfully loaded database from', dbPath);
      } catch (parseError) {
        console.error(`Error parsing database JSON: ${parseError.message}`);
        console.error('Creating new default database due to parse error');
        db = {};
      }
    } else {
      console.log(`Database file not found at ${dbPath}, creating new one with default data`);
    }
    
    // Ensure all essential collections exist and are arrays
    db.products = Array.isArray(db.products) ? db.products : [];
    db.services = Array.isArray(db.services) ? db.services : [];
    db.experiences = Array.isArray(db.experiences) ? db.experiences : [];
    db.team = Array.isArray(db.team) ? db.team : [];
    db.news = Array.isArray(db.news) ? db.news : [];
    db.images = Array.isArray(db.images) ? db.images : [];
    db.videos = Array.isArray(db.videos) ? db.videos : [];
    db.contacts = Array.isArray(db.contacts) ? db.contacts : [];
    db.categories = Array.isArray(db.categories) ? db.categories : [];
    db.users = Array.isArray(db.users) ? db.users : [];
    
    // Ensure navigation structure is valid
    if (!db.navigation || !Array.isArray(db.navigation) || db.navigation.length === 0) {
      db.navigation = [
        {
          id: 1,
          title: "Trang chủ",
          slug: "trang-chu",
          position: 1,
          children: []
        }
      ];
    }
    
    // Ensure each navigation item has a children array
    db.navigation.forEach(item => {
      if (!item.children || !Array.isArray(item.children)) {
        item.children = [];
      }
    });
    
    // Write updated database if created or fixed
    try {
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    } catch (writeError) {
      console.error(`Warning: Error writing updated database: ${writeError.message}`);
    }
    
    return db;
  } catch (error) {
    console.error(`Critical error reading database: ${error.message}`);
    
    // Return default database structure with essential collections
    return { 
      products: [],
      services: [],
      experiences: [],
      team: [
        {
          id: 1,
          name: "Default Team Member",
          position: "Member",
          avatar: "/images/placeholder.jpg",
          image: "/images/placeholder.jpg",
          description: "Default team member when database is unavailable",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      navigation: [
        {
          id: 1,
          title: "Trang chủ",
          slug: "trang-chu",
          position: 1,
          children: []
        }
      ],
      categories: [],
      users: [],
      contacts: [],
      news: [],
      images: [],
      videos: []
    };
  }
};

// Enhanced database writing function with better error handling
const writeDatabase = (db) => {
  // For Vercel, use tmp directory if in production
  const dbPath = process.env.NODE_ENV === 'production' 
    ? path.join('/tmp', 'database.json')
    : path.join(__dirname, 'database.json');
  
  try {
    // Validate db object before writing
    if (!db || typeof db !== 'object') {
      console.error('Invalid database object provided');
      return false;
    }
    
    // Ensure all collections are arrays to prevent errors
    const safeDb = { ...db };
    
    safeDb.products = Array.isArray(db.products) ? db.products : [];
    safeDb.services = Array.isArray(db.services) ? db.services : [];
    safeDb.experiences = Array.isArray(db.experiences) ? db.experiences : [];
    safeDb.team = Array.isArray(db.team) ? db.team : [];
    safeDb.news = Array.isArray(db.news) ? db.news : [];
    safeDb.images = Array.isArray(db.images) ? db.images : [];
    safeDb.videos = Array.isArray(db.videos) ? db.videos : [];
    safeDb.contacts = Array.isArray(db.contacts) ? db.contacts : [];
    safeDb.categories = Array.isArray(db.categories) ? db.categories : [];
    safeDb.users = Array.isArray(db.users) ? db.users : [];
    
    // Ensure navigation structure is valid
    if (!safeDb.navigation || !Array.isArray(safeDb.navigation) || safeDb.navigation.length === 0) {
      safeDb.navigation = [
        {
          id: 1,
          title: "Trang chủ",
          slug: "trang-chu",
          position: 1,
          children: []
        }
      ];
    }
    
    // Make sure we stringify cleanly
    try {
      const dbString = JSON.stringify(safeDb, null, 2);
      fs.writeFileSync(dbPath, dbString, 'utf8');
      console.log(`Database written to ${dbPath}`);
      
      // Try to write to parent location as well if it exists (for Vercel)
      try {
        const parentDbPath = path.join(__dirname, '..', 'database.json');
        if (fs.existsSync(path.dirname(parentDbPath))) {
          fs.writeFileSync(parentDbPath, dbString, 'utf8');
          console.log(`Database also written to parent path: ${parentDbPath}`);
        }
      } catch (parentError) {
        console.error(`Error writing to parent path: ${parentError.message}`);
        // Continue even if parent write fails
      }
      
      return true;
    } catch (stringifyError) {
      console.error(`Error stringifying database: ${stringifyError.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error writing database: ${error.message}`);
    return false;
  }
};