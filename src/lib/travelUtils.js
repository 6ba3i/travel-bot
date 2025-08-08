/*───────────────────  basic setup  ──────────────────*/
import 'dotenv/config';
import express   from 'express';
import cors      from 'cors';
import fetch     from 'node-fetch';
import { searchFlights, searchHotels } from './src/lib/amadeus.js';  // Updated import
import { searchPOI }    from './src/lib/openTrip.js';
import { getWeather }   from './src/lib/weather.js';

const app = express();
app.use(cors());
app.use(express.json());

console.log('🚀 Server initialization complete');

/*───────────────────  travel-only prompt  ───────────*/
const SYSTEM_PROMPT = `
You are TravelBot, an intelligent travel assistant that handles all travel-related queries seamlessly.

CORE CAPABILITIES:
- Flight searches using searchFlights
- Hotel searches using searchHotels  
- Points of interest using searchPOI
- Weather forecasts using getWeather

SMART PROCESSING RULES:
1. **Airport/City Code Conversion**: You know major airport codes and city codes. Convert automatically:
   - Casablanca = CMN
   - Barcelona = BCN  
   - Paris = CDG/ORY (prefer CDG), city code PAR
   - London = LHR/LGW (prefer LHR), city code LON
   - New York = JFK/LGA/EWR (prefer JFK), city code NYC
   - Madrid = MAD
   - Tokyo = NRT/HND (prefer NRT), city code TYO
   - Dubai = DXB
   - Istanbul = IST
   - Los Angeles = LAX
   - And many others - use your knowledge!

2. **Date Parsing**: Convert natural dates to YYYY-MM-DD automatically:
   - "19th of July" or "July 19th" → determine year (current or next)
   - "next Monday" → calculate exact date
   - "in 2 weeks" → calculate exact date
   - Always assume current year unless specified otherwise

3. **Smart Defaults**:
   - Default to economy class unless specified
   - Default to 1 adult unless specified
   - Default to one-way unless return mentioned
   - Default to 1 night for hotels unless specified

4. **Immediate Action**: When you have enough info, search immediately. Don't ask for confirmations.

RESPONSE STYLE:
- Be enthusiastic and helpful
- Search immediately when possible
- Provide 2-3 options maximum
- Include prices, times, and booking links
- Offer related services (hotels after flights, weather, attractions)

If you cannot determine a city/airport code or date, THEN ask for clarification.
`;

/*───────────────────  tool schema  ─────────────────*/

