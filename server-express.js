const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper để đọc dữ liệu từ file database.json
const getDatabase = () => {
  const rawData = fs.readFileSync('./database.json');
  return JSON.parse(rawData);
};

// API endpoint cho navigation
app.get('/api/parent-navs/all-with-child', (req, res) => {
  const db = getDatabase();
  res.json({
    statusCode: 200,
    message: 'Success',
    data: db.navigation
  });
});

app.get('/api/navigation-links', (req, res) => {
  const db = getDatabase();
  res.json(db.navigation);
});

app.get('/api/parent-navs', (req, res) => {
  const db = getDatabase();
  const parentNavs = db.navigation.map(item => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    position: item.position
  }));
  
  res.json({
    statusCode: 200,
    message: 'Success',
    data: parentNavs
  });
});

app.get('/api/child-navs', (req, res) => {
  const db = getDatabase();
  let allChildren = [];
  
  db.navigation.forEach(parent => {
    allChildren = [...allChildren, ...parent.children.map(child => ({
      ...child,
      parentId: parent.id
    }))];
  });
  
  res.json({
    statusCode: 200,
    message: 'Success',
    data: allChildren
  });
});

// API endpoint cho users
app.get('/api/users', (req, res) => {
  const db = getDatabase();
  res.json(db.users);
});

// API endpoint cho products
app.get('/api/products', (req, res) => {
  const db = getDatabase();
  res.json(db.products);
});

// API endpoint cho services
app.get('/api/services', (req, res) => {
  const db = getDatabase();
  res.json(db.services);
});

// API endpoint cho experiences
app.get('/api/experiences', (req, res) => {
  const db = getDatabase();
  res.json(db.experiences);
});

// API endpoint cho news
app.get('/api/news', (req, res) => {
  const db = getDatabase();
  res.json(db.news);
});

// API endpoint cho team
app.get('/api/team', (req, res) => {
  const db = getDatabase();
  res.json(db.team);
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
  
  if (user && password === 'password') {
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

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  console.log('Các endpoint API có sẵn:');
  console.log('- http://localhost:' + PORT + '/api/navigation-links');
  console.log('- http://localhost:' + PORT + '/api/parent-navs/all-with-child');
  console.log('- http://localhost:' + PORT + '/api/parent-navs');
  console.log('- http://localhost:' + PORT + '/api/child-navs');
  console.log('- http://localhost:' + PORT + '/api/products');
}); 