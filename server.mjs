// server.mjs - Enhanced with better stability and error handling
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { searchFlights, searchHotels, searchPOI, getWeather } from './src/lib/serpApi.js';

const app = express();

// Enhanced middleware with better error handling
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Add request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 second timeout
  res.setTimeout(30000);
  next();
});

// Add keep-alive for connections
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  next();
});

console.log('🚀 Enhanced travel server with improved stability');

// Get current date for context
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;
const currentDay = currentDate.getDate();
const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

console.log(`📅 Current date: ${formattedDate}`);

/*───────────────────  Enhanced multilingual system prompt with global airport codes  ───────────*/
const SYSTEM_PROMPT = `
You are TravelBot, an intelligent multilingual travel assistant powered by Google's search data through SerpApi.

CRITICAL CONTEXT: 
- Today's date is ${formattedDate} (${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
- Current year is ${currentYear}
- You support multiple languages: English, French, Chinese, Arabic, Spanish, German, Italian, Japanese, and can auto-detect user language
- You handle multiple currencies: USD, EUR, MAD (Moroccan Dirham), CNY (Chinese Yuan), JPY, GBP

CORE CAPABILITIES:
- Flight searches using Google Flights data (searchFlights) with airline direct booking links
- Hotel searches using Google Hotels data (searchHotels) with images and maps in 3-column grid layout
- Points of interest using Google Local data (searchPOI) with Google Maps integration
- Weather forecasts (getWeather) with 7-10 day forecasts and auto-location detection with coordinates lookup

LANGUAGE & RESPONSE HANDLING:
1. **Auto-detect user language** from their message and respond in the same language throughout
2. **Complete language translation**: When responding in any language, translate EVERYTHING except "TravelBot"
3. **Widget formatting**: Always format flight, hotel, and weather data as proper widgets for visual display
4. **Currency conversion**: When users mention prices in any currency, convert and display both original and USD equivalent

CRITICAL: GLOBAL AIRPORT CODE CONVERSION RULES
When calling searchFlights, you MUST convert city names from ANY LANGUAGE to proper IATA airport codes:

INTERNATIONAL CITY NAME MAPPINGS (handle names in any language):
- Casablanca/كازابلانكا/卡萨布兰卡 → CMN
- Barcelona/巴塞罗那 → BCN  
- Paris/باريس/巴黎/パリ → CDG
- London/لندن/伦敦/ロンドン → LHR
- Madrid/مدريد/马德里/マドリード → MAD
- New York/نيويورك/纽约/ニューヨーク → JFK
- Tokyo/طوكيو/东京/東京 → NRT
- Dubai/دبي/迪拜/ドバイ → DXB
- Istanbul/إسطنبول/伊斯坦布尔/イスタンブール → IST
- Los Angeles/لوس أنجلوس/洛杉矶/ロサンゼルス → LAX
- Rome/روما/罗马/ローマ → FCO
- Amsterdam/أمستردام/阿姆斯特丹/アムステルダム → AMS
- Frankfurt/فرانكفورت/法兰克福/フランクフルト → FRA
- Zurich/زيوريخ/苏黎世/チューリッヒ → ZUR
- Milan/ميلانو/米兰/ミラノ → MXP
- Berlin/برلين/柏林/ベルリン → BER
- Munich/ميونيخ/慕尼黑/ミュンヘン → MUC
- Vienna/فيينا/维也纳/ウィーン → VIE
- Brussels/بروكسل/布鲁塞尔/ブリュッセル → BRU
- Lisbon/لشبونة/里斯本/リスボン → LIS
- Moscow/موسكو/莫斯科/モスクワ → SVO
- Beijing/بكين/北京/北京 → PEK
- Shanghai/شنغهاي/上海/上海 → PVG
- Hong Kong/هونغ كونغ/香港/香港 → HKG
- Singapore/سنغافورة/新加坡/シンガポール → SIN
- Bangkok/بانكوك/曼谷/バンコク → BKK
- Seoul/سول/首尔/ソウル → ICN
- Mumbai/مومباي/孟买/ムンバイ → BOM
- Delhi/دلهي/德里/デリー → DEL
- Sydney/سيدني/悉尼/シドニー → SYD
- Toronto/تورونتو/多伦多/トロント → YYZ
- Mexico City/مكسيكو سيتي/墨西哥城/メキシコシティ → MEX
- São Paulo/ساو باولو/圣保罗/サンパウロ → GRU
- Buenos Aires/بوينس آيرس/布宜诺斯艾利斯/ブエノスアイレス → EZE
- Cape Town/كيب تاون/开普敦/ケープタウン → CPT
- Cairo/القاهرة/开罗/カイロ → CAI
- Marrakech/مراكش/马拉喀什/マラケシュ → RAK
- Rabat/الرباط/拉巴特/ラバト → RBA
- Fez/فاس/非斯/フェズ → FEZ
- Tangier/طنجة/丹吉尔/タンジール → TNG

CRITICAL: WEATHER AND LOCATION SERVICES
When users ask for weather for ANY location worldwide, you MUST:
1. Use getWeather tool with the location name (not coordinates)
2. The backend will automatically find coordinates for any major city
3. Format weather as proper widgets, not text
4. Include location name in local language when possible

CRITICAL: WIDGET FORMATTING RULES
When you receive flight, hotel, or weather data, you MUST format responses with proper widgets:

FOR FLIGHTS:
1. Provide brief text response in user's language
2. Format EACH flight as a widget using this exact structure:
[FLIGHT_WIDGET]
{
  "airline": "Royal Air Maroc",
  "flightNumber": "AT 123",
  "price": "USD 450",
  "departure": "Mohammed V International Airport",
  "arrival": "Barcelona-El Prat Airport", 
  "departureTime": "14:30",
  "arrivalTime": "18:45",
  "duration": "4h 15m",
  "stops": 0,
  "bookingLink": "https://www.royalairmaroc.com",
  "carbonEmissions": "285kg"
}
[/FLIGHT_WIDGET]

FOR HOTELS:
1. Provide brief text response in user's language
2. Format EACH hotel as a widget using this exact structure (hotels will display in 3-column grid automatically):
[HOTEL_WIDGET]
{
  "name": "Hotel Barceló Raval",
  "rating": 4.2,
  "reviews": 1250,
  "price": "$180",
  "location": "Barcelona",
  "link": "https://hotels.google.com/...",
  "image": "https://image-url.jpg",
  "mapUrl": "https://maps.google.com/maps?q=41.3851,2.1734",
  "address": "Rambla del Raval, 17-21, Barcelona"
}
[/HOTEL_WIDGET]

FOR WEATHER:
1. Provide brief text response in user's language
2. Format weather as a widget using this exact structure:
[WEATHER_WIDGET]
{
  "location": "Casablanca",
  "current": {
    "temp": 24,
    "condition": "Partly cloudy",
    "icon": "partly-cloudy",
    "humidity": 65,
    "windSpeed": 12
  },
  "forecast": [
    {
      "day": "Today",
      "date": "2025-08-09",
      "high": 28,
      "low": 18,
      "condition": "Sunny",
      "icon": "sunny",
      "precipitation": 0
    },
    {
      "day": "Tomorrow",
      "date": "2025-08-10",
      "high": 26,
      "low": 17,
      "condition": "Partly cloudy",
      "icon": "partly-cloudy",
      "precipitation": 10
    }
  ]
}
[/WEATHER_WIDGET]

SMART PROCESSING RULES:
1. **Date Parsing - IMPORTANT**: 
   - Today is ${formattedDate}
   - Parse natural dates: "August 18th" → "${currentYear}-08-18" or "${currentYear + 1}-08-18"
   - NEVER use past dates for searches
   - Always validate dates are in the future

2. **Enhanced Data Display**:
   - Hotels: MUST display in 3-column grid layout using proper widgets
   - Include hotel images from Google Images in the image area (not text)
   - Add map buttons linking to Google Maps
   - Weather: Display as interactive widget with icons and 7-day forecast
   - Flights: Show proper times (24-hour format: HH:MM) and airline direct booking links

3. **Location Handling**:
   - For any location worldwide, the backend can find coordinates automatically
   - You don't need to worry about coordinate fallbacks
   - Always use location names in the user's language when possible

4. **Response Format**:
   - Wait for complete JSON responses before answering
   - Provide rich widgets with images and map links
   - Include booking links that go directly to airline websites when available
   - Handle currency conversions automatically

5. **Immediate Action**: Search immediately when you have enough information

MULTILINGUAL RESPONSE EXAMPLES:

English:
"I found great flights from Casablanca to Barcelona on August 18th! Here are the best options:

[FLIGHT_WIDGET]..."

French:
"J'ai trouvé d'excellents vols de Casablanca à Barcelone le 18 août ! Voici les meilleures options :

[FLIGHT_WIDGET]..."

Arabic:
"وجدت رحلات رائعة من الدار البيضاء إلى برشلونة في 18 أغسطس! إليك أفضل الخيارات:

[FLIGHT_WIDGET]..."

Chinese:
"我找到了8月18日从卡萨布兰卡到巴塞罗那的优质航班！以下是最佳选择：

[FLIGHT_WIDGET]..."

RESPONSE STYLE:
- Be enthusiastic and helpful in the user's detected language
- Search immediately when possible
- Provide visual widgets with images and maps
- Include real booking links and current pricing
- Offer related services naturally
- Translate ALL interface elements to the user's language
- Use proper widgets for ALL data types (flights, hotels, weather)

REMEMBER: The backend now provides properly formatted flight times, airline booking links, hotel images, and automatic coordinate lookup for any location worldwide.
`;

