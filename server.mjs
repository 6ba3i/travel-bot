/*───────────────────  basic setup  ──────────────────*/
import 'dotenv/config';
import express   from 'express';
import cors      from 'cors';
import fetch     from 'node-fetch';             // npm i node-fetch@3 if on Node ≤18
import { searchFlights } from './src/lib/flightApi.js';  // pricing wrapper

const app = express();
app.use(cors());
app.use(express.json());

console.log('🚀 Server initialization complete');

/*───────────────────  travel-only prompt  ───────────*/
const SYSTEM_PROMPT = `
You are TravelBot, a helpful travel assistant.
Allowed topics: flights, lodging, weather, itineraries, food, attractions.
Allowed tools: searchFlights.

Your responses should:
- Be conversational and friendly
- Start with "Certainly!" or similar positive phrases
- Focus on providing helpful travel information
- Always offer multiple options when possible (max 3)
- Format flight information in a clean, readable way

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
const tools = [{
  function: {  // Changed from "name" to wrapping in "function" object
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
}];


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
      if (toolCall?.function?.name === 'searchFlights') {  // Updated to match Mistral's format
        console.log('✈️ SearchFlights tool call confirmed');
        
        try {
          // Extract the arguments from the tool call
          const args = JSON.parse(toolCall.function.arguments);  // Updated to use function.arguments
          console.log('🔢 Processing flight search with args:', args);
          
          // Call the searchFlights function
          console.log('🔄 Calling searchFlights function...');
          const flights = await searchFlights(args);
          console.log('✅ Flight search results:', JSON.stringify(flights, null, 2));
          
          // Check if we have valid flight data
          if (!flights?.data) {
            console.log('⚠️ No flight.data property in response');
          }
          
          if (!flights?.data || flights.data.length === 0) {
            console.log('⚠️ No flights found');
            return res.json({
              choices: [{
                message: {
                  role: 'assistant',
                  content: 'Certainly! I searched for flights but couldn\'t find any matching your criteria. Would you like to try different dates or airports?'
                }
              }]
            });
          }
          
          // Format the flights and return the response
          console.log('📝 Formatting flight results...');
          const formattedContent = formatFlights(flights, args.tripType);
          console.log('📤 Sending formatted response:', formattedContent);
          
          return res.json({
            choices: [{
              message: {
                role: 'assistant',
                content: formattedContent
              }
            }]
          });
        } catch (e) {
          console.error('❌ Error processing flight search:', e);
          return res.json({
            choices: [{
              message: {
                role: 'assistant',
                content: 'Certainly! I tried to search for flights, but the service is temporarily unavailable. Would you like to try again later or explore other travel options?'
              }
            }]
          });
        }
      } else {
        console.log('⚠️ Tool call is not searchFlights:', toolCall?.function?.name);
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

/*───────────────────  boot  ───────────────────────*/
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`🌐 API listening on port ${PORT}`));