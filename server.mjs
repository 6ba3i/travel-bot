import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { searchFlights, searchHotels, searchPOI, searchRestaurants, getWeather } from './src/lib/serpApi.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DeepSeek client
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
});

// Session storage
const sessions = new Map();

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      messages: [],
      context: {}
    });
  }
  return sessions.get(sessionId);
}

// YOUR EXACT SYSTEM PROMPT - Enhanced with smart defaults
const SYSTEM_PROMPT = `You are TravelBot, an AI travel assistant that helps users with flights, hotels, restaurants, POIs, and weather.

CRITICAL RULES - NEVER VIOLATE THESE:
1. ALWAYS use SERPAPI functions to get real data - NEVER generate mock data
2. ALWAYS format responses using the exact widget JSON format shown below
3. NEVER say "[Widget will be displayed here]" or similar placeholder text
4. NEVER generate fake/example data - always call the appropriate function
5. For hotels, POIs, and restaurants - ALWAYS display multiple results (minimum 3-6)
6. ALWAYS filter hotels by price when requested (e.g., "under $150" means maxPrice: 150)

TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
CURRENT DATE FOR CALCULATIONS: ${new Date().toISOString().split('T')[0]}

SMART DEFAULT RULES - BE PROACTIVE:
1. For hotels without specific dates:
   - Use TODAY as check-in date
   - Use TOMORROW as check-out date (1 night stay)
   - Still search and show current prices per night
   - Mention in response that prices are for tonight/current rates

2. For flights without complete info:
   - If only "tomorrow" mentioned, search one-way flights
   - "next month" = first day of next month
   - Default to 1 adult, economy class

3. For restaurants/POIs:
   - Search immediately when location is mentioned
   - Don't ask for additional preferences unless unclear

4. Date parsing:
   - "tomorrow" = ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
   - "today" = ${new Date().toISOString().split('T')[0]}
   - "next month" = ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0]}

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
1. When user asks for hotels without dates: Use TODAY/TOMORROW as defaults and search immediately
2. When user asks for flights: Only ask for missing critical info (origin if not provided)
3. Include ALL results returned by the API - display them properly formatted
4. Remember context from previous messages in the conversation`;

// Convert function declarations to OpenAI tools format
const tools = [
  {
    type: "function",
    function: {
      name: "searchFlights",
      description: "Search for flights between airports",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Origin airport code (e.g., JFK)" },
          destination: { type: "string", description: "Destination airport code (e.g., LAX)" },
          departureDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
          returnDate: { type: "string", description: "Return date in YYYY-MM-DD format (optional)" },
          adults: { type: "integer", default: 1 },
          tripType: { type: "string", enum: ["one_way", "round_trip"], default: "one_way" }
        },
        required: ["origin", "destination", "departureDate"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchHotels",
      description: "Search for hotels in a city",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name" },
          checkIn: { type: "string", description: "Check-in date in YYYY-MM-DD format" },
          checkOut: { type: "string", description: "Check-out date in YYYY-MM-DD format" },
          adults: { type: "integer", default: 1 },
          maxPrice: { type: "number", description: "Maximum price per night" },
          minPrice: { type: "number", description: "Minimum price per night" }
        },
        required: ["city", "checkIn", "checkOut"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchPOI",
      description: "Search for points of interest and attractions",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City or location name" }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchRestaurants",
      description: "Search for restaurants in a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City or area name" },
          cuisine: { type: "string", description: "Type of cuisine (optional)" }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "Get weather forecast for a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City name" }
        },
        required: ["location"]
      }
    }
  }
];

