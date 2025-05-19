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
    message: 'API is running',
    time: new Date().toISOString()
  });
});

// Define a simple API route
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API endpoint is working',
    endpoints: [
      '/api/products',
      '/api/services',
      '/api/teams',
      '/api/parent-navs'
    ],
    time: new Date().toISOString()
  });
});

// Create simple mock data endpoints
const mockData = {
  products: [
    {
      id: 1,
      name: "Gạo hữu cơ địa phương",
      slug: "gao-huu-co-dia-phuong",
      summary: "Gạo hữu cơ chất lượng cao",
      images: ["/images/placeholder.jpg"],
      child_nav_id: 2,
      categoryId: 2,
      isFeatured: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Rau sạch địa phương",
      slug: "rau-sach-dia-phuong",
      summary: "Rau được trồng theo quy trình an toàn",
      images: ["/images/placeholder.jpg"],
      child_nav_id: 2,
      categoryId: 2,
      isFeatured: true,
      createdAt: new Date().toISOString()
    }
  ],
  services: [
    {
      id: 1,
      name: "Dịch vụ du lịch sinh thái",
      title: "Dịch vụ du lịch sinh thái",
      slug: "dich-vu-du-lich-sinh-thai",
      summary: "Tham quan và trải nghiệm không gian sinh thái",
      images: ["/images/placeholder.jpg"],
      image: "/images/placeholder.jpg",
      child_nav_id: 3,
      categoryId: 3,
      isFeatured: true,
      createdAt: new Date().toISOString()
    }
  ],
  teams: [
    {
      id: 1,
      name: "Nguyễn Văn A",
      position: "Giám đốc HTX",
      avatar: "/images/placeholder.jpg",
      image: "/images/placeholder.jpg",
      description: "Giám đốc HTX",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Trần Thị B",
      position: "Quản Lý",
      avatar: "/images/placeholder.jpg",
      image: "/images/placeholder.jpg",
      description: "Quản lý HTX",
      createdAt: new Date().toISOString()
    }
  ],
  navigation: [
    {
      id: 1,
      title: "Trang chủ",
      slug: "trang-chu",
      position: 1,
      children: []
    },
    {
      id: 2,
      title: "Sản phẩm",
      slug: "san-pham",
      position: 2,
      children: [
        {
          id: 1,
          title: "Nông sản sạch",
          slug: "nong-san-sach",
          parentId: 2
        }
      ]
    },
    {
      id: 3,
      title: "Dịch vụ",
      slug: "dich-vu",
      position: 3,
      children: [
        {
          id: 2,
          title: "Du lịch sinh thái",
          slug: "du-lich-sinh-thai",
          parentId: 3
        }
      ]
    }
  ]
};

// Define API endpoints with mock data
app.get('/api/products', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'Success',
    data: mockData.products
  });
});

app.get('/api/services', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'Success',
    data: mockData.services
  });
});

app.get('/api/teams', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'Success',
    data: mockData.teams
  });
});

app.get('/api/parent-navs', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'Success',
    data: mockData.navigation
  });
});

app.get('/api/parent-navs/all-with-child', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'Success',
    data: mockData.navigation
  });
});

app.get('/api/parent-navs/slug/:slug', (req, res) => {
  const slug = req.params.slug;
  const navItem = mockData.navigation.find(item => item.slug === slug);
  
  if (navItem) {
    res.json({
      statusCode: 200,
      message: 'Success',
      data: navItem.children
    });
  } else {
    res.json({
      statusCode: 200,
      message: 'Success',
      data: []
    });
  }
});

// Export the Express app for Vercel
module.exports = app; 