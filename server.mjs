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
// Mistral's API expects a different format for tools - let's fix it
const tools = [
  {
    function: {
      name: 'searchFlights',
      description: 'Search for flight prices and booking links',
      parameters: {
        type: 'object',
        properties: {
          origin     : { type:'string', description:'IATA, e.g. JFK' },
          destination: { type:'string', description:'IATA, e.g. LAX' },
          date       : { type:'string', format:'date', description:'Outbound date YYYY-MM-DD' },
          returnDate : { type:'string', format:'date', description:'Return date YYYY-MM-DD for round trips' },
          cabin      : { type:'string', enum:['economy','business'], default:'economy' },
          tripType   : { type:'string', enum:['one_way','round_trip'], default:'one_way' }
        },
        required: ['origin','destination','date']
      }
    }
  },
  {
    function: {
      name: 'searchHotels',
      description: 'Find hotel offers in a city',
      parameters: {
        type: 'object',
        properties: {
          cityCode: { type:'string', description:'IATA city code, e.g. PAR' },
          checkIn : { type:'string', format:'date', description:'Check-in date YYYY-MM-DD' },
          nights  : { type:'integer', default:1, description:'Number of nights' }
        },
        required: ['cityCode','checkIn']
      }
    }
  },
  {
    function: {
      name: 'searchPOI',
      description: 'Search points of interest near a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type:'string', description:'City name or "lat,lon"' },
          kinds   : { type:'string', description:'POI categories comma separated' },
          limit   : { type:'integer', default:10 }
        },
        required: ['location']
      }
    }
  },
  {
    function: {
      name: 'getWeather',
      description: 'Get 7 day weather forecast for coordinates',
      parameters: {
        type: 'object',
        properties: {
          lat: { type:'number', description:'Latitude' },
          lon: { type:'number', description:'Longitude' }
        },
        required: ['lat','lon']
      }
    }
  }
];


/*───────────────────  route  ───────────────────────*/
app.post('/api/chat', async (req, res) => {
  console.log('📥 Received chat request');
  const { messages } = req.body;
  console.log('📤 User messages:', JSON.stringify(messages, null, 2));

  const chatMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];

  console.log('🤖 Sending request to Mistral API');
  try {
    const mistralRequest = {
      model      : 'mistral-small',
      messages   : chatMessages,
      tools,
      tool_choice: 'auto',
      stream     : false
    };
    
    console.log('🔍 Mistral request payload:', JSON.stringify(mistralRequest, null, 2));
    
    const openRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method : 'POST',
      headers: {
        Authorization : `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mistralRequest)
    });

    /*------------- handle model or error -------------*/
    if (!openRes.ok) {
      const error = await openRes.text();
      console.error('❌ Mistral API error:', error);
      return res.status(500).json({ error });
    }

    const data = await openRes.json();
    console.log('✅ Mistral API response received');
    console.log('★ Raw Mistral reply →', JSON.stringify(data, null, 2));
    
    if (!data.choices || data.choices.length === 0) {
      console.error('❌ No choices in Mistral response');
      return res.status(500).json({ error: 'Invalid response from Mistral API' });
    }
    
    const choice = data.choices[0];
    console.log('🔄 Processing choice:', JSON.stringify(choice, null, 2));

    /*────────── handle searchFlights tool call ───────*/
    console.log('🔍 Checking for tool calls...');
    console.log('Finish reason:', choice.finish_reason);
    console.log('Tool calls present:', !!choice.message.tool_calls);
    
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      console.log('🛠️ Tool call detected:', JSON.stringify(choice.message.tool_calls, null, 2));

      const toolCall = choice.message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments || '{}');
      const name = toolCall.function.name;

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
    }

    /*────────── plain model answer ───────────────────*/
    console.log('📤 Sending regular Mistral response');
    res.json(data);
    
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