const { BskyAgent } = require('@atproto/api');
const cron = require('node-cron');
const fs = require('fs');
require('dotenv').config(); // Load environment variables

// Debug: Log environment variables
console.log('Username:', process.env.BLUESKY_HANDLE);
console.log('Password:', process.env.BLUESKY_PASSWORD ? '****' : 'Not set');
console.log('Loading .env file from:', require('path').resolve('.env'));

// Initialize the Bluesky agent
const agent = new BskyAgent({ service: 'https://bsky.social' });
console.log('Agent initialized:', agent);

// Load quotes from quotes.json
const quotes = JSON.parse(fs.readFileSync('quotes.json', 'utf-8')).quotes;

// Load used quotes from used-quotes.json 
let usedQuotes = [];
try {
  usedQuotes = JSON.parse(fs.readFileSync('used-quotes.json', 'utf-8'));
} catch (err) {
  console.log('No used-quotes.json found. Creating a new one.');
  fs.writeFileSync('used-quotes.json', JSON.stringify(usedQuotes, null, 2));
}

// Function to get a random quote
function getRandomQuote() {
  const availableQuotes = quotes.filter(quote => !usedQuotes.includes(quote));
  if (availableQuotes.length === 0) {
    console.log('All quotes have been used. Resetting used quotes.');
    usedQuotes = [];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  const randomQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
  usedQuotes.push(randomQuote);
  fs.writeFileSync('used-quotes.json', JSON.stringify(usedQuotes, null, 2));
  return randomQuote;
}

async function authenticate() {
  try {
    const handle = process.env.BLUESKY_HANDLE;
    const password = process.env.BLUESKY_PASSWORD;

    // Debugging log to check if secrets are being pulled
    console.log('Handle:', handle);
    console.log('Password:', password ? '****' : 'Not set');  

    const payload = {
      identifier: handle,
      password: password,
    };
    console.log('Payload:', payload);

    const response = await agent.login(payload);
    console.log('Authenticated with Bluesky:', response.data);
  } catch (err) {
    console.error('Authentication failed:', err.response ? err.response.data : err.message);
  }
}

// Function to post a quote
async function postQuote() {
  const quote = getRandomQuote();
  console.log(`Posting quote: ${quote}`);

  await agent.post({
    text: quote,
    createdAt: new Date().toISOString(),
  });
  console.log('Quote posted successfully at:', new Date().toISOString());
}

// Schedule posts once a day at 11:11 AM
cron.schedule('11 11 * * *', () => {
  console.log('Running scheduled post...');
  authenticate()
    .then(() => postQuote())
    .catch(err => console.error('Error posting quote:', err));
}, {
  timezone: 'America/Chicago',
});

// Test the bot locally
console.log('Rumi Bot is running. Press Ctrl+C to stop.');
authenticate().catch(err => console.error('Authentication failed:', err));