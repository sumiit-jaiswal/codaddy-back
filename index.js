const express = require('express');
const cors = require('cors');
const { scrapeProblemWithBrowser } = require('./utils/problemScraper');
const { fetchImage } = require('./utils/fetchImages');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Codaddy backend is running...' });
});

// Problem scraping route
app.get('/api/problem/:contestId/:problemId', async (req, res) => {
  try {
    const { contestId, problemId } = req.params;
    // console.log(`Scraping problem: ${contestId}/${problemId}`);
    
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

app.get('/proxy-image', async (req, res) => {
  try {
    // console.log('Proxy image request received:', req.query.url);
    const imageUrl = req.query.url;
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong', 
    message: err.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Accessible at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down gracefully');
  process.exit(0);
});