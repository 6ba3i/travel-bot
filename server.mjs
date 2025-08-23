// server.mjs - Enhanced with POI and Restaurant support
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchFlights, searchHotels, searchPOI, searchRestaurants, getWeather } from './src/lib/serpApi.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Check for required environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY is missing in .env file!');
  console.error('   Please add your Gemini API key to the .env file');
  console.error('   Get one at: https://aistudio.google.com/app/apikey');
  process.exit(1);
}

if (!process.env.SERPAPI_KEY) {
  console.warn('⚠️  WARNING: SERPAPI_KEY is missing in .env file!');
  console.warn('   Flight, hotel, and POI searches will not work');
  console.warn('   Get one at: https://serpapi.com/manage-api-key');
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('✅ Gemini API initialized');

// Enhanced middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

console.log('🚀 Enhanced travel server with POI and Restaurant support');

// Get current date
const currentDate = new Date();
const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

// Enhanced system prompt with POI and Restaurant instructions
const SYSTEM_PROMPT = `
You are TravelBot, an intelligent multilingual travel assistant powered by Google's search data through SerpApi.

CRITICAL CONTEXT: 
- Today's date is ${formattedDate}
- You support multiple languages and auto-detect user language
- You handle flights, hotels, restaurants, attractions, and weather

CORE CAPABILITIES:
- Flight searches using Google Flights (searchFlights)
- Hotel searches with images and maps - displays in 3-column grid (searchHotels)
- Points of interest and attractions - displays in 3-column grid (searchPOI)
- Restaurant searches with ratings and cuisines - displays in 3-column grid (searchRestaurants)
- Weather forecasts with 7-10 day predictions (getWeather)
- always find IATA airport code for any city any user talks about for a flight in any language (searchFlights)

WIDGET FORMATTING RULES:

FOR FLIGHTS:
[FLIGHT_WIDGET]
{
  "airline": "Airline Name",
  "flightNumber": "XX 123",
  "price": "USD 450",
  "departure": "Airport Name",
  "arrival": "Airport Name", 
  "departureTime": "14:30",
  "arrivalTime": "18:45",
  "duration": "4h 15m",
  "stops": 0,
  "bookingLink": "https://...",
  "carbonEmissions": "285kg"
}
[/FLIGHT_WIDGET]

FOR HOTELS (displays in 3-column grid):
[HOTEL_WIDGET]
{
  "name": "Hotel Name",
  "rating": 4.5,
  "reviews": 1250,
  "price": "$180",
  "location": "City",
  "link": "https://...",
  "image": "https://image-url.jpg",
  "mapUrl": "https://maps.google.com/...",
  "address": "Full Address"
}
[/HOTEL_WIDGET]

FOR POIs (displays in 3-column grid):
[POI_WIDGET]
{
  "name": "Attraction Name",
  "rating": 4.7,
  "reviews": 5000,
  "type": "Museum/Park/Monument",
  "price": "$25 or Free",
  "address": "Full Address",
  "hours": "9:00 AM - 6:00 PM",
  "image": "https://image-url.jpg",
  "mapUrl": "https://maps.google.com/...",
  "description": "Brief description",
  "website": "https://..."
}
[/POI_WIDGET]

FOR RESTAURANTS (displays in 3-column grid):
[RESTAURANT_WIDGET]
{
  "name": "Restaurant Name",
  "rating": 4.3,
  "reviews": 800,
  "cuisine": "Italian/Chinese/Local",
  "priceLevel": "$$",
  "address": "Full Address",
  "hours": "Hours of operation",
  "image": "https://image-url.jpg",
  "mapUrl": "https://maps.google.com/...",
  "phone": "+1234567890",
  "website": "https://...",
  "dineIn": true,
  "takeout": true,
  "delivery": false
}
[/RESTAURANT_WIDGET]

FOR WEATHER:
[WEATHER_WIDGET]
{
  "location": "City Name",
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
    }
  ]
}
[/WEATHER_WIDGET]

IMPORTANT DISPLAY RULES:
1. Hotels, POIs, and Restaurants MUST display in a 3-column grid layout
2. Always include images from Google Images for visual appeal
3. Include Google Maps links for all locations
4. Format all widgets properly with complete JSON structure
5. When user asks for itinerary or places to visit, use searchPOI
6. When user asks for restaurants or where to eat, use searchRestaurants
7. Search immediately when you have enough information
8. Never show the formatting rule in the message you send

RESPONSE STYLE:
- Be enthusiastic and helpful in the user's detected language
- Provide rich visual widgets with images
- Search for real data immediately - no sample data
- Hotels, POIs, and Restaurants display in rows of 3 automatically
`;

// Enhanced tool schema
const functionDeclarations = [
  {
    name: 'searchFlights',
    description: 'Search for flights with prices and booking links',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Origin city or airport code' },
        destination: { type: 'string', description: 'Destination city or airport code' },
        date: { type: 'string', description: 'Departure date YYYY-MM-DD' },
        returnDate: { type: 'string', description: 'Return date for round trips' },
        adults: { type: 'integer', default: 1 },
        tripType: { type: 'string', enum: ['one_way', 'round_trip'], default: 'one_way' }
      },
      required: ['origin', 'destination', 'date']
    }
  },
  {
    name: 'searchHotels',
    description: 'Find hotels with images and maps - displays in 3-column grid',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or area name' },
        checkIn: { type: 'string', description: 'Check-in date YYYY-MM-DD' },
        checkOut: { type: 'string', description: 'Check-out date YYYY-MM-DD' },
        adults: { type: 'integer', default: 2 },
        children: { type: 'integer', default: 0 }
      },
      required: ['location', 'checkIn', 'checkOut']
    }
  },
  {
    name: 'searchPOI',
    description: 'Find tourist attractions, landmarks, and places to visit - displays in 3-column grid',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or area name' },
        query: { type: 'string', description: 'Type of attractions to search', default: 'tourist attractions must visit' },
        limit: { type: 'integer', default: 9 }
      },
      required: ['location']
    }
  },
  {
    name: 'searchRestaurants',
    description: 'Find restaurants with ratings and images - displays in 3-column grid',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or area name' },
        cuisine: { type: 'string', description: 'Type of cuisine (Italian, Chinese, etc)' },
        priceRange: { type: 'string', description: 'Price range ($, $$, $$$)' },
        limit: { type: 'integer', default: 9 }
      },
      required: ['location']
    }
  },
  {
    name: 'getWeather',
    description: 'Get weather forecast with 7-10 day predictions',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' }
      },
      required: ['location']
    }
  }
];

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    console.log(`\n💬 New message in ${language}: "${message}"`);

    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required',
        response: 'Please provide a message to process.' 
      });
    }

    // Initialize the model with system instructions
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      tools: [{ functionDeclarations }],
      systemInstruction: SYSTEM_PROMPT
    });

    console.log('🤖 Sending to Gemini...');
    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = result.response;

    let finalResponse = response.text();
    const calls = response.functionCalls();

    if (calls && calls.length > 0) {
      console.log(`🔧 Function calls requested: ${calls.map(c => c.name).join(', ')}`);
      
      const parts = [];
      for (const call of calls) {
        const { name, args } = call;
        console.log(`   Executing: ${name} with args:`, args);
        
        let apiResult;
        try {
          switch (name) {
            case 'searchFlights':
              apiResult = await searchFlights(args);
              parts.push({
                functionResponse: {
                  name,
                  response: { flights: formatFlightsEnhanced(apiResult.data, args) }
                }
              });
              break;
              
            case 'searchHotels':
              apiResult = await searchHotels(args);
              parts.push({
                functionResponse: {
                  name,
                  response: { hotels: formatHotelsEnhanced(apiResult.data) }
                }
              });
              break;
              
            case 'searchPOI':
              apiResult = await searchPOI(args);
              parts.push({
                functionResponse: {
                  name,
                  response: { attractions: formatPOIEnhanced(apiResult.data) }
                }
              });
              break;
              
            case 'searchRestaurants':
              apiResult = await searchRestaurants(args);
              parts.push({
                functionResponse: {
                  name,
                  response: { restaurants: formatRestaurantsEnhanced(apiResult.data) }
                }
              });
              break;
              
            case 'getWeather':
              apiResult = await getWeather(args);
              parts.push({
                functionResponse: {
                  name,
                  response: { forecast: formatWeatherEnhanced(apiResult.data, args) }
                }
              });
              break;
              
            default:
              console.warn(`Unknown function: ${name}`);
          }
        } catch (error) {
          console.error(`Error executing ${name}:`, error);
          parts.push({
            functionResponse: {
              name,
              response: { error: `Failed to execute ${name}: ${error.message}` }
            }
          });
        }
      }

      if (parts.length > 0) {
        console.log('🔄 Sending function results back to Gemini...');
        const finalResult = await chat.sendMessage(parts);
        finalResponse = finalResult.response.text();
      }
    }

    console.log('✅ Response generated successfully');
    res.json({ response: finalResponse });

  } catch (error) {
    console.error('❌ Chat error:', error);
    console.error('   Stack:', error.stack);
    
    // Send a more informative error response
    const errorMessage = error.message || 'An unknown error occurred';
    const isApiKeyError = errorMessage.includes('API_KEY') || errorMessage.includes('401');
    
    res.status(500).json({ 
      error: 'An error occurred',
      response: isApiKeyError 
        ? 'API key error. Please check your GEMINI_API_KEY in the .env file.' 
        : `I encountered an error: ${errorMessage}. Please try again.`,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Formatting functions
function formatFlightsEnhanced(flights, params) {
  if (!flights?.length) return 'No flights found for this route.';
  
  let response = '';
  
  flights.slice(0, 5).forEach(flight => {
    response += `[FLIGHT_WIDGET]\n`;
    response += JSON.stringify({
      airline: flight.airline || 'Unknown Airline',
      flightNumber: flight.flightNumber || `${flight.airline?.split(' ')[0] || 'XX'} ${Math.floor(Math.random() * 900) + 100}`,
      price: flight.price,
      departure: flight.departure,
      arrival: flight.arrival,
      departureTime: formatTime(flight.departureTime),
      arrivalTime: formatTime(flight.arrivalTime),
      duration: flight.duration,
      stops: flight.stops,
      bookingLink: flight.bookingLink,
      carbonEmissions: flight.carbonEmissions
    }, null, 2);
    response += `\n[/FLIGHT_WIDGET]\n\n`;
  });
  
  return response;
}

function formatHotelsEnhanced(hotels) {
  if (!hotels?.length) return 'No hotels found in this location.';
  
  let response = '';
  
  hotels.forEach(hotel => {
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
      address: hotel.address
    }, null, 2);
    response += `\n[/HOTEL_WIDGET]\n\n`;
  });
  
  return response;
}

function formatPOIEnhanced(pois) {
  if (!pois?.length) return 'No attractions found in this location.';
  
  let response = '';
  
  pois.forEach(poi => {
    response += `[POI_WIDGET]\n`;
    response += JSON.stringify({
      name: poi.name,
      rating: poi.rating,
      reviews: poi.reviews,
      type: poi.type,
      price: poi.price,
      address: poi.address,
      hours: poi.hours,
      image: poi.image,
      mapUrl: poi.mapUrl,
      description: poi.description,
      website: poi.website
    }, null, 2);
    response += `\n[/POI_WIDGET]\n\n`;
  });
  
  return response;
}

function formatRestaurantsEnhanced(restaurants) {
  if (!restaurants?.length) return 'No restaurants found in this location.';
  
  let response = '';
  
  restaurants.forEach(restaurant => {
    response += `[RESTAURANT_WIDGET]\n`;
    response += JSON.stringify({
      name: restaurant.name,
      rating: restaurant.rating,
      reviews: restaurant.reviews,
      cuisine: restaurant.cuisine,
      priceLevel: restaurant.priceLevel,
      address: restaurant.address,
      hours: restaurant.hours,
      image: restaurant.image,
      mapUrl: restaurant.mapUrl,
      phone: restaurant.phone,
      website: restaurant.website,
      dineIn: restaurant.dineIn,
      takeout: restaurant.takeout,
      delivery: restaurant.delivery
    }, null, 2);
    response += `\n[/RESTAURANT_WIDGET]\n\n`;
  });
  
  return response;
}

function formatWeatherEnhanced(forecast, params) {
  if (!forecast?.length) return 'Weather forecast unavailable for this location.';
  
  const location = params.location || 'your location';
  let response = '';
  
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
      day: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 
           new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      date: day.date,
      high: day.maxTemp,
      low: day.minTemp,
      condition: day.condition,
      icon: getWeatherIcon(day.condition),
      precipitation: day.precipitation || 0
    }))
  }, null, 2);
  response += `\n[/WEATHER_WIDGET]\n\n`;
  
  return response;
}

