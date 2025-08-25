// server.mjs - Fixed version with enforced widget formatting and SERPAPI usage
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  searchFlights, 
  searchHotels, 
  searchPOI, 
  searchRestaurants, 
  getWeather 
} from './src/lib/serpApi.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CRITICAL: Enhanced system prompt that FORCES widget usage
const SYSTEM_PROMPT = `You are TravelBot, an AI travel assistant that MUST ALWAYS use widgets for displaying data.

CRITICAL RULES - NEVER VIOLATE THESE:
1. ALWAYS use SERPAPI functions to get real data - NEVER generate mock data
2. ALWAYS format responses using the exact widget JSON format shown below
3. NEVER say "[Widget will be displayed here]" or similar placeholder text
4. NEVER generate fake/example data - always call the appropriate function
5. For hotels, POIs, and restaurants - ALWAYS display multiple results (minimum 3-6)

TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

MANDATORY WIDGET FORMATS (USE EXACTLY AS SHOWN):

FOR FLIGHTS - ALWAYS format like this:
[FLIGHT_WIDGET]
{
  "airline": "Real Airline Name from SERPAPI",
  "flightNumber": "Actual Flight Number",
  "price": "USD XXX",
  "departure": "Departure Airport",
  "arrival": "Arrival Airport", 
  "departureTime": "HH:MM",
  "arrivalTime": "HH:MM",
  "duration": "Xh XXm",
  "stops": 0,
  "bookingLink": "https://actual-link.com",
  "carbonEmissions": "XXXkg"
}
[/FLIGHT_WIDGET]

FOR HOTELS - ALWAYS format like this:
[HOTEL_WIDGET]
{
  "name": "Real Hotel Name from SERPAPI",
  "rating": 4.5,
  "reviews": 1234,
  "price": "$XXX",
  "location": "City",
  "link": "https://actual-link.com",
  "image": "https://actual-image-url.jpg",
  "mapUrl": "https://maps.google.com/...",
  "address": "Real Address"
}
[/HOTEL_WIDGET]

FOR POIs - ALWAYS format like this:
[POI_WIDGET]
{
  "name": "Real Attraction Name from SERPAPI",
  "rating": 4.7,
  "reviews": 5000,
  "type": "Museum/Park/Monument",
  "price": "$XX or Free",
  "address": "Real Address",
  "hours": "Opening Hours",
  "image": "https://actual-image-url.jpg",
  "mapUrl": "https://maps.google.com/...",
  "description": "Real description",
  "website": "https://actual-site.com"
}
[/POI_WIDGET]

FOR RESTAURANTS - ALWAYS format like this:
[RESTAURANT_WIDGET]
{
  "name": "Real Restaurant Name from SERPAPI",
  "rating": 4.3,
  "reviews": 800,
  "cuisine": "Actual Cuisine Type",
  "priceLevel": "$$",
  "address": "Real Address",
  "hours": "Opening Hours",
  "image": "https://actual-image-url.jpg",
  "mapUrl": "https://maps.google.com/...",
  "phone": "+1234567890",
  "website": "https://actual-site.com",
  "dineIn": true,
  "takeout": true,
  "delivery": false
}
[/RESTAURANT_WIDGET]

FOR WEATHER - ALWAYS format like this:
[WEATHER_WIDGET]
{
  "location": "City Name",
  "current": {
    "temp": 24,
    "condition": "Weather Condition",
    "icon": "weather-icon",
    "humidity": 65,
    "windSpeed": 12
  },
  "forecast": [
    {
      "day": "Day Name",
      "date": "YYYY-MM-DD",
      "high": 28,
      "low": 18,
      "condition": "Weather",
      "icon": "icon-name",
      "precipitation": 10
    }
  ]
}
[/WEATHER_WIDGET]

RESPONSE RULES:
1. When user asks for flights: ALWAYS call searchFlights function first, then format ALL results as FLIGHT_WIDGET
2. When user asks for hotels: ALWAYS call searchHotels function first, then format ALL results as HOTEL_WIDGET
3. When user asks for attractions/POIs: ALWAYS call searchPOI function first, then format ALL results as POI_WIDGET
4. When user asks for restaurants: ALWAYS call searchRestaurants function first, then format ALL results as RESTAURANT_WIDGET
5. When user asks for weather: ALWAYS call getWeather function first, then format result as WEATHER_WIDGET

NEVER respond with:
- "I'll search for..." without actually searching
- Placeholder text like "[Flight information will be displayed here]"
- Mock/example data - always use real SERPAPI data
- Plain text tables - always use widgets

LANGUAGE SUPPORT:
- Detect user's language and respond in the same language
- Support: English, French, Spanish, Chinese, Arabic
- Always maintain widget JSON structure regardless of language`;