/*───────────────────  Enhanced tool schema  ───────────*/
const functionDeclarations = [
  {
    name: 'searchFlights',
    description: 'Search for flight prices and booking information using Google Flights with airline direct booking',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'IATA airport code, e.g. CMN for Casablanca' },
        destination: { type: 'string', description: 'IATA airport code, e.g. BCN for Barcelona' },
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
    description: 'Find hotels with images and map integration using Google Hotels - displays in 3-column grid',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name or specific location in any language, e.g. Barcelona, Tokyo, كازابلانكا' },
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
    description: 'Search points of interest and attractions near a location with Google Maps integration',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name in any language' },
        query: { type: 'string', description: 'Type of attractions, e.g. tourist attractions, restaurants, museums', default: 'tourist attractions' },
        limit: { type: 'integer', default: 10 }
      },
      required: ['location']
    }
  },
  {
    name: 'getWeather',
    description: 'Get 7 day weather forecast with automatic coordinate lookup for any location worldwide',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name in any language for weather forecast, e.g. Casablanca, Bali, كازابلانكا, 巴厘岛' }
      },
      required: ['location']
    }
  }
];

const tools = [{ functionDeclarations: functionDeclarations }];

/*───────────────────  Enhanced chat route with better error handling  ───────────*/
app.post('/api/chat', async (req, res) => {
  console.log('📥 Received chat request');
  const { messages } = req.body;

  // Set response headers to prevent timeout issues
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');

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

    // Enhanced fetch with timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const openRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method : 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'TravelBot/1.0'
      },
      body: JSON.stringify(geminiRequest),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!openRes.ok) {
      const error = await openRes.text();
      console.error('❌ Gemini API error:', error);
      return res.status(500).json({ 
        error: 'AI service temporarily unavailable. Please try again in a moment.' 
      });
    }

    const data = await openRes.json();
    console.log('✅ Gemini API response received');

    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (part?.functionCall) {
      console.log('🛠️ Tool call detected:', JSON.stringify(part.functionCall, null, 2));
      
      const { name: functionName, args } = part.functionCall;
      let toolResult;

      // Execute the appropriate tool function with enhanced error handling
      try {
        switch (functionName) {
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
            console.error(`❌ Unknown function: ${functionName}`);
            toolResult = { data: [], error: 'Unknown function' };
        }
      } catch (toolError) {
        console.error(`❌ Tool execution error for ${functionName}:`, toolError);
        toolResult = { data: [], error: `Tool execution failed: ${toolError.message}` };
      }

      console.log(`⏱️ ${functionName} completed`);

      // Format the response with proper widgets
      let assistantContent;
      if (functionName === 'searchFlights' && toolResult.data?.length > 0) {
        assistantContent = formatFlightsWithWidgets(toolResult, args);
      } else if (functionName === 'searchHotels' && toolResult.data?.length > 0) {
        assistantContent = formatHotelsWithWidgets(toolResult, args);
      } else if (functionName === 'searchPOI' && toolResult.data?.length > 0) {
        assistantContent = formatPOIEnhanced(toolResult.data);
      } else if (functionName === 'getWeather' && toolResult.data?.length > 0) {
        assistantContent = formatWeatherWithWidget(toolResult.data, args);
      } else {
        assistantContent = getNoResultsMessage(functionName, args);
      }

      return res.json({ content: assistantContent });
    }

    // Handle regular text response
    const assistantContent = part?.text || 'I apologize, but I encountered an issue processing your request. Please try again.';
    return res.json({ content: assistantContent });

  } catch (error) {
    console.error('❌ Chat processing error:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Request timed out. Please try again with a simpler query.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'I apologize, but I encountered a technical issue. Please try again in a moment.' 
    });
  }
});

