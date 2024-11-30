const fetch = require('node-fetch');

async function fetchImage(url) {
  const response = await fetch(url, {
    headers: {
      'Referer': 'https://codeforces.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.buffer();
  const contentType = response.headers.get('content-type');

  return {
    buffer,
    contentType
  };
}

module.exports = { fetchImage };