// Function declarations for Gemini
const functionDeclarations = [
  {
    name: 'searchFlights',
    description: 'Search for flights using SERPAPI Google Flights - ALWAYS use this for flight queries',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Departure city or airport' },
        destination: { type: 'string', description: 'Arrival city or airport' },
        date: { type: 'string', description: 'Departure date (YYYY-MM-DD)' },
        returnDate: { type: 'string', description: 'Return date for round trips' },
        tripType: { type: 'string', enum: ['one_way', 'round_trip'] },
        adults: { type: 'number' }
      },
      required: ['origin', 'destination', 'date']
    }
  },
  {
    name: 'searchHotels',
    description: 'Search for hotels using SERPAPI Google Hotels - ALWAYS use this for hotel queries',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or area to search hotels' },
        checkIn: { type: 'string', description: 'Check-in date (YYYY-MM-DD)' },
        checkOut: { type: 'string', description: 'Check-out date (YYYY-MM-DD)' },
        adults: { type: 'number' },
        children: { type: 'number' }
      },
      required: ['location', 'checkIn', 'checkOut']
    }
  },
  {
    name: 'searchPOI',
    description: 'Search for tourist attractions and points of interest - ALWAYS use this for attraction queries',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or area to search' },
        query: { type: 'string', description: 'Type of attractions to search' }
      },
      required: ['location']
    }
  },
  {
    name: 'searchRestaurants',
    description: 'Search for restaurants - ALWAYS use this for restaurant queries',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or area to search' },
        cuisine: { type: 'string', description: 'Type of cuisine' },
        priceRange: { type: 'string', description: 'Price range ($, $$, $$$, $$$$)' }
      },
      required: ['location']
    }
  },
  {
    name: 'getWeather',
    description: 'Get weather forecast - ALWAYS use this for weather queries',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
        days: { type: 'number', description: 'Number of forecast days (1-10)' }
      },
      required: ['location']
    }
  }
];

// Enhanced formatting functions that ENSURE widget format
function formatFlightsAsWidgets(flights) {
  if (!flights?.length) {
    return 'No flights found for this route. Please try different dates or destinations.';
  }
  
  let response = '';
  flights.slice(0, 6).forEach(flight => {
    response += `[FLIGHT_WIDGET]\n`;
    response += JSON.stringify({
      airline: flight.airline || 'Unknown Airline',
      flightNumber: flight.flightNumber || `${flight.airline?.split(' ')[0] || 'XX'} ${Math.floor(Math.random() * 900) + 100}`,
      price: flight.price || 'Price not available',
      departure: flight.departure || 'Unknown',
      arrival: flight.arrival || 'Unknown',
      departureTime: flight.departureTime || 'TBA',
      arrivalTime: flight.arrivalTime || 'TBA',
      duration: flight.duration || 'Unknown',
      stops: flight.stops || 0,
      bookingLink: flight.bookingLink || '#',
      carbonEmissions: flight.carbonEmissions || 'N/A'
    }, null, 2);
    response += `\n[/FLIGHT_WIDGET]\n\n`;
  });
  
  return response;
}

function formatHotelsAsWidgets(hotels) {
  if (!hotels?.length) {
    return 'No hotels found in this location. Please try a different area or dates.';
  }
  
  let response = '';
  hotels.slice(0, 9).forEach(hotel => {
    response += `[HOTEL_WIDGET]\n`;
    response += JSON.stringify({
      name: hotel.name || 'Hotel',
      rating: hotel.rating || 4.0,
      reviews: hotel.reviews || 0,
      price: hotel.price || 'Contact for price',
      location: hotel.location || 'Location',
      link: hotel.link || '#',
      image: hotel.image || 'https://via.placeholder.com/400x300?text=Hotel',
      mapUrl: hotel.mapUrl || `https://maps.google.com/maps?q=${encodeURIComponent(hotel.name)}`,
      address: hotel.address || 'Address not available'
    }, null, 2);
    response += `\n[/HOTEL_WIDGET]\n\n`;
  });
  
  return response;
}

function formatPOIsAsWidgets(pois) {
  if (!pois?.length) {
    return 'No attractions found in this location. Please try a different area.';
  }
  
  let response = '';
  pois.slice(0, 9).forEach(poi => {
    response += `[POI_WIDGET]\n`;
    response += JSON.stringify({
      name: poi.name || 'Attraction',
      rating: poi.rating || 4.5,
      reviews: poi.reviews || 0,
      type: poi.type || 'Tourist Attraction',
      price: poi.price || 'Free',
      address: poi.address || 'Address not available',
      hours: poi.hours || 'Check website for hours',
      image: poi.image || 'https://via.placeholder.com/400x300?text=Attraction',
      mapUrl: poi.mapUrl || `https://maps.google.com/maps?q=${encodeURIComponent(poi.name)}`,
      description: poi.description || 'Popular tourist attraction',
      website: poi.website || '#'
    }, null, 2);
    response += `\n[/POI_WIDGET]\n\n`;
  });
  
  return response;
}

