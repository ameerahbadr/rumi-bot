const axios = require('axios');
require('dotenv').config();

async function testAuth() {
  try {
    const response = await axios.post('https://bsky.social/xrpc/com.atproto.server.createSession', {
      identifier: process.env.BLUESKY_USERNAME,
      password: process.env.BLUESKY_PASSWORD,
    });
    console.log('Authentication successful!', response.data);
  } catch (err) {
    console.error('Authentication failed:', err.response ? err.response.data : err.message);
  }
}

testAuth();