// FIXED Widget formatting functions with better data extraction
function formatFlightsAsWidgets(flights) {
  if (!flights || flights.length === 0) {
    return "I couldn't find any flights for your search. Please try different dates or airports.";
  }

  return flights.map(flight => {
    // Better extraction of flight times and details
    const departureTime = flight.departure_airport?.time || 
                         flight.flights?.[0]?.departure_airport?.time ||
                         flight.departure_time ||
                         "Check airline";
    
    const arrivalTime = flight.arrival_airport?.time || 
                       flight.flights?.[flight.flights?.length - 1]?.arrival_airport?.time ||
                       flight.arrival_time ||
                       "Check airline";
    
    const departureAirport = flight.departure_airport?.name || 
                            flight.flights?.[0]?.departure_airport?.name ||
                            flight.departure ||
                            "Departure";
    
    const arrivalAirport = flight.arrival_airport?.name || 
                          flight.flights?.[flight.flights?.length - 1]?.arrival_airport?.name ||
                          flight.arrival ||
                          "Arrival";

    return `[FLIGHT_WIDGET]\n${JSON.stringify({
      airline: flight.airline || flight.airlines?.[0] || "Multiple Airlines",
      flightNumber: flight.flight_number || flight.flights?.[0]?.flight_number || "Multiple",
      price: flight.price || "Check airline",
      departure: departureAirport,
      arrival: arrivalAirport,
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      duration: flight.duration || flight.total_duration || "N/A",
      stops: flight.stops || flight.layovers?.length || 0,
      bookingLink: flight.booking_link || "#",
      carbonEmissions: flight.carbon_emissions?.total || "N/A"
    }, null, 2)}\n[/FLIGHT_WIDGET]`;
  }).join('\n\n');
}

function formatHotelsAsWidgets(hotels, maxPriceFilter = null) {
  if (!hotels || hotels.length === 0) {
    return "I couldn't find any hotels matching your criteria. Try adjusting your search parameters.";
  }

  // Enhanced price extraction and filtering
  let processedHotels = hotels.map(hotel => {
    // Try multiple price fields
    let priceValue = hotel.rate_per_night?.extracted || 
                     hotel.rate_per_night?.low ||
                     hotel.price ||
                     hotel.total_rate?.extracted ||
                     null;
    
    // Extract numeric value if it's a string
    let numericPrice = null;
    if (priceValue) {
      if (typeof priceValue === 'string') {
        // Remove currency symbols and extract number
        const match = priceValue.match(/[\d,]+/);
        if (match) {
          numericPrice = parseInt(match[0].replace(/,/g, ''));
        }
      } else if (typeof priceValue === 'number') {
        numericPrice = priceValue;
      }
    }

    // Format price for display
    let displayPrice = priceValue;
    if (numericPrice) {
      displayPrice = `$${numericPrice}`;
    } else if (!priceValue) {
      displayPrice = "Price not available";
    }

    return {
      ...hotel,
      numericPrice: numericPrice,
      displayPrice: displayPrice
    };
  });

  // Filter by price if specified
  if (maxPriceFilter) {
    console.log(`   Filtering hotels under $${maxPriceFilter}`);
    const filtered = processedHotels.filter(hotel => {
      if (!hotel.numericPrice) {
        console.log(`   Hotel ${hotel.name}: No price, including`);
        return true; // Include hotels without prices
      }
      console.log(`   Hotel ${hotel.name}: $${hotel.numericPrice} ${hotel.numericPrice <= maxPriceFilter ? '✓' : '✗'}`);
      return hotel.numericPrice <= maxPriceFilter;
    });
    
    if (filtered.length > 0) {
      processedHotels = filtered;
    } else {
      // If nothing under budget, show all with a note
      return `Note: No hotels found under $${maxPriceFilter}. Here are available options:\n\n` +
        processedHotels.slice(0, 6).map(hotel => formatSingleHotel(hotel)).join('\n\n');
    }
  }

  return processedHotels.slice(0, 6).map(hotel => formatSingleHotel(hotel)).join('\n\n');
}