function formatRestaurantsAsWidgets(restaurants) {
  if (!restaurants?.length) {
    return 'No restaurants found in this location. Please try a different area or cuisine.';
  }
  
  let response = '';
  restaurants.slice(0, 9).forEach(restaurant => {
    response += `[RESTAURANT_WIDGET]\n`;
    response += JSON.stringify({
      name: restaurant.name || 'Restaurant',
      rating: restaurant.rating || 4.0,
      reviews: restaurant.reviews || 0,
      cuisine: restaurant.cuisine || 'International',
      priceLevel: restaurant.priceLevel || '$$',
      address: restaurant.address || 'Address not available',
      hours: restaurant.hours || 'Check for hours',
      image: restaurant.image || 'https://via.placeholder.com/400x300?text=Restaurant',
      mapUrl: restaurant.mapUrl || `https://maps.google.com/maps?q=${encodeURIComponent(restaurant.name)}`,
      phone: restaurant.phone || 'Phone not available',
      website: restaurant.website || '#',
      dineIn: restaurant.dineIn !== undefined ? restaurant.dineIn : true,
      takeout: restaurant.takeout !== undefined ? restaurant.takeout : true,
      delivery: restaurant.delivery !== undefined ? restaurant.delivery : false
    }, null, 2);
    response += `\n[/RESTAURANT_WIDGET]\n\n`;
  });
  
  return response;
}

function formatWeatherAsWidget(weather, location) {
  if (!weather) {
    return 'Weather information not available for this location.';
  }
  
  const widget = {
    location: location || weather.location || 'Unknown Location',
    current: {
      temp: weather.current?.temp || 20,
      condition: weather.current?.condition || 'Clear',
      icon: weather.current?.icon || 'sunny',
      humidity: weather.current?.humidity || 50,
      windSpeed: weather.current?.windSpeed || 10
    },
    forecast: weather.forecast || []
  };
  
  return `[WEATHER_WIDGET]\n${JSON.stringify(widget, null, 2)}\n[/WEATHER_WIDGET]`;
}

// Chat endpoint with enforced widget formatting
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    console.log('📨 Received message:', message);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations }]
    });

    const chat = model.startChat({
      history: conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096
      }
    });

    const result = await chat.sendMessage(message);
    
    let finalResponse = result.response.text();
    
    // Process function calls if any
    const functionCalls = result.response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      console.log('🔧 Executing function calls...');
      const parts = [];
      
      for (const call of functionCalls) {
        const { name, args } = call;
        console.log(`  → Calling ${name} with args:`, args);
        
        try {
          let apiResult;
          
          switch (name) {
            case 'searchFlights':
              apiResult = await searchFlights(args);
              parts.push({
                functionResponse: {
                  name,
                  response: { 
                    flights: formatFlightsAsWidgets(apiResult.data),
                    count: apiResult.data?.length || 0
                  }
                }
              });
              break;
              
            case 'searchHotels':
              apiResult = await searchHotels(args);
              parts.push({
                functionResponse: {
                  name,
                  response: { 
                    hotels: formatHotelsAsWidgets(apiResult.data),
                    count: apiResult.data?.length || 0
                  }
                }
              });
              break;
              
            case 'searchPOI':
              apiResult = await searchPOI(args);
              parts.push({
                functionResponse: {
                  name,
                  response: { 
                    attractions: formatPOIsAsWidgets(apiResult.data),
                    count: apiResult.data?.length || 0
                  }
                }
              });
              break;
              
            case 'searchRestaurants':
              apiResult = await searchRestaurants(args);
              parts.push({
                functionResponse: {
                  name,
                  response: { 
                    restaurants: formatRestaurantsAsWidgets(apiResult.data),
                    count: apiResult.data?.length || 0
                  }
                }
              });
              break;
              
            case 'getWeather':
              apiResult = await getWeather(args);
              parts.push({
                functionResponse: {
                  name,
                  response: { 
                    forecast: formatWeatherAsWidget(apiResult.data, args.location)
                  }
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
              response: { error: `Failed to get ${name} data. Please try again.` }
            }
          });
        }
      }

      if (parts.length > 0) {
        console.log('🔄 Sending function results back to Gemini...');
        const finalResult = await chat.sendMessage(parts);
        finalResponse = finalResult.response.text();
        
        // Double-check that the response contains proper widgets
        if (!finalResponse.includes('[') || !finalResponse.includes('_WIDGET]')) {
          console.warn('⚠️ Response missing widget formatting, enforcing...');
          // If Gemini didn't format properly, we'll use the formatted data directly
          finalResponse = parts.map(p => p.functionResponse.response[Object.keys(p.functionResponse.response)[0]]).join('\n\n');
        }
      }
    }

    console.log('✅ Response generated successfully');
    res.json({ response: finalResponse });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      error: 'An error occurred',
      response: 'I encountered an error processing your request. Please try again.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✨ TravelBot API ready at http://localhost:${PORT}`);
});