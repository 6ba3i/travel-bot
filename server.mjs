/*───────────────────  Updated server.mjs with date context  ──────────────────*/
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { searchFlights, searchHotels, searchPOI, getWeather } from './src/lib/serpApi.js';

const app = express();
app.use(cors());
app.use(express.json());

console.log('🚀 Server with SerpApi integration complete');

// Get current date for context
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;
const currentDay = currentDate.getDate();
const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

console.log(`📅 Current date: ${formattedDate}`);

/*───────────────────  Updated travel prompt with date context  ───────────*/
const SYSTEM_PROMPT = `
You are TravelBot, an intelligent travel assistant powered by Google's search data through SerpApi.

CRITICAL CONTEXT: Today's date is ${formattedDate} (${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}).
The current year is ${currentYear}.

CORE CAPABILITIES:
- Flight searches using Google Flights data (searchFlights)
- Hotel searches using Google Hotels data (searchHotels)  
- Points of interest using Google Local data (searchPOI)
- Weather forecasts using OpenWeather (getWeather)

SMART PROCESSING RULES:
1. **Airport/City Code Conversion**: You know major airport codes and city codes. Convert automatically:
   - Casablanca = CMN
   - Barcelona = BCN  
   - Paris = CDG/ORY (prefer CDG)
   - London = LHR/LGW (prefer LHR)
   - New York = JFK/LGA/EWR (prefer JFK)
   - Madrid = MAD
   - Tokyo = NRT/HND (prefer NRT)
   - Dubai = DXB
   - Istanbul = IST
   - Los Angeles = LAX
   - And many others - use your knowledge!

2. **Date Parsing - IMPORTANT**: 
   - Today is ${formattedDate} (${currentYear})
   - When user says a month/day without year, use ${currentYear} if the date is in the future, otherwise use ${currentYear + 1}
   - Examples:
     * "August 28th" → "${currentYear}-08-28" (if after today) or "${currentYear + 1}-08-28" (if before today)
     * "July 19th" → determine if it's ${currentYear} or ${currentYear + 1} based on current date
     * "next Monday" → calculate exact date from today (${formattedDate})
     * "in 2 weeks" → calculate exact date from today
     * "tomorrow" → add 1 day to ${formattedDate}
   - NEVER use past dates for flight/hotel searches
   - Always validate dates are in the future

3. **Smart Defaults**:
   - Default to economy class unless specified
   - Default to 1 adult unless specified
   - Default to one-way unless return mentioned
   - Default to 1 night for hotels unless specified

4. **Immediate Action**: When you have enough info, search immediately. Don't ask for confirmations.

DATA SOURCES:
- Flight data comes from Google Flights (real bookable flights with pricing)
- Hotel data comes from Google Hotels (real availability and pricing)
- Attractions come from Google Local (real businesses with reviews)
- All data is scraped in real-time, so it's current and accurate

RESPONSE STYLE:
- Be enthusiastic and helpful
- Search immediately when possible
- Provide 2-3 options maximum with real prices and booking links
- Include ratings, reviews, and practical details
- Offer related services (hotels after flights, attractions, weather)

If you cannot determine a city/airport code or date, THEN ask for clarification.
Remember: Today is ${formattedDate} - never search for dates in the past!
`;

/*───────────────────  Updated tool schema  ─────────────────*/
const functionDeclarations = [
  {
    name: 'searchFlights',
    description: 'Search for real bookable flights using Google Flights data via SerpApi',
    parameters: {
      type: 'object',
      properties: {
        origin     : { type: 'string', description: 'IATA airport code, e.g. JFK' },
        destination: { type: 'string', description: 'IATA airport code, e.g. LAX' },
        date       : { type: 'string', description: 'Departure date in YYYY-MM-DD format (must be in the future)' },
        returnDate : { type: 'string', description: 'Return date in YYYY-MM-DD format for round trips' },
        adults     : { type: 'integer', default: 1, description: 'Number of adult passengers' },
        tripType   : { type: 'string', enum: ['one_way', 'round_trip'], default: 'one_way' }
      },
      required: ['origin', 'destination', 'date']
    }
  },
  {
    name: 'searchHotels',
    description: 'Find real hotel offers using Google Hotels data via SerpApi',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name, e.g. "Paris" or "Barcelona"' },
        checkIn : { type: 'string', description: 'Check-in date in YYYY-MM-DD format (must be in the future)' },
        checkOut: { type: 'string', description: 'Check-out date in YYYY-MM-DD format' },
        adults  : { type: 'integer', default: 2, description: 'Number of adults' },
        children: { type: 'integer', default: 0, description: 'Number of children' }
      },
      required: ['location', 'checkIn', 'checkOut']
    }
  },
  {
    name: 'searchPOI',
    description: 'Search points of interest and attractions using Google Local data',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name, e.g. "Paris" or "Barcelona"' },
        query   : { type: 'string', description: 'Type of attractions, e.g. "museums", "restaurants", "tourist attractions"', default: 'tourist attractions' },
        limit   : { type: 'integer', default: 10, description: 'Number of results to return' }
      },
      required: ['location']
    }
  },
  {
    name: 'getWeather',
    description: 'Get 7 day weather forecast for coordinates',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lon: { type: 'number', description: 'Longitude' }
      },
      required: ['lat', 'lon']
    }
  }
];

const tools = [{ functionDeclarations: functionDeclarations }];