function formatSingleHotel(hotel) {
  // Get the best quality image available
  const image = hotel.images?.[0]?.original || 
                hotel.images?.[0]?.thumbnail ||
                hotel.image ||
                hotel.thumbnail ||
                "";
  
  // Replace thumbnail with larger size if it's a Google image
  const highQualityImage = image.includes('googleusercontent.com') && image.includes('=s') 
    ? image.replace(/=s\d+/, '=s1000') // Request 1000px image
    : image.includes('googleusercontent.com') && image.includes('=w')
    ? image.replace(/=w\d+-h\d+/, '=w800-h600') // Request larger dimensions
    : image;

  return `[HOTEL_WIDGET]\n${JSON.stringify({
    name: hotel.name || "Hotel Name",
    rating: hotel.overall_rating || hotel.rating || 0,
    reviews: hotel.reviews || hotel.total_reviews || 0,
    price: hotel.displayPrice || hotel.rate_per_night?.extracted || hotel.price || "$--",
    location: hotel.neighborhood || hotel.location || hotel.city || "Location",
    link: hotel.link || hotel.serpapi_link || "#",
    image: highQualityImage,
    mapUrl: hotel.gps_coordinates ? 
      `https://maps.google.com/?q=${hotel.gps_coordinates.latitude},${hotel.gps_coordinates.longitude}` :
      hotel.map_link || "#",
    address: hotel.address || hotel.location || "Address not available"
  }, null, 2)}\n[/HOTEL_WIDGET]`;
}

function formatPOIsAsWidgets(pois) {
  if (!pois || pois.length === 0) {
    return "I couldn't find attractions for this location. Try searching for a different city.";
  }

  return pois.slice(0, 6).map(poi => {
    // Get high quality image
    const image = poi.thumbnail || poi.image || "";
    const highQualityImage = image.includes('googleusercontent.com') 
      ? image.replace(/=s\d+/, '=s800').replace(/=w\d+-h\d+/, '=w800-h600')
      : image;

    return `[POI_WIDGET]\n${JSON.stringify({
      name: poi.title || poi.name || "Attraction",
      rating: poi.rating || 0,
      reviews: poi.reviews || poi.reviews_original || 0,
      type: poi.type || "Attraction",
      price: poi.price || poi.ticket_prices?.[0]?.price || "Free",
      address: poi.address || poi.location || "Location",
      hours: poi.hours || poi.operating_hours?.Monday || "Check website",
      image: highQualityImage,
      mapUrl: poi.gps_coordinates ? 
        `https://maps.google.com/?q=${poi.gps_coordinates.latitude},${poi.gps_coordinates.longitude}` :
        poi.links?.directions || "#",
      description: poi.description || poi.snippet || "Popular attraction",
      website: poi.website || poi.link || "#"
    }, null, 2)}\n[/POI_WIDGET]`;
  }).join('\n\n');
}

function formatRestaurantsAsWidgets(restaurants) {
  if (!restaurants || restaurants.length === 0) {
    return "I couldn't find restaurants in this area. Try searching for a different location.";
  }

  return restaurants.slice(0, 6).map(restaurant => {
    // Get high quality image
    const image = restaurant.thumbnail || restaurant.image || "";
    const highQualityImage = image.includes('googleusercontent.com')
      ? image.replace(/=s\d+/, '=s800').replace(/=w\d+-h\d+/, '=w800-h600')
      : image;

    return `[RESTAURANT_WIDGET]\n${JSON.stringify({
      name: restaurant.title || restaurant.name || "Restaurant",
      rating: restaurant.rating || 0,
      reviews: restaurant.reviews || restaurant.reviews_original || 0,
      cuisine: restaurant.cuisine || restaurant.type || "Restaurant",
      priceLevel: restaurant.price || restaurant.price_level || "$$",
      address: restaurant.address || "Address",
      hours: restaurant.hours || restaurant.operating_hours?.Monday || "Check website",
      image: highQualityImage,
      mapUrl: restaurant.gps_coordinates ?
        `https://maps.google.com/?q=${restaurant.gps_coordinates.latitude},${restaurant.gps_coordinates.longitude}` :
        restaurant.links?.directions || "#",
      phone: restaurant.phone || "Not available",
      website: restaurant.website || restaurant.link || "#",
      dineIn: restaurant.dine_in !== false,
      takeout: restaurant.takeout !== false,
      delivery: restaurant.delivery !== false
    }, null, 2)}\n[/RESTAURANT_WIDGET]`;
  }).join('\n\n');
}

function formatWeatherAsWidget(weather, location) {
  if (!weather || !weather.data || weather.data.length === 0) {
    return 'Weather data is not available for this location.';
  }
  
  const forecast = weather.data.slice(0, 10).map((day, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      day: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : dayNames[date.getDay()],
      date: day.date || date.toISOString().split('T')[0],
      high: day.maxTemp || 25,
      low: day.minTemp || 15,
      condition: day.condition || 'Clear',
      icon: getWeatherIcon(day.condition || 'Clear'),
      precipitation: day.precipitation || 0
    };
  });
  
  return `[WEATHER_WIDGET]\n${JSON.stringify({
    location: location || 'Unknown Location',
    current: {
      temp: forecast[0]?.high || 25,
      condition: forecast[0]?.condition || 'Clear',
      icon: forecast[0]?.icon || 'sunny',
      humidity: 65,
      windSpeed: 12
    },
    forecast: forecast
  }, null, 2)}\n[/WEATHER_WIDGET]`;
}

function getWeatherIcon(condition) {
  const cond = condition.toLowerCase();
  if (cond.includes('rain')) return 'rain';
  if (cond.includes('cloud')) return 'cloudy';
  if (cond.includes('snow')) return 'snow';
  if (cond.includes('thunder')) return 'thunderstorm';
  if (cond.includes('fog')) return 'fog';
  if (cond.includes('clear') || cond.includes('sunny')) return 'sunny';
  return 'partly-cloudy';
}

// MAIN CHAT ENDPOINT - Fixed session handling
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default', language = 'en' } = req.body;
    console.log('📥 Received message:', message);
    
    // Get or create session
    const session = getSession(sessionId);
    
    // Add user message to history
    session.messages.push({ role: 'user', content: message });
    
    // Keep only last 5 messages for context
    const recentMessages = session.messages.slice(-5);
    
    // Build messages array - filter out tool calls
    const messagesForAPI = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages.filter(msg => !msg.tool_calls && !msg.tool_call_id)
    ];

    // Create chat completion with DeepSeek
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-coder', // Faster model
      messages: messagesForAPI,
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseMessage = completion.choices[0].message;

    // Check if the model wants to use a tool
    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      console.log(`🔧 Calling function: ${functionName}`, functionArgs);

      let apiResult;
      let formattedResponse;

      switch (functionName) {
        case 'searchFlights':
          apiResult = await searchFlights(functionArgs);
          console.log('✈️ Flight data received:', JSON.stringify(apiResult.data?.[0], null, 2));
          formattedResponse = formatFlightsAsWidgets(apiResult.data);
          break;

        case 'searchHotels':
          apiResult = await searchHotels(functionArgs);
          console.log('🏨 Hotel data received:', JSON.stringify(apiResult.data?.[0], null, 2));
          formattedResponse = formatHotelsAsWidgets(apiResult.data, functionArgs.maxPrice);
          session.context.lastCity = functionArgs.city;
          break;

        case 'searchPOI':
          apiResult = await searchPOI(functionArgs);
          formattedResponse = formatPOIsAsWidgets(apiResult.data);
          session.context.lastLocation = functionArgs.location;
          break;

        case 'searchRestaurants':
          apiResult = await searchRestaurants(functionArgs);
          formattedResponse = formatRestaurantsAsWidgets(apiResult.data);
          session.context.lastLocation = functionArgs.location;
          break;

        case 'getWeather':
          apiResult = await getWeather({ ...functionArgs, days: 10 });
          formattedResponse = formatWeatherAsWidget(apiResult, functionArgs.location);
          session.context.lastLocation = functionArgs.location;
          break;

        default:
          formattedResponse = 'I couldn\'t process that request. Please try again.';
      }

      // Store only the formatted response, not tool_calls
      session.messages.push({ 
        role: 'assistant', 
        content: formattedResponse 
      });

      console.log('✅ Formatted response ready');
      res.json({ 
        response: formattedResponse,
        sessionId: sessionId 
      });
    } else {
      // Regular text response
      const textResponse = responseMessage.content;
      console.log('💬 Text response:', textResponse);
      
      // Add assistant response to history
      session.messages.push({ 
        role: 'assistant', 
        content: textResponse 
      });
      
      res.json({ 
        response: textResponse,
        sessionId: sessionId 
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
});

// Clear session endpoint
app.post('/api/clear-session', (req, res) => {
  const { sessionId = 'default' } = req.body;
  sessions.delete(sessionId);
  res.json({ message: 'Session cleared' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Using DeepSeek API (deepseek-coder for speed)`);
  console.log(`🔍 SerpAPI integration active`);
  console.log(`💾 Session memory enabled`);
  console.log(`🖼️ High-quality images enabled`);
});