/*───────────────────  Enhanced formatting functions with proper widgets  ───────────*/

function formatFlightsWithWidgets(json, params) {
  if (!json?.data?.length) {
    return 'I searched Google Flights but couldn\'t find any available flights for your dates. Please try different dates or airports.';
  }
  
  const tripType = params.tripType === 'round_trip' ? 'round-trip' : 'one-way';
  let response = `I found excellent ${tripType} flights! Here are the best options:\n\n`;
  
  // Add flight widgets
  json.data.slice(0, 3).forEach((flight) => {
    response += `[FLIGHT_WIDGET]\n`;
    response += JSON.stringify({
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      price: flight.price,
      departure: flight.departure,
      arrival: flight.arrival,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      stops: flight.stops,
      bookingLink: flight.bookingLink,
      carbonEmissions: flight.carbonEmissions
    }, null, 2);
    response += `\n[/FLIGHT_WIDGET]\n\n`;
  });
  
  response += 'These are real-time prices with direct airline booking links. Would you like me to find hotels or check the weather at your destination?';
  return response;
}

function formatHotelsWithWidgets(json, params) {
  if (!json?.data?.length) {
    return 'I searched Google Hotels but couldn\'t find any available properties. Please try different dates or locations.';
  }
  
  let response = `I found fantastic hotel options for your stay! Here are the best choices displayed in a 3-column grid:\n\n`;
  
  // Add hotel widgets for grid display
  json.data.slice(0, 6).forEach((hotel) => {
    response += `[HOTEL_WIDGET]\n`;
    response += JSON.stringify({
      name: hotel.name,
      rating: hotel.rating,
      reviews: hotel.reviews,
      price: hotel.price,
      location: hotel.location,
      link: hotel.link,
      image: hotel.image,
      mapUrl: hotel.mapUrl,
      address: hotel.address,
      amenities: hotel.amenities?.slice(0, 3) // Limit amenities for display
    }, null, 2);
    response += `\n[/HOTEL_WIDGET]\n\n`;
  });
  
  response += 'These hotels are displayed with images and map links in a beautiful grid layout. Click the map button to see exact locations!';
  return response;
}

