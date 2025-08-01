/*───────────────────  basic setup  ──────────────────*/
import 'dotenv/config';
import express   from 'express';
import cors      from 'cors';
import fetch     from 'node-fetch';             // npm i node-fetch@3 if on Node ≤18
import { searchFlights } from './src/lib/flightApi.ts';  // pricing wrapper
import { searchHotels } from './src/lib/amadeus.js';
import { searchPOI }    from './src/lib/openTrip.js';
import { getWeather }   from './src/lib/weather.js';

const app = express();
app.use(cors());
app.use(express.json());

console.log('🚀 Server initialization complete');

/*───────────────────  travel-only prompt  ───────────*/
const SYSTEM_PROMPT = `
You are TravelBot, a helpful travel assistant.
Allowed topics: flights, lodging, weather, itineraries, food, attractions.
Allowed tools: searchFlights, searchHotels, searchPOI, getWeather.

Your responses should:
- Be conversational and friendly
- Start with "Certainly!" or similar positive phrases
- Focus on providing helpful travel information
- Always offer multiple options when possible (max 3)
- Format flight information in a clean, readable way
- Provide general hotel recommendations without check-in dates unless the user is booking a trip

For flight searches:
- Always collect ALL required information before searching
- Ask about trip type (one-way or round-trip) if not specified
- Ask about cabin class (economy or business) if not specified
- Ask for all necessary dates
- Present options sorted by price (cheapest first)
- Include important flight details like times and stops

If the user asks anything non-travel, politely redirect them to travel topics.
`;

