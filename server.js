const jsonServer = require('json-server');
const express = require('express');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router('database.json');
const middlewares = jsonServer.defaults({ 
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});
const port = 3001;

// Phục vụ file tĩnh từ thư mục 'images' tại đường dẫn '/images'
server.use('/images', express.static(path.join(__dirname, 'images')));

// Đặt mặc định middleware
server.use(middlewares);

// Middleware xử lý body dạng JSON
server.use(jsonServer.bodyParser);

// API đăng nhập đơn giản
server.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = router.db.get('users').value();
  
  const user = users.find(u => u.email === email && password === 'password');
  
  if (user) {
    res.jsonp({
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
    res.status(401).jsonp({
      statusCode: 401,
      message: 'Invalid credentials'
    });
  }
});

// Custom API endpoint cho navigation
server.get('/api/parent-navs/all-with-child', (req, res) => {
  const navigation = router.db.get('navigation').value();
  res.jsonp({
    statusCode: 200,
    message: 'Success',
    data: navigation
  });
});

// Endpoint cho các parent-navs
server.get('/api/parent-navs', (req, res) => {
  const navigation = router.db.get('navigation').value();
  const parentNavs = navigation.map(item => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    position: item.position
  }));
  
  res.jsonp({
    statusCode: 200,
    message: 'Success',
    data: parentNavs
  });
});

// Endpoint cho các child-navs
server.get('/api/child-navs', (req, res) => {
  const navigation = router.db.get('navigation').value();
  let allChildren = [];
  
  navigation.forEach(parent => {
    allChildren = [...allChildren, ...parent.children.map(child => ({
      ...child,
      parentId: parent.id
    }))];
  });
  
  res.jsonp({
    statusCode: 200,
    message: 'Success',
    data: allChildren
  });
});

// Endpoint cho navigation-links để tương thích với API mới
server.get('/api/navigation-links', (req, res) => {
  const navigation = router.db.get('navigation').value();
  res.jsonp(navigation);
});

// Sử dụng router mặc định của json-server cho các resource khác
server.use('/api', router);

// Thông báo các routes cho người dùng
server.use('/api', (req, res, next) => {
  console.log(`API request: ${req.method} ${req.path}`);
  next();
});

// Bắt đầu server
server.listen(port, () => {
  console.log('JSON Server đang chạy tại http://localhost:' + port);
  console.log('Để xem dữ liệu, truy cập:');
  console.log('- http://localhost:' + port + '/api/navigation-links');
  console.log('- http://localhost:' + port + '/api/parent-navs/all-with-child');
  console.log('- http://localhost:' + port + '/api/parent-navs');
  console.log('- http://localhost:' + port + '/api/child-navs');
  console.log('- http://localhost:' + port + '/api/products');
  console.log('- http://localhost:' + port + '/api/services');
}); 