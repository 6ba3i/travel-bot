// server.mjs - Enhanced with language support, currency conversion, and improved tool handling
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { searchFlights, searchHotels, searchPOI, getWeather } from './src/lib/serpApi.js';

const app = express();
app.use(cors());
app.use(express.json());

console.log('🚀 Enhanced travel server with multilingual support');

// Get current date for context
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;
const currentDay = currentDate.getDate();
const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

console.log(`📅 Current date: ${formattedDate}`);

// Currency conversion helper using live rates
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    // Using a free currency API - you can replace with your preferred service
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    
    if (data.rates && data.rates[toCurrency]) {
      return (amount * data.rates[toCurrency]).toFixed(2);
    }
    
    // Fallback to rough estimates if API fails
    const roughRates = {
      'USD_EUR': 0.85, 'USD_MAD': 10.2, 'USD_CNY': 7.3,
      'EUR_USD': 1.18, 'EUR_MAD': 11.8, 'EUR_CNY': 8.5,
      'MAD_USD': 0.098, 'MAD_EUR': 0.085, 'MAD_CNY': 0.72,
      'CNY_USD': 0.137, 'CNY_EUR': 0.118, 'CNY_MAD': 1.39
    };
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    return roughRates[rateKey] ? (amount * roughRates[rateKey]).toFixed(2) : amount;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount; // Return original amount if conversion fails
  }
}

/*───────────────────  Enhanced travel prompt with multilingual & currency support  ───────────*/
const SYSTEM_PROMPT = `
You are TravelBot, an intelligent multilingual travel assistant powered by Google's search data through SerpApi.

CRITICAL CONTEXT: 
- Today's date is ${formattedDate} (${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
- Current year is ${currentYear}
- You support multiple languages: English, French, Chinese, and can auto-detect user language
- You handle multiple currencies: USD, EUR, MAD (Moroccan Dirham), CNY (Chinese Yuan)

CORE CAPABILITIES:
- Flight searches using Google Flights data (searchFlights)
- Hotel searches using Google Hotels data (searchHotels) with images and maps
- Points of interest using Google Local data (searchPOI) with Google Maps integration
- Weather forecasts (getWeather) with 7-10 day forecasts and auto-location detection

LANGUAGE & CURRENCY HANDLING:
1. **Auto-detect user language** from their message and respond in the same language
2. **Currency conversion**: When users mention prices in EUR, MAD, CNY, etc., convert and display both original and USD equivalent
3. **Location awareness**: Auto-detect coordinates from city names for weather and maps

SMART PROCESSING RULES:
1. **Airport/City Code Conversion**: Convert automatically:
   - Casablanca = CMN, Barcelona = BCN, Paris = CDG, London = LHR
   - New York = JFK, Madrid = MAD, Tokyo = NRT, Dubai = DXB, etc.

2. **Date Parsing - IMPORTANT**: 
   - Today is ${formattedDate}
   - Parse natural dates: "August 18th" → "${currentYear}-08-18" or "${currentYear + 1}-08-18"
   - NEVER use past dates for searches
   - Always validate dates are in the future

3. **Enhanced Data Display**:
   - Hotels: Show in rows of 3, maximum 6 options
   - Include hotel images from Google Images
   - Add map buttons linking to Google Maps
   - Weather: Display 7-day forecast with modern design
   - Flights: Show actual departure/arrival cities, not placeholders

4. **Response Format**:
   - Wait for complete JSON responses before answering
   - Provide rich widgets with images and map links
   - Include booking links that go directly to Google Flights/Hotels
   - Handle currency conversions automatically

5. **Immediate Action**: Search immediately when you have enough information

RESPONSE STYLE:
- Be enthusiastic and helpful in the user's detected language
- Search immediately when possible
- Provide visual widgets with images and maps
- Include real booking links and current pricing
- Offer related services naturally

If you cannot determine required information, ask for clarification in the user's language.
`;