/*───────────────────  tool schema  ─────────────────*/
// Gemini expects tools as function_declarations inside a single object
const functionDeclarations = [
  {
    name: 'searchFlights',
    description: 'Search for flight prices and booking links',
    parameters: {
      type: 'object',
      properties: {
        origin     : { type: 'string', description: 'IATA, e.g. JFK' },
        destination: { type: 'string', description: 'IATA, e.g. LAX' },
        date       : { type: 'string', format: 'date', description: 'Outbound date YYYY-MM-DD' },
        returnDate : { type: 'string', format: 'date', description: 'Return date YYYY-MM-DD for round trips' },
        cabin      : { type: 'string', enum: ['economy', 'business'], default: 'economy' },
        tripType   : { type: 'string', enum: ['one_way', 'round_trip'], default: 'one_way' }
      },
      required: ['origin', 'destination', 'date']
    }
  },
  {
    name: 'searchHotels',
    description: 'Find hotel offers in a city',
    parameters: {
      type: 'object',
      properties: {
        cityCode: { type: 'string', description: 'IATA city code, e.g. PAR' },
        checkIn : { type: 'string', format: 'date', description: 'Check-in date YYYY-MM-DD' },
        nights  : { type: 'integer', default: 1, description: 'Number of nights' }
      },
      required: ['cityCode', 'checkIn']
    }
  },
  {
    name: 'searchPOI',
    description: 'Search points of interest near a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name or "lat,lon"' },
        kinds   : { type: 'string', description: 'POI categories comma separated' },
        limit   : { type: 'integer', default: 10 }
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

const tools = [{ function_declarations: functionDeclarations }];


/*───────────────────  route  ───────────────────────*/
app.post('/api/chat', async (req, res) => {
  console.log('📥 Received chat request');
  const { messages } = req.body;
  console.log('📤 User messages:', JSON.stringify(messages, null, 2));

  console.log('🤖 Sending request to Gemini API');
  try {
    const geminiRequest = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: messages.map(m => ({
        role : m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      tools,
      tool_config: { function_calling_config: { mode: 'AUTO' } }
    };

    console.log('🔍 Gemini request payload:', JSON.stringify(geminiRequest, null, 2));

    const openRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiRequest)
    });

    /*------------- handle model or error -------------*/
    if (!openRes.ok) {
      const error = await openRes.text();
      console.error('❌ Gemini API error:', error);
      return res.status(500).json({ error });
    }

    const data = await openRes.json();
    console.log('✅ Gemini API response received');
    console.log('★ Raw Gemini reply →', JSON.stringify(data, null, 2));

    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.[0] || {};

    if (part.functionCall) {
      console.log('🛠️ Tool call detected:', JSON.stringify(part.functionCall, null, 2));
      const name = part.functionCall.name;
      const args = JSON.parse(part.functionCall.args || '{}');

      try {
        if (name === 'searchFlights') {
          console.log('✈️ Running searchFlights with', args);
          const flights = await searchFlights(args);
          const formatted = formatFlights(flights, args.tripType);
          return res.json({ choices: [{ message: { role: 'assistant', content: formatted } }] });
        }

        if (name === 'searchHotels') {
          console.log('🏨 Running searchHotels with', args);
          const hotels = await searchHotels(args);
          const formatted = formatHotels(hotels);
          return res.json({ choices: [{ message: { role: 'assistant', content: formatted } }] });
        }

        if (name === 'searchPOI') {
          console.log('📍 Running searchPOI with', args);
          const pois = await searchPOI(args);
          const formatted = formatPOI(pois);
          return res.json({ choices: [{ message: { role: 'assistant', content: formatted } }] });
        }

        if (name === 'getWeather') {
          console.log('🌤️ Running getWeather with', args);
          const w = await getWeather(args);
          const formatted = formatWeather(w);
          return res.json({ choices: [{ message: { role: 'assistant', content: formatted } }] });
        }

        console.log('⚠️ Unknown tool name:', name);
      } catch (e) {
        console.error('❌ Error processing tool call:', e);
        return res.json({ choices: [{ message: { role: 'assistant', content: 'Sorry, something went wrong executing that tool.' } }] });
      }
    } else {
      const text = candidate?.content?.parts?.map(p => p.text).join('') || '';
      console.log('📤 Sending regular Gemini response');
      return res.json({ choices: [{ message: { role: 'assistant', content: text } }] });
    }
    
  } catch (error) {
    console.error('❌ Server exception:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

/*───────────────────  formatter  ──────────────────*/
function formatFlights(json, tripType = 'one_way') {
  console.log('🔄 Inside formatFlights function');
  console.log('Input data:', JSON.stringify(json, null, 2));
  
  if (!json?.data?.length) {
    console.log('⚠️ No flight data to format');
    return 'Certainly! I searched for flights but couldn\'t find any matching your criteria. Would you like to try different dates or airports?';
  }
  
  const flightTypeStr = tripType === 'round_trip' ? 'round-trip' : 'one-way';
  
  // Create an introduction for the flight results
  let formattedResponse = `Certainly! Here are the cheapest ${flightTypeStr} flights I found (sorted by price):\n\n`;
  
  // Add each flight to the response
  json.data.slice(0, 3).forEach((f, index) => {
    console.log(`Processing flight ${index}:`, JSON.stringify(f, null, 2));
    
    const price = f.price.total_amount;
    const airline = f.routes[0].airline;
    const stops = f.routes[0].stops || 0;
    const stopsStr = stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`;
    const departure = f.routes[0].departureTime || 'N/A';
    const arrival = f.routes[0].arrivalTime || 'N/A';
    const duration = f.routes[0].duration || 'N/A';
    
    formattedResponse += `${index + 1}. **$${price}** - ${airline}\n`;
    formattedResponse += `   • Outbound: ${departure} → ${arrival} (${duration}, ${stopsStr})\n`;
    
    // Add return flight details if this is a round trip
    if (tripType === 'round_trip' && f.returnRoute) {
      const returnStops = f.returnRoute.stops || 0;
      const returnStopsStr = returnStops === 0 ? 'Nonstop' : `${returnStops} stop${returnStops > 1 ? 's' : ''}`;
      
      formattedResponse += `   • Return: ${f.returnRoute.departureTime} → ${f.returnRoute.arrivalTime}`;
      formattedResponse += ` (${f.returnRoute.duration}, ${returnStopsStr})\n`;
    }
    
    formattedResponse += `   • [Book flight](${f.booking_link})\n\n`;
  });
  
  // Add a closing message
  formattedResponse += 'Prices and availability may change. Would you like information about hotels or attractions at your destination?';
  
  console.log('Final formatted response:', formattedResponse);
  return formattedResponse;
}

function formatHotels(json) {
  if (!json?.data?.length) return 'Certainly! No hotels found.';
  let out = 'Certainly! Here are some hotel options:\n\n';
  json.data.slice(0, 3).forEach((h, idx) => {
    const offer = h.offers?.[0] || {};
    const price = offer.price?.total || 'N/A';
    const link = offer.url || offer.bookingLink || '';
    out += `${idx + 1}. **${h.hotel?.name || 'Hotel'}** - $${price}\n`;
    if (link) out += `   • [Book hotel](${link})\n`;
    out += '\n';
  });
  return out;
}

function formatPOI(list) {
  if (!list?.length) return 'Certainly! No attractions found.';
  let out = 'Certainly! Here are some attractions:\n\n';
  list.slice(0, 5).forEach((p, idx) => {
    out += `${idx + 1}. [${p.name}](${p.link})\n`;
  });
  return out;
}

function formatWeather(json) {
  if (!json?.daily?.length) return 'Weather data unavailable.';
  let out = 'Certainly! Here is the upcoming forecast:\n\n';
  json.daily.slice(0, 3).forEach(d => {
    const date = new Date(d.dt * 1000).toISOString().slice(0, 10);
    const desc = d.weather?.[0]?.description || '';
    const min = Math.round(d.temp?.min);
    const max = Math.round(d.temp?.max);
    out += `${date}: ${desc}, ${min}°C–${max}°C\n`;
  });
  return out;
}

/*───────────────────  boot  ───────────────────────*/
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`🌐 API listening on port ${PORT}`));
