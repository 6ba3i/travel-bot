import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchFlights, searchHotels, searchPOI, searchRestaurants, getWeather } from './src/lib/serpApi.js';

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are TravelBot, an AI travel assistant that helps users with flights, hotels, restaurants, POIs, and weather.

CRITICAL RULES - NEVER VIOLATE THESE:
1. ALWAYS use SERPAPI functions to get real data - NEVER generate mock data
2. ALWAYS format responses using the exact widget JSON format shown below
3. NEVER say "[Widget will be displayed here]" or similar placeholder text
4. NEVER generate fake/example data - always call the appropriate function
5. For hotels, POIs, and restaurants - ALWAYS display multiple results (minimum 3-6)
6. ALWAYS filter hotels by price when requested (e.g., "under $150" means maxPrice: 150)

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
3. When user asks for hotels with price constraint (e.g., "under $150"): Extract the price and pass maxPrice parameter
4. When user asks for POIs/attractions: ALWAYS call searchPOI function first, then format ALL results as POI_WIDGET  
5. When user asks for restaurants: ALWAYS call searchRestaurants function first, then format ALL results as RESTAURANT_WIDGET
6. When user asks for weather: ALWAYS call getWeather function with days=10, then format as WEATHER_WIDGET
7. NEVER mix response formats - always use the exact widget format for each type
8. Show ALL available results from the API, not just one
9. If a tool returns no results, explain politely and suggest alternatives

Remember: ALWAYS use real data from the functions, NEVER generate fake data, and ALWAYS format using the widget JSON blocks.`;

// Enhanced function declarations with price filtering for hotels
const functionDeclarations = [
  {
    name: 'searchFlights',
    description: 'Search for flights - ALWAYS use this for flight queries',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Origin city or airport code' },
        destination: { type: 'string', description: 'Destination city or airport code' },
        departureDate: { type: 'string', description: 'Departure date (YYYY-MM-DD)' },
        returnDate: { type: 'string', description: 'Return date for round trips (YYYY-MM-DD)' },
        adults: { type: 'number', description: 'Number of adult passengers' }
      },
      required: ['origin', 'destination', 'departureDate']
    }
  },
  {
    name: 'searchHotels',
    description: 'Search for hotels - ALWAYS use this for hotel queries. Extract price constraints from user query.',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or area to search' },
        checkIn: { type: 'string', description: 'Check-in date (YYYY-MM-DD)' },
        checkOut: { type: 'string', description: 'Check-out date (YYYY-MM-DD)' },
        adults: { type: 'number', description: 'Number of adults' },
        maxPrice: { type: 'number', description: 'Maximum price per night in USD (e.g., 150 for "under $150")' }
      },
      required: ['location']
    }
  },
  {
    name: 'searchPOI',
    description: 'Search for tourist attractions and points of interest - ALWAYS use this for attraction queries',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or area to search' },
        type: { type: 'string', description: 'Type of attractions to search' }
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

// Enhanced formatting functions with price filtering
function formatHotelsAsWidgets(hotels, maxPrice) {
  if (!hotels?.length) {
    return 'No hotels found in this location. Please try a different area or dates.';
  }
  
  // Filter by price if maxPrice is provided
  let filteredHotels = hotels;
  if (maxPrice) {
    filteredHotels = hotels.filter(hotel => {
      const price = parseFloat(hotel.price?.replace(/[$,]/g, '') || '0');
      return price <= maxPrice;
    });
    
    if (!filteredHotels.length) {
      return `No hotels found under $${maxPrice} in this location. The available hotels start from higher prices. Would you like to see all available options?`;
    }
  }
  
  let response = '';
  filteredHotels.slice(0, 9).forEach(hotel => {
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
  if (!weather || !weather.data || weather.data.length === 0) {
    return 'Weather information not available for this location.';
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

app.post('/api/chat', async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    console.log('📥 Received message:', message);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations }]
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(message);

    // Check for function calls
    const functionCall = result.response.functionCalls()?.[0];
    
    if (functionCall) {
      const { name, args } = functionCall;
      console.log(`🔧 Calling function: ${name}`, args);

      let apiResult;
      let formattedResponse;

      switch (name) {
        case 'searchFlights':
          apiResult = await searchFlights(args);
          formattedResponse = formatFlightsAsWidgets(apiResult.data);
          break;

        case 'searchHotels':
          apiResult = await searchHotels(args);
          formattedResponse = formatHotelsAsWidgets(apiResult.data, args.maxPrice);
          break;

        case 'searchPOI':
          apiResult = await searchPOI(args);
          formattedResponse = formatPOIsAsWidgets(apiResult.data);
          break;

        case 'searchRestaurants':
          apiResult = await searchRestaurants(args);
          formattedResponse = formatRestaurantsAsWidgets(apiResult.data);
          break;

        case 'getWeather':
          // Always fetch 10 days for weather
          apiResult = await getWeather({ ...args, days: 10 });
          formattedResponse = formatWeatherAsWidget(apiResult, args.location);
          break;

        default:
          formattedResponse = 'I couldn\'t process that request. Please try again.';
      }

      console.log('✅ Formatted response ready');
      res.json({ response: formattedResponse });
    } else {
      const textResponse = result.response.text();
      console.log('💬 Text response:', textResponse);
      res.json({ response: textResponse });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});