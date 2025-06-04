import 'dotenv/config';
import { searchFlights } from './src/lib/flightApi.js';

async function test() {
  try {
    console.log('Starting SerpAPI flight test...');
    const flights = await searchFlights({
      origin: 'MAD',
      destination: 'RBA',
      date: '2025-07-16'
    });
    console.log('SerpAPI test succeeded!');
    console.log('Number of flights found:', flights?.data?.length || 0);
    console.log('First few flights:', JSON.stringify(flights?.data?.slice(0, 2), null, 2));
  } catch (error) {
    console.error('SerpAPI test error:', error);
  }
}

test();