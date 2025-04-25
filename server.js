const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

// Sample data - embedded directly instead of reading from database.json
const navigationData = [
  {
    "id": 1,
    "title": "Trang chủ",
    "slug": "/",
    "position": 1,
    "children": []
  },
  {
    "id": 2,
    "title": "Giới thiệu",
    "slug": "/gioi-thieu",
    "position": 2,
    "children": [
      {
        "id": 1,
        "title": "Lịch sử hình thành",
        "slug": "/gioi-thieu/lich-su-hinh-thanh",
        "position": 1
      },
      {
        "id": 2,
        "title": "Sơ đồ tổ chức",
        "slug": "/gioi-thieu/so-do-to-chuc",
        "position": 2
      }
    ]
  },
  {
    "id": 3,
    "title": "Tin tức",
    "slug": "/tin-tuc",
    "position": 3,
    "children": []
  },
  {
    "id": 4,
    "title": "Sản phẩm",
    "slug": "/san-pham",
    "position": 4,
    "children": []
  },
  {
    "id": 5,
    "title": "Dịch vụ",
    "slug": "/dich-vu",
    "position": 5,
    "children": []
  },
  {
    "id": 6,
    "title": "Liên hệ",
    "slug": "/lien-he",
    "position": 6,
    "children": []
  }
];

const productsData = [
  {
    "id": 1,
    "name": "Cà phê Buôn Đôn",
    "slug": "ca-phe-buon-don",
    "price": 120000,
    "salePrice": 100000,
    "image": "/images/products/coffee-1.jpg",
    "category": "coffee",
    "description": "Cà phê Arabica đặc sản của Buôn Đôn, thu hoạch và chế biến thủ công."
  },
  {
    "id": 2,
    "name": "Mật ong rừng",
    "slug": "mat-ong-rung",
    "price": 350000,
    "image": "/images/products/honey-1.jpg",
    "category": "honey",
    "description": "Mật ong rừng nguyên chất từ khu bảo tồn thiên nhiên."
  }
];

const usersData = [
  {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin",
    "avatar": "/images/avatar/admin.jpg"
  }
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Settings - Allow all origins in development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Serve static files from the 'images' directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Login API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = usersData.find(u => u.email === email && password === 'password');
  
  if (user) {
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

// Navigation APIs
app.get('/api/parent-navs/all-with-child', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'Success',
    data: navigationData
  });
});

app.get('/api/parent-navs', (req, res) => {
  const parentNavs = navigationData.map(item => ({
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
  let allChildren = [];
  
  navigationData.forEach(parent => {
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

app.get('/api/navigation-links', (req, res) => {
  res.json(navigationData);
});

// Products API
app.get('/api/products', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'Success',
    data: productsData
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = productsData.find(p => p.id.toString() === req.params.id);
  
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

// Catch-all route for unhandled API requests
app.use('/api/*', (req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: 'API endpoint not found'
  });
});

// Catch-all route for all other requests
app.use('*', (req, res) => {
  res.status(200).send('Thôn Trang Liên Nhất API Server');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 