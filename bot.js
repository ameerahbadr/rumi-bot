const { BskyAgent } = require('@atproto/api');
const fs = require('fs');
require('dotenv').config(); // Load environment variables

// Debug: Log environment variables
console.log('Username:', process.env.BLUESKY_HANDLE);
console.log('Password:', process.env.BLUESKY_PASSWORD ? '****' : 'Not set');

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
    return true;
  } catch (err) {
    console.error('Authentication failed:', err.response ? err.response.data : err.message);
    return false;
  }
}

// Function to post a quote
async function postQuote() {
  const quote = getRandomQuote();
  console.log(`Posting quote: ${quote}`);

  try {
    await agent.post({
      text: quote,
      createdAt: new Date().toISOString(),
    });
    console.log('Quote posted successfully at:', new Date().toISOString());
    return true;
  } catch (err) {
    console.error('Error posting quote:', err);
    return false;
  }
}

// Main function to run the bot
async function runBot() {
  console.log('Starting Rumi Quote Bot at', new Date().toISOString());
  
  try {
    const isAuthenticated = await authenticate();
    if (!isAuthenticated) {
      console.error('Failed to authenticate. Exiting...');
      process.exit(1);
    }
    
    const isPosted = await postQuote();
    if (!isPosted) {
      console.error('Failed to post quote. Exiting...');
      process.exit(1);
    }
    
    console.log('Bot execution completed successfully at', new Date().toISOString());
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the bot
runBot();