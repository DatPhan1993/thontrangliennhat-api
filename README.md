# Thôn Trang Liên Nhất API

API server for the Thôn Trang Liên Nhất website. This server provides RESTful endpoints for managing products, news, and other content on the website.

## Features

- RESTful API for products, news, and other content
- Image upload functionality
- Serverless-ready for Vercel deployment
- CORS support for cross-domain requests

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. The server will be available at http://localhost:3001

## Deployment to Vercel

This API is configured to deploy on Vercel without any additional servers:

1. Push your code to GitHub
2. Connect the repository to Vercel
3. Deploy with the following settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: Default (not required)
   - Install Command: `npm install`
   - Development Command: `npm run dev`

## Environment Variables

Set the following environment variables in Vercel:

- `PORT`: 3000 (default)
- `HOST`: https://thontrangliennhat.com
- `CORS_ORIGIN`: https://thontrangliennhat.com
- `NODE_ENV`: production

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

- `GET /api/news` - Get all news
- `GET /api/news/:id` - Get a specific news item 
- `POST /api/news` - Create a news item
- `PUT /api/news/:id` - Update a news item
- `DELETE /api/news/:id` - Delete a news item 