/*───────────────────  Main chat route  ───────────────────────*/
app.post('/api/chat', async (req, res) => {
  console.log('📥 Received chat request');
  const { messages } = req.body;

  try {
    const geminiRequest = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: messages.map(m => ({
        role : m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      tools,
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } }
    };

    const openRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiRequest)
    });

    if (!openRes.ok) {
      const error = await openRes.text();
      console.error('❌ Gemini API error:', error);
      return res.status(500).json({ error });
    }

    const data = await openRes.json();
    console.log('✅ Gemini API response received');

    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.[0] || {};

    if (part.functionCall) {
      console.log('🛠️ Tool call detected:', JSON.stringify(part.functionCall, null, 2));
      const name = part.functionCall.name;
      const args = part.functionCall.args || {};

      // Validate dates are in the future
      if ((name === 'searchFlights' || name === 'searchHotels') && args.date) {
        const searchDate = new Date(args.date || args.checkIn);
        if (searchDate < currentDate) {
          console.warn(`⚠️ Date ${args.date || args.checkIn} is in the past! Current date: ${formattedDate}`);
        }
      }

      try {
        if (name === 'searchFlights') {
          console.log('🛫 Running searchFlights with SerpApi');
          const flights = await searchFlights(args);
          const formatted = formatFlights(flights, args.tripType || 'one_way');
          return res.json({ choices: [{ message: { role: 'assistant', content: formatted } }] });
        }

        if (name === 'searchHotels') {
          console.log('🏨 Running searchHotels with SerpApi');
          const hotels = await searchHotels(args);
          const formatted = formatHotels(hotels);
          return res.json({ choices: [{ message: { role: 'assistant', content: formatted } }] });
        }

        if (name === 'searchPOI') {
          console.log('📍 Running searchPOI with SerpApi');
          const pois = await searchPOI(args);
          const formatted = formatPOI(pois);
          return res.json({ choices: [{ message: { role: 'assistant', content: formatted } }] });
        }

        if (name === 'getWeather') {
          console.log('🌤️ Running getWeather');
          const w = await getWeather(args);
          const formatted = formatWeather(w);
          return res.json({ choices: [{ message: { role: 'assistant', content: formatted } }] });
        }

        console.log('⚠️ Unknown tool name:', name);
      } catch (e) {
        console.error('❌ Error processing tool call:', e);
        return res.json({ choices: [{ message: { role: 'assistant', content: `Sorry, something went wrong: ${e.message}` } }] });
      }
    } else {
      const text = candidate?.content?.parts?.map(p => p.text).join('') || '';
      return res.json({ choices: [{ message: { role: 'assistant', content: text } }] });
    }
    
  } catch (error) {
    console.error('❌ Server exception:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

/*───────────────────  Updated formatter functions  ──────────────────*/
function formatFlights(json, tripType = 'one_way') {
  if (!json?.data?.length) {
    return 'I searched Google Flights but couldn\'t find any matching flights. Would you like to try different dates or airports?';
  }
  
  const flightTypeStr = tripType === 'round_trip' ? 'round-trip' : 'one-way';
  let response = `Here are the best ${flightTypeStr} flights I found on Google Flights:\n\n`;
  
  json.data.slice(0, 3).forEach((f, index) => {
    const price = f.price.total_amount;
    const currency = f.price.currency;
    const route = f.routes[0];
    const stops = route.stops === 0 ? 'Nonstop' : `${route.stops} stop${route.stops > 1 ? 's' : ''}`;
    
    response += `${index + 1}. **${currency} ${price}** - ${route.airline}\n`;
    response += `   • ${route.duration} flight, ${stops}\n`;
    if (f.carbon_emissions) {
      response += `   • ${f.carbon_emissions}kg CO₂ emissions\n`;
    }
    response += `   • [Book this flight](${f.booking_link})\n\n`;
  });
  
  response += 'These are real-time prices from Google Flights. Would you like me to find hotels or attractions at your destination?';
  return response;
}

function formatHotels(json) {
  if (!json?.data?.length) {
    return 'I searched Google Hotels but couldn\'t find any available hotels. Try different dates or locations?';
  }
  
  let response = 'Here are great hotel options from Google Hotels:\n\n';
  
  json.data.slice(0, 3).forEach((h, idx) => {
    const offer = h.offers?.[0] || {};
    const price = offer.price?.total || 'N/A';
    const rating = h.hotel.rating ? `⭐ ${h.hotel.rating}` : '';
    
    response += `${idx + 1}. **${h.hotel.name}** ${rating}\n`;
    response += `   • $${price} per night\n`;
    if (h.hotel.reviews) response += `   • ${h.hotel.reviews} reviews\n`;
    if (offer.url) response += `   • [View & book](${offer.url})\n`;
    response += '\n';
  });
  
  return response;
}

function formatPOI(list) {
  if (!list?.length) return 'I couldn\'t find any attractions in that area.';
  
  let response = 'Here are some top attractions from Google:\n\n';
  list.slice(0, 5).forEach((p, idx) => {
    const rating = p.rating ? `⭐ ${p.rating}` : '';
    const reviews = p.reviews ? `(${p.reviews} reviews)` : '';
    
    response += `${idx + 1}. **${p.name}** ${rating} ${reviews}\n`;
    if (p.address) response += `   • ${p.address}\n`;
    if (p.website) response += `   • [Visit website](${p.website})\n`;
    response += '\n';
  });
  
  return response;
}

function formatWeather(json) {
  if (!json?.daily?.length) return 'Weather data unavailable.';
  
  let response = 'Here\'s the weather forecast:\n\n';
  json.daily.slice(0, 3).forEach(d => {
    const date = new Date(d.dt * 1000).toISOString().slice(0, 10);
    const desc = d.weather?.[0]?.description || '';
    const min = Math.round(d.temp?.min);
    const max = Math.round(d.temp?.max);
    response += `${date}: ${desc}, ${min}°C–${max}°C\n`;
  });
  
  return response;
}

/*───────────────────  Start server  ───────────────────────*/
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`🌐 SerpApi-powered travel bot on port ${PORT}`));