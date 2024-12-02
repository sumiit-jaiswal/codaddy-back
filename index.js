const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { scrapeProblemWithBrowser } = require('./utils/problemScraper');
const { fetchImage } = require('./utils/fetchImages');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://codaddy.netlify.app',
      'http://localhost:3000',  // Development environment
      'https://codaddy.vercel.app',  // Additional deployment environments if needed
      'http://localhost:5173',  // Vite dev server
      'http://localhost:3001'   // Alternative dev port
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet()); // Adds security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (optional, for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Codaddy backend is running...', 
    timestamp: new Date().toISOString() 
  });
});

// Problem scraping route
app.get('/api/problem/:contestId/:problemId', async (req, res) => {
  try {
    const { contestId, problemId } = req.params;
    
    const problemDetails = await scrapeProblemWithBrowser(contestId, problemId);
    
    if (!problemDetails) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    res.json(problemDetails);
  } catch (error) {
    console.error('Scraping Error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape problem', 
      details: error.message 
    });
  }
});

// Image proxy route
app.get('/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    const imageData = await fetchImage(imageUrl);
    
    res.set('Content-Type', imageData.contentType);
    res.send(imageData.buffer);
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch image', 
      details: error.message 
    });
  }
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.path 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Accessible at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;