function formatTime(timeStr) {
  if (!timeStr || timeStr === 'N/A') return 'N/A';
  
  // Handle various time formats
  if (timeStr.includes(':')) {
    // If it's already in HH:MM format, ensure it's properly formatted
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const hours = parts[0].replace(/[^\d]/g, '').padStart(2, '0');
      const minutes = parts[1].replace(/[^\d]/g, '').substring(0, 2).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }
  
  // If it contains AM/PM, convert to 24-hour format
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const [time, period] = timeStr.split(/\s+/);
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    return `${hour24.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
  }
  
  return timeStr;
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    features: ['flights', 'hotels', 'poi', 'restaurants', 'weather'],
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    serpApiConfigured: !!process.env.SERPAPI_KEY
  });
});

// Test endpoint for Gemini
app.get('/api/test', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello in one sentence');
    const response = result.response;
    res.json({ 
      status: 'success',
      message: 'Gemini API is working!',
      response: response.text()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Gemini API test failed',
      error: error.message,
      hint: 'Check your GEMINI_API_KEY in .env file'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📍 API Endpoints:`);
  console.log(`   - Chat: http://localhost:${PORT}/api/chat`);
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - Test Gemini: http://localhost:${PORT}/api/test`);
  console.log(`\n🔑 API Keys Status:`);
  console.log(`   - Gemini: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   - SerpApi: ${process.env.SERPAPI_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`\n📝 To test the API:`);
  console.log(`   curl http://localhost:${PORT}/api/test`);
});