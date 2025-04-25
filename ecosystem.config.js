module.exports = {
  apps: [{
    name: 'thontrangliennhat-api',
    script: 'server-express.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
}; 