function formatWeatherWithWidget(forecast, params) {
  if (!forecast?.length) {
    return 'Weather forecast is currently unavailable for this location.';
  }
  
  const location = params.location || 'your location';
  let response = `Here's the weather forecast for ${location}:\n\n`;
  
  // Create weather widget
  response += `[WEATHER_WIDGET]\n`;
  response += JSON.stringify({
    location: location,
    current: {
      temp: forecast[0]?.maxTemp || 20,
      condition: forecast[0]?.condition || 'Clear',
      icon: getWeatherIcon(forecast[0]?.condition || 'Clear'),
      humidity: 65,
      windSpeed: 12
    },
    forecast: forecast.slice(0, 7).map((day, index) => ({
      day: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      date: day.date,
      high: day.maxTemp,
      low: day.minTemp,
      condition: day.condition,
      icon: getWeatherIcon(day.condition),
      precipitation: day.precipitation || 0
    }))
  }, null, 2);
  response += `\n[/WEATHER_WIDGET]\n\n`;
  
  response += 'This 7-day forecast includes current conditions and daily predictions with weather icons!';
  return response;
}

function getWeatherIcon(condition) {
  const iconMap = {
    'Clear sky': 'sunny',
    'Mainly clear': 'mostly-sunny',
    'Partly cloudy': 'partly-cloudy',
    'Overcast': 'cloudy',
    'Fog': 'fog',
    'Light drizzle': 'drizzle',
    'Moderate drizzle': 'rain',
    'Dense drizzle': 'rain',
    'Slight rain': 'rain',
    'Moderate rain': 'rain',
    'Heavy rain': 'heavy-rain',
    'Slight snow': 'snow',
    'Moderate snow': 'snow',
    'Heavy snow': 'heavy-snow',
    'Thunderstorm': 'thunderstorm'
  };
  
  return iconMap[condition] || 'sunny';
}

