/**
 * Image Proxy Middleware
 * 
 * This file provides middleware to handle image requests,
 * particularly fixing connection refused errors
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

// Create the router
const imageRouter = express.Router();

// Create base64 placeholder image for fallbacks
const createPlaceholderImage = () => {
  return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RjM2M0UyRTcyMjg0MTFFQTk0RTFEOTE2ODA1MDVCOTIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RjM2M0UyRTgyMjg0MTFFQTk0RTFEOTE2ODA1MDVCOTIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpGMzYzRTJFNTIyODQxMUVBOTRFMUQ5MTY4MDUwNUI5MiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpGMzYzRTJFNjIyODQxMUVBOTRFMUQ5MTY4MDUwNUI5MiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv/r/N8AAAGUSURBVHja7NxbbsIwEIVhQ9WldeEld9m92l1Cq16Ax/FtJh6DIX/Or6q2Gk6+HMzDarPZBHZq/QXggSUILEFgCQJL4LEqsXu/3//tbJpmPLrP86zHt9vt+Xl8PZ/PjUFgfTnO7XY7Ho/TLLfb7fl8PqyXy2VgmSF535/P5/F49C/jWMaamWdiWel55MPh4IvIG2/WyyqxrFTm1o5yPVYqc3lkkdPFqbGKnL8RSy/yEVfHCjz8lkCzZiLqf/mgvpVlu8SyshMFr7WGTJ9XYLW7mDp9yuqD9d0B1teR/WnRs6yV0exdydv2NLBy3xBYZbA+f8cLq9oUeGyWifVPr+Sx9D9Y5bHe3+TDqiQsveRhYcmCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLFhvsBwtA6vYWX52UrO2PUQ/un53VO0rZ0sW37T7/Lggk9XkXj9Y75yr5+sm9YGvzGq+j66zlD//JGJIst95mYvl2qhY9sxcmS2r/lZzNXJYWGUuq76tYPVgaWr5IcAAIEYEeia0BurAAAAASUVORK5CYII=', 'base64');
};

// Create placeholder image for default fallback
const placeholderImage = createPlaceholderImage();

// Set CORS headers for all image responses
imageRouter.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cache-Control', 'public, max-age=86400'); // 24 hours
  
  // Check if this is a preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Define possible image search paths
const getImageSearchPaths = (imageName) => {
  return [
    path.join(process.cwd(), 'images', imageName),
    path.join(process.cwd(), 'public', 'images', imageName),
    path.join(process.cwd(), 'uploads', imageName),
    path.join(process.cwd(), 'public', 'uploads', imageName),
    path.join(process.cwd(), 'images', 'uploads', imageName),
    path.join(process.cwd(), 'public', 'images', 'uploads', imageName),
    path.join('/tmp', 'uploads', imageName)
  ];
};

// Handle all image requests
imageRouter.get('*', (req, res) => {
  // Extract the image filename from the path
  const imageName = req.path.split('/').pop();
  
  // Get content type based on file extension
  const getContentType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon'
    };
    return contentTypes[ext] || 'application/octet-stream';
  };
  
  // Get all possible paths for this image
  const searchPaths = getImageSearchPaths(imageName);
  
  // Try to find the image in any of the possible paths
  let imagePath = null;
  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      imagePath = searchPath;
      break;
    }
  }
  
  // If image found, send it
  if (imagePath) {
    const contentType = getContentType(imagePath);
    res.header('Content-Type', contentType);
    return res.sendFile(imagePath);
  }
  
  // If not found, try to use a default placeholder with the same name
  const defaultImages = [
    'default.jpg',
    'placeholder.jpg',
    'default-image.jpg'
  ];
  
  // Search for any default image
  for (const defaultImage of defaultImages) {
    const defaultPaths = getImageSearchPaths(defaultImage);
    for (const defaultPath of defaultPaths) {
      if (fs.existsSync(defaultPath)) {
        console.log(`Using default image for ${imageName}: ${defaultPath}`);
        const contentType = getContentType(defaultPath);
        res.header('Content-Type', contentType);
        return res.sendFile(defaultPath);
      }
    }
  }
  
  // If no default image found, send a generated placeholder
  console.log(`Using generated placeholder for ${imageName}`);
  res.header('Content-Type', 'image/png');
  return res.send(placeholderImage);
});

module.exports = imageRouter; 