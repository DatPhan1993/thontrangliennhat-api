// Import Express and create a router
const express = require('express');
const cors = require('cors');
const router = express.Router();

// Enable CORS with specific origin
router.use(cors({
  origin: 'https://thontrangliennhat.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: 'X-Requested-With, Content-Type, Accept',
  credentials: true
}));

// Add CORS headers to all responses
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://thontrangliennhat.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Mock data tailored to match frontend expectations
const mockData = {
  products: [
    {
      id: 1,
      name: "Gạo hữu cơ địa phương",
      slug: "gao-huu-co-dia-phuong",
      summary: "Gạo hữu cơ chất lượng cao",
      content: "Sản phẩm gạo được trồng theo phương pháp hữu cơ, không sử dụng thuốc trừ sâu hóa học.",
      images: ["/images/placeholder.jpg"],
      child_nav_id: 2,
      categoryId: 2,
      isFeatured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Rau sạch địa phương",
      slug: "rau-sach-dia-phuong",
      summary: "Rau được trồng theo quy trình an toàn",
      content: "Rau được trồng theo quy trình an toàn, không thuốc trừ sâu độc hại.",
      images: ["/images/placeholder.jpg"],
      child_nav_id: 2,
      categoryId: 2,
      isFeatured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  services: [
    {
      id: 1,
      name: "Dịch vụ du lịch sinh thái",
      title: "Dịch vụ du lịch sinh thái",
      slug: "dich-vu-du-lich-sinh-thai",
      summary: "Tham quan và trải nghiệm không gian sinh thái",
      content: "Cung cấp dịch vụ tham quan du lịch sinh thái tại địa phương.",
      description: "Cung cấp dịch vụ tham quan du lịch sinh thái tại địa phương.",
      images: ["/images/placeholder.jpg"],
      image: "/images/placeholder.jpg",
      child_nav_id: 3,
      categoryId: 3,
      isFeatured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Trần Thị B",
      position: "Quản Lý",
      avatar: "/images/placeholder.jpg",
      image: "/images/placeholder.jpg",
      description: "Quản lý HTX",
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
    },
    {
      id: 4,
      title: "Trải nghiệm",
      slug: "trai-nghiem",
      position: 4,
      children: [
        {
          id: 3,
          title: "Trải nghiệm nông nghiệp",
          slug: "trai-nghiem-nong-nghiep",
          parentId: 4
        }
      ]
    },
    {
      id: 5,
      title: "Tin tức",
      slug: "tin-tuc",
      position: 5,
      children: []
    }
  ],
  experiences: [
    {
      id: 1,
      title: "Trải nghiệm nông nghiệp",
      slug: "trai-nghiem-nong-nghiep",
      summary: "Trải nghiệm cuộc sống nông nghiệp tại Thôn Trang Liên Nhất",
      content: "Khám phá nét đẹp của cuộc sống nông thôn tại Thôn Trang Liên Nhất với các hoạt động trải nghiệm nông nghiệp đặc sắc.",
      images: ["/images/placeholder.jpg"],
      child_nav_id: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  news: [
    {
      id: 1,
      title: "Thôn Trang Liên Nhất tổ chức lễ hội mùa màng",
      slug: "thon-trang-lien-nhat-to-chuc-le-hoi-mua-mang",
      summary: "Lễ hội mùa màng đầu tiên được tổ chức tại Thôn Trang Liên Nhất",
      content: "Thôn Trang Liên Nhất vừa tổ chức thành công lễ hội mùa màng với nhiều hoạt động đặc sắc.",
      images: ["/images/placeholder.jpg"],
      categoryId: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  categories: {
    "san-pham": [
      {
        id: 1,
        title: "Nông sản sạch",
        slug: "nong-san-sach",
        parentId: 2
      },
      {
        id: 2,
        title: "Sản phẩm chế biến",
        slug: "san-pham-che-bien",
        parentId: 2
      }
    ],
    "dich-vu": [
      {
        id: 3,
        title: "Du lịch sinh thái",
        slug: "du-lich-sinh-thai",
        parentId: 3
      },
      {
        id: 4,
        title: "Ẩm thực đặc sản",
        slug: "am-thuc-dac-san",
        parentId: 3
      }
    ],
    "trai-nghiem": [
      {
        id: 5,
        title: "Trải nghiệm nông nghiệp",
        slug: "trai-nghiem-nong-nghiep",
        parentId: 4
      },
      {
        id: 6,
        title: "Khám phá làng nghề",
        slug: "kham-pha-lang-nghe",
        parentId: 4
      }
    ]
  },
  images: [
    {
      id: 1,
      name: "Banner chính",
      alt: "Banner chính thôn Trang Liên Nhất",
      url: "https://images/uploads/174706388430-76937121.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Sản phẩm HTX",
      alt: "Sản phẩm HTX thôn Trang Liên Nhất",
      url: "https://images/uploads/17473971405-1962764.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// API endpoints handler with appropriate response format
const handleApiResponse = (res, data) => {
  res.json({
    statusCode: 200,
    message: 'Success',
    data: data
  });
};

// API endpoint
router.get('/', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'API is operational',
    endpoints: [
      '/api/products',
      '/api/services',
      '/api/teams',
      '/api/parent-navs',
      '/api/parent-navs/all-with-child',
      '/api/parent-navs/slug/:slug',
      '/api/experiences',
      '/api/news',
      '/api/images'
    ]
  });
});

// Products endpoint
router.get('/products', (req, res) => {
  console.log('GET /api/products - Serving product data');
  handleApiResponse(res, mockData.products);
});

// Services endpoint
router.get('/services', (req, res) => {
  console.log('GET /api/services - Serving service data');
  handleApiResponse(res, mockData.services);
});

// Teams endpoint
router.get('/teams', (req, res) => {
  console.log('GET /api/teams - Serving team data');
  handleApiResponse(res, mockData.teams);
});

// Parent navs endpoint
router.get('/parent-navs', (req, res) => {
  console.log('GET /api/parent-navs - Serving navigation data');
  handleApiResponse(res, mockData.navigation);
});

// Parent navs with child endpoint
router.get('/parent-navs/all-with-child', (req, res) => {
  console.log('GET /api/parent-navs/all-with-child - Serving full navigation tree');
  handleApiResponse(res, mockData.navigation);
});

// Parent navs by slug - critical for category pages
router.get('/parent-navs/slug/:slug', (req, res) => {
  const slug = req.params.slug;
  console.log(`GET /api/parent-navs/slug/${slug} - Serving categories for ${slug}`);
  
  // Return appropriate categories based on slug
  if (mockData.categories[slug]) {
    handleApiResponse(res, mockData.categories[slug]);
  } else {
    // Return empty array if no categories found
    handleApiResponse(res, []);
  }
});

// Images endpoint
router.get('/images', (req, res) => {
  console.log('GET /api/images - Serving image data');
  handleApiResponse(res, mockData.images);
});

// Image by ID endpoint
router.get('/images/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`GET /api/images/${id} - Serving specific image data`);
  
  const image = mockData.images.find(img => img.id === id);
  if (image) {
    handleApiResponse(res, image);
  } else {
    res.status(404).json({
      statusCode: 404,
      message: 'Image not found',
      data: null
    });
  }
});

// Experiences endpoint
router.get('/experiences', (req, res) => {
  console.log('GET /api/experiences - Serving experience data');
  handleApiResponse(res, mockData.experiences);
});

// News endpoint
router.get('/news', (req, res) => {
  console.log('GET /api/news - Serving news data');
  handleApiResponse(res, mockData.news);
});

// Export the router
module.exports = router; 