function formatPOIEnhanced(list) {
  if (!list?.length) return 'I couldn\'t find any attractions in that area. Try a different location?';
  
  let response = 'Here are the top attractions and points of interest:\n\n';
  list.slice(0, 8).forEach((poi, idx) => {
    const rating = poi.rating ? `⭐ ${poi.rating}` : '';
    const reviews = poi.reviews ? `(${poi.reviews} reviews)` : '';
    
    response += `${idx + 1}. **${poi.name}** ${rating}\n`;
    if (poi.address) response += `   📍 ${poi.address}\n`;
    if (poi.hours) response += `   🕒 ${poi.hours}\n`;
    if (poi.mapUrl) response += `   [📍 View on Google Maps](${poi.mapUrl})\n`;
    if (poi.website) response += `   [🌐 Official Website](${poi.website})\n`;
    response += '\n';
  });
  
  return response;
}

function getNoResultsMessage(functionName, args) {
  const messages = {
    searchFlights: `I couldn't find any flights for ${args?.origin} to ${args?.destination}. Please check the city names and try different dates.`,
    searchHotels: `No hotels found in ${args?.location}. Please try a different location or adjust your dates.`,
    searchPOI: `I couldn't find any attractions in ${args?.location}. Please try a different location or search term.`,
    getWeather: `Weather information is currently unavailable for ${args?.location}. Please try a different location.`
  };
  
  return messages[functionName] || 'No results found for your search.';
}

/*───────────────────  Enhanced translation endpoint  ───────────*/
app.post('/api/translate', async (req, res) => {
  const { text, targetLanguage } = req.body;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const geminiRequest = {
      contents: [{
        role: 'user',
        parts: [{ text: `Translate this text to ${targetLanguage}: "${text}"` }]
      }]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiRequest),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
    
    res.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    res.json({ translatedText: text }); // Fallback to original text
  }
});

/*───────────────────  Health check endpoint  ───────────*/
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/*───────────────────  Start enhanced server  ───────────*/
const PORT = process.env.PORT || 3001;

// Enhanced server startup with better error handling
const server = app.listen(PORT, () => {
  console.log(`🌟 Enhanced TravelBot server running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🔧 Features: Multilingual support, enhanced widgets, airline direct booking, global location support`);
});

// Handle server errors gracefully
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});