/*───────────────────  tool schema  ─────────────────*/
const functionDeclarations = [
  {
    name: 'searchFlights',
    description: 'Search for flight prices and booking information using Amadeus API',
    parameters: {
      type: 'object',
      properties: {
        origin     : { type: 'string', description: 'IATA airport code, e.g. JFK' },
        destination: { type: 'string', description: 'IATA airport code, e.g. LAX' },
        date       : { type: 'string', description: 'Departure date in YYYY-MM-DD format' },
        returnDate : { type: 'string', description: 'Return date in YYYY-MM-DD format for round trips' },
        cabin      : { type: 'string', enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'], default: 'ECONOMY' },
        tripType   : { type: 'string', enum: ['one_way', 'round_trip'], default: 'one_way' },
        adults     : { type: 'integer', default: 1, description: 'Number of adult passengers' }
      },
      required: ['origin', 'destination', 'date']
    }
  },
  {
    name: 'searchHotels',
    description: 'Find hotel offers in a city using Amadeus API',
    parameters: {
      type: 'object',
      properties: {
        cityCode: { type: 'string', description: 'IATA city code, e.g. PAR for Paris' },
        checkIn : { type: 'string', description: 'Check-in date in YYYY-MM-DD format' },
        checkOut: { type: 'string', description: 'Check-out date in YYYY-MM-DD format' },
        nights  : { type: 'integer', default: 1, description: 'Number of nights (alternative to checkOut)' },
        adults  : { type: 'integer', default: 1, description: 'Number of adults' },
        rooms   : { type: 'integer', default: 1, description: 'Number of rooms' }
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

const tools = [{ functionDeclarations: functionDeclarations }];

/*───────────────────  route with correct endpoint  ───────────────────────*/
app.post('/api/chat', async (req, res) => {
  console.log('📥 Received chat request');
  const { messages } = req.body;
  console.log('📤 User messages:', JSON.stringify(messages, null, 2));

  console.log('🤖 Sending request to Gemini API');
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

    console.log('🔍 Gemini request payload:', JSON.stringify(geminiRequest, null, 2));

    const openRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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
      const args = part.functionCall.args || {}; // Already an object in v1beta

      try {
        if (name === 'searchFlights') {
          console.log('✈️ Running searchFlights with', args);
          const flights = await searchFlights(args);
          const formatted = formatFlights(flights, args.tripType || 'one_way');
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
        return res.json({ choices: [{ message: { role: 'assistant', content: `Sorry, something went wrong executing that tool: ${e.message}` } }] });
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

/*───────────────────  formatter functions  ──────────────────*/
function formatFlights(json, tripType = 'one_way') {
  console.log('🔄 Inside formatFlights function');
  console.log('Input data:', JSON.stringify(json, null, 2));
  
  if (!json?.data?.length) {
    console.log('⚠️ No flight data to format');
    return 'Certainly! I searched for flights but couldn\'t find any matching your criteria. Would you like to try different dates or airports?';
  }
  
  const flightTypeStr = tripType === 'round_trip' ? 'round-trip' : 'one-way';
  
  let formattedResponse = `Certainly! Here are the cheapest ${flightTypeStr} flights I found:\n\n`;
  
  json.data.slice(0, 3).forEach((f, index) => {
    console.log(`Processing flight ${index}:`, JSON.stringify(f, null, 2));
    
    const price = f.price.total_amount;
    const currency = f.price.currency;
    const route = f.routes[0];
    const airline = route.airline;
    const stops = route.stops || 0;
    const stopsStr = stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`;
    
    // Format times (remove timezone info for readability)
    const departure = new Date(route.departureTime).toLocaleString();
    const arrival = new Date(route.arrivalTime).toLocaleString();
    
    formattedResponse += `${index + 1}. **${currency} ${price}** - ${airline}\n`;
    formattedResponse += `   • Outbound: ${departure} → ${arrival} (${route.duration}, ${stopsStr})\n`;
    
    // Add return flight details if available
    if (f.returnRoute) {
      const returnStops = f.returnRoute.stops || 0;
      const returnStopsStr = returnStops === 0 ? 'Nonstop' : `${returnStops} stop${returnStops > 1 ? 's' : ''}`;
      const returnDep = new Date(f.returnRoute.departureTime).toLocaleString();
      const returnArr = new Date(f.returnRoute.arrivalTime).toLocaleString();
      
      formattedResponse += `   • Return: ${returnDep} → ${returnArr} (${f.returnRoute.duration}, ${returnStopsStr})\n`;
    }
    
    formattedResponse += `   • [More details](${f.booking_link})\n\n`;
  });
  
  formattedResponse += 'Prices and availability may change. Would you like information about hotels or attractions at your destination?';
  
  console.log('Final formatted response:', formattedResponse);
  return formattedResponse;
}

function formatHotels(json) {
  if (!json?.data?.length) return 'Certainly! No hotels found for your search criteria.';
  
  let out = 'Certainly! Here are some hotel options:\n\n';
  
  json.data.slice(0, 3).forEach((h, idx) => {
    const offer = h.offers?.[0] || {};
    const price = offer.price?.total || 'N/A';
    const currency = offer.price?.currency || '';
    const link = offer.url || offer.bookingLink || '';
    
    out += `${idx + 1}. **${h.hotel?.name || 'Hotel'}** - ${currency} ${price}\n`;
    out += `   • Location: ${h.hotel?.cityCode || 'N/A'}\n`;
    if (link) out += `   • [View hotel](${link})\n`;
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