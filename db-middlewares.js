module.exports = (req, res, next) => {
  console.log('Request URL:', req.url);

  // Xử lý các request đến endpoint custom
  if (req.url === '/api/parent-navs/all-with-child') {
    console.log('Handling parent-navs/all-with-child');
    const db = require('./database.json');
    return res.json({
      statusCode: 200,
      message: 'Success',
      data: db.navigation
    });
  }
  
  if (req.url === '/api/navigation-links') {
    console.log('Handling navigation-links');
    const db = require('./database.json');
    return res.json(db.navigation);
  }
  
  if (req.url === '/api/parent-navs') {
    console.log('Handling parent-navs');
    const db = require('./database.json');
    const parentNavs = db.navigation.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      position: item.position
    }));
    return res.json({
      statusCode: 200,
      message: 'Success',
      data: parentNavs
    });
  }
  
  if (req.url === '/api/child-navs') {
    console.log('Handling child-navs');
    const db = require('./database.json');
    let allChildren = [];
    
    db.navigation.forEach(parent => {
      allChildren = [...allChildren, ...parent.children.map(child => ({
        ...child,
        parentId: parent.id
      }))];
    });
    
    return res.json({
      statusCode: 200,
      message: 'Success',
      data: allChildren
    });
  }
  
  // Xử lý các endpoint khác
  next();
} 