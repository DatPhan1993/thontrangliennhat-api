const fs = require('fs');
const path = require('path');

// Generate a placeholder image as a colored square
const createPlaceholderImage = () => {
  // Base64 encoded small placeholder image (a colored rectangle)
  return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RjM2M0UyRTcyMjg0MTFFQTk0RTFEOTE2ODA1MDVCOTIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RjM2M0UyRTgyMjg0MTFFQTk0RTFEOTE2ODA1MDVCOTIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpGMzYzRTJFNTIyODQxMUVBOTRFMUQ5MTY4MDUwNUI5MiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpGMzYzRTJFNjIyODQxMUVBOTRFMUQ5MTY4MDUwNUI5MiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv/r/N8AAAGUSURBVHja7NxbbsIwEIVhQ9WldeEld9m92l1Cq16Ax/FtJh6DIX/Or6q2Gk6+HMzDarPZBHZq/QXggSUILEFgCQJL4LEqsXu/3//tbJpmPLrP86zHt9vt+Xl8PZ/PjUFgfTnO7XY7Ho/TLLfb7fl8PqyXy2VgmSF535/P5/F49C/jWMaamWdiWel55MPh4IvIG2/WyyqxrFTm1o5yPVYqc3lkkdPFqbGKnL8RSy/yEVfHCjz8lkCzZiLqf/mgvpVlu8SyshMFr7WGTJ9XYLW7mDp9yuqD9d0B1teR/WnRs6yV0exdydv2NLBy3xBYZbA+f8cLq9oUeGyWifVPr+Sx9D9Y5bHe3+TDqiQsveRhYcmCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLFhvsBwtA6vYWX52UrO2PUQ/un53VO0rZ0sW37T7/Lggk9XkXj9Y75yr5+sm9YGvzGq+j66zlD//JGJIst95mYvl2qhY9sxcmS2r/lZzNXJYWGUuq76tYPVgaWr5IcAAIEYEeia0BurAAAAASUVORK5CYII=', 'base64');
};

// Create required directories
const createDirectories = () => {
  const directories = [
    'images',
    'images/uploads',
    'images/products',
    'uploads',
    'public/images',
    'public/images/uploads',
    'public/images/products',
    'public/uploads'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory: ${dirPath}`);
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (error) {
        console.error(`Error creating directory ${dirPath}:`, error);
      }
    } else {
      console.log(`Directory already exists: ${dirPath}`);
    }
  });
};

// Create placeholder images in all directories
const createImages = () => {
  // Common image names that might be requested
  const imageNames = [
    'placeholder.jpg',
    'placeholder.png',
    'default-news.jpg',
    'default-product.jpg',
    'default-service.jpg',
    'default-team.jpg',
    'default-avatar.jpg',
    'default.jpg',
    'logo.png'
  ];
  
  // Directories where we'll create the placeholder images
  const imageDirectories = [
    'images',
    'images/uploads',
    'public/images',
    'public/images/uploads'
  ];
  
  // Generate a placeholder image
  const placeholderData = createPlaceholderImage();
  
  // Create all placeholder images
  imageDirectories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    
    // Ensure the directory exists
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory for images: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Create each placeholder image
    imageNames.forEach(imageName => {
      const imagePath = path.join(dirPath, imageName);
      if (!fs.existsSync(imagePath)) {
        console.log(`Creating placeholder image: ${imagePath}`);
        try {
          fs.writeFileSync(imagePath, placeholderData);
        } catch (error) {
          console.error(`Error creating image ${imagePath}:`, error);
        }
      } else {
        console.log(`Image already exists: ${imagePath}`);
      }
    });
  });
};

// Run the script
console.log('Starting image fix script...');
createDirectories();
createImages();
console.log('Image fix script completed.'); 