/*───────────────────  Enhanced tool schema with new parameters  ───────────*/
const functionDeclarations = [
  {
    name: 'searchFlights',
    description: 'Search for flight prices and booking information using Google Flights',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'IATA airport code or city name, e.g. CMN, Casablanca' },
        destination: { type: 'string', description: 'IATA airport code or city name, e.g. BCN, Barcelona' },
        date: { type: 'string', description: 'Departure date in YYYY-MM-DD format' },
        returnDate: { type: 'string', description: 'Return date in YYYY-MM-DD format for round trips' },
        adults: { type: 'integer', default: 1, description: 'Number of adult passengers' },
        tripType: { type: 'string', enum: ['one_way', 'round_trip'], default: 'one_way' }
      },
      required: ['origin', 'destination', 'date']
    }
  },
  {
    name: 'searchHotels',
    description: 'Find hotels with images and map integration using Google Hotels',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name or specific location, e.g. "Barcelona" or "Paris"' },
        checkIn: { type: 'string', description: 'Check-in date in YYYY-MM-DD format' },
        checkOut: { type: 'string', description: 'Check-out date in YYYY-MM-DD format' },
        adults: { type: 'integer', default: 2, description: 'Number of adults' },
        children: { type: 'integer', default: 0, description: 'Number of children' }
      },
      required: ['location', 'checkIn', 'checkOut']
    }
  },
  {
    name: 'searchPOI',
    description: 'Search points of interest with Google Maps integration',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name or area, e.g. "Barcelona" or "Paris"' },
        query: { type: 'string', description: 'Type of attractions, e.g. "museums", "restaurants", "tourist attractions"', default: 'tourist attractions' },
        limit: { type: 'integer', default: 10, description: 'Number of results to return' }
      },
      required: ['location']
    }
  },
  {
    name: 'getWeather',
    description: 'Get 7-day weather forecast with auto-location detection',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude (optional if city provided)' },
        lon: { type: 'number', description: 'Longitude (optional if city provided)' },
        city: { type: 'string', description: 'City name for auto-coordinate detection' }
      },
      required: []
    }
  }
];

const tools = [{ functionDeclarations: functionDeclarations }];

/*───────────────────  Main chat route with enhanced processing  ───────────────────────*/
app.post('/api/chat', async (req, res) => {
  console.log('📥 Received chat request');
  const { messages, language = 'en' } = req.body;

  try {
    // Add language context to the system prompt
    const enhancedPrompt = SYSTEM_PROMPT + `\n\nUSER LANGUAGE: ${language === 'fr' ? 'French' : language === 'zh' ? 'Chinese' : 'English'} - Respond in this language.`;

    const geminiRequest = {
      systemInstruction: { parts: [{ text: enhancedPrompt }] },
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      tools,
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } }
    };

    const openRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
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
          console.warn(`⚠️ Date ${args.date || args.checkIn} is in the past! Adjusting...`);
          const tomorrow = new Date(currentDate);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (name === 'searchFlights') {
            args.date = tomorrow.toISOString().split('T')[0];
          } else {
            args.checkIn = tomorrow.toISOString().split('T')[0];
          }
        }
      }

      let toolResult;
      const startTime = Date.now();

      try {
        switch (name) {
          case 'searchFlights':
            toolResult = await searchFlights(args);
            break;
          case 'searchHotels':
            toolResult = await searchHotels(args);
            break;
          case 'searchPOI':
            toolResult = await searchPOI(args);
            break;
          case 'getWeather':
            toolResult = await getWeather(args);
            break;
          default:
            toolResult = { error: `Unknown tool: ${name}` };
        }
      } catch (toolError) {
        console.error(`❌ ${name} error:`, toolError.message);
        toolResult = { error: toolError.message };
      }

      const endTime = Date.now();
      console.log(`⏱️ ${name} completed in ${endTime - startTime}ms`);

      // Enhanced response with currency and format improvements
      let formattedResponse;
      
      if (name === 'searchFlights') {
        formattedResponse = await formatFlightsEnhanced(toolResult, args);
      } else if (name === 'searchHotels') {
        formattedResponse = await formatHotelsEnhanced(toolResult, args);
      } else if (name === 'searchPOI') {
        formattedResponse = formatPOIEnhanced(toolResult);
      } else if (name === 'getWeather') {
        formattedResponse = formatWeatherEnhanced(toolResult);
      } else {
        formattedResponse = JSON.stringify(toolResult, null, 2);
      }

      return res.json({ content: formattedResponse });
    }

    // Regular text response
    const assistantContent = part.text || 'I encountered an issue processing your request.';
    return res.json({ content: assistantContent });

  } catch (error) {
    console.error('❌ Chat processing error:', error);
    return res.status(500).json({ 
      error: 'I apologize, but I encountered a technical issue. Please try again.' 
    });
  }
});

/*───────────────────  Enhanced formatting functions  ───────────────────────*/
async function formatFlightsEnhanced(json, params) {
  if (!json?.data?.length) {
    return 'I searched Google Flights but couldn\'t find any available flights. Please try different dates or airports.';
  }
  
  const tripType = params.tripType === 'round_trip' ? 'round-trip' : 'one-way';
  let response = `Here are the best ${tripType} flights from Google Flights:\n\n`;
  
  json.data.slice(0, 3).forEach((f, index) => {
    const price = f.price.total_amount;
    const currency = f.price.currency;
    const route = f.routes[0];
    const stops = route.stops === 0 ? 'Nonstop' : `${route.stops} stop${route.stops > 1 ? 's' : ''}`;
    
    response += `${index + 1}. **${currency} ${price}** - ${route.airline}\n`;
    response += `   • ${route.departure} → ${route.arrival}\n`;
    response += `   • ${route.duration} flight, ${stops}\n`;
    if (f.carbon_emissions) {
      response += `   • ${f.carbon_emissions}kg CO₂ emissions\n`;
    }
    response += `   • [Book this flight](${f.booking_link})\n\n`;
  });
  
  response += 'These are real-time prices from Google Flights. Would you like me to find hotels or weather at your destination?';
  return response;
}

async function formatHotelsEnhanced(json, params) {
  if (!json?.data?.length) {
    return 'I searched Google Hotels but couldn\'t find any available hotels. Try different dates or locations?';
  }
  
  let response = 'Here are the best hotel options with images and maps:\n\n';
  
  json.data.slice(0, 6).forEach((h, idx) => {
    const offer = h.offers?.[0] || {};
    const price = offer.price?.total || 'Price not available';
    const rating = h.hotel.rating ? `⭐ ${h.hotel.rating}` : '';
    const images = h.images || [];
    
    response += `${idx + 1}. **${h.hotel.name}** ${rating}\n`;
    response += `   • $${price} per night\n`;
    if (h.hotel.reviews) response += `   • ${h.hotel.reviews} reviews\n`;
    if (h.hotel.address) response += `   • ${h.hotel.address}\n`;
    if (images.length > 0) response += `   • [Hotel Image](${images[0].url})\n`;
    if (h.mapUrl) response += `   • [📍 View on Map](${h.mapUrl})\n`;
    if (offer.url) response += `   • [View & Book](${offer.url})\n`;
    response += '\n';
  });
  
  return response;
}

function formatPOIEnhanced(list) {
  if (!list?.length) return 'I couldn\'t find any attractions in that area.';
  
  let response = 'Here are top attractions with Google Maps links:\n\n';
  list.slice(0, 5).forEach((p, idx) => {
    const rating = p.rating ? `⭐ ${p.rating}` : '';
    const reviews = p.reviews ? `(${p.reviews} reviews)` : '';
    
    response += `${idx + 1}. **${p.name}** ${rating} ${reviews}\n`;
    if (p.address) response += `   • ${p.address}\n`;
    if (p.mapUrl) response += `   • [📍 View on Map](${p.mapUrl})\n`;
    if (p.website) response += `   • [Visit Website](${p.website})\n`;
    response += '\n';
  });
  
  return response;
}

function formatWeatherEnhanced(json) {
  if (!json?.daily?.length) return 'Weather data unavailable.';
  
  let response = 'Here\'s your 7-day weather forecast:\n\n';
  
  // Current weather
  if (json.current) {
    const current = json.current;
    const temp = Math.round(current.temp);
    const desc = current.weather?.[0]?.description || '';
    response += `**Now**: ${temp}°C, ${desc}\n\n`;
  }
  
  // 7-day forecast
  json.daily.slice(0, 7).forEach((d, idx) => {
    const date = new Date(d.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const desc = d.weather?.[0]?.description || '';
    const min = Math.round(d.temp?.min);
    const max = Math.round(d.temp?.max);
    
    response += `**${dayName} ${monthDay}**: ${desc}, ${min}°C–${max}°C\n`;
  });
  
  return response;
}

/*───────────────────  Language switching endpoint  ───────────────────────*/
app.post('/api/translate', async (req, res) => {
  const { text, targetLanguage } = req.body;
  
  try {
    const geminiRequest = {
      contents: [{
        role: 'user',
        parts: [{ text: `Translate this text to ${targetLanguage}: "${text}"` }]
      }]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiRequest)
    });

    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
    
    res.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    res.json({ translatedText: text }); // Fallback to original text
  }
});

/*───────────────────  Start enhanced server  ───────────────────────*/
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`🌐 Enhanced multilingual travel server on port ${PORT}`));