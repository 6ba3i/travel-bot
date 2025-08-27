// src/lib/serpApi.js - Fixed with better data extraction
import 'dotenv/config';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const BASE_URL = 'https://serpapi.com/search';

console.log('🔧 SerpApi Integration Loaded');
console.log(`   API Key: ${SERPAPI_KEY ? 'Configured ✅' : 'Missing ❌'}`);

// Global airport code mapping
const AIRPORT_CODES = {
  'casablanca': 'CMN', 'mohammed v': 'CMN', 'الدار البيضاء': 'CMN', '卡萨布兰卡': 'CMN',
  'marrakech': 'RAK', 'menara': 'RAK', 'مراكش': 'RAK', '马拉喀什': 'RAK',
  'barcelona': 'BCN', 'el prat': 'BCN', 'برشلونة': 'BCN', '巴塞罗那': 'BCN',
  'madrid': 'MAD', 'barajas': 'MAD', 'مدريد': 'MAD', '马德里': 'MAD',
  'paris': 'CDG', 'charles de gaulle': 'CDG', 'باريس': 'CDG', '巴黎': 'CDG',
  'london': 'LHR', 'heathrow': 'LHR', 'لندن': 'LHR', '伦敦': 'LHR',
  'new york': 'JFK', 'newyork': 'JFK', 'jfk': 'JFK', 'نيويورك': 'JFK', '纽约': 'JFK',
  'dubai': 'DXB', 'دبي': 'DXB', '迪拜': 'DXB',
  'tokyo': 'NRT', 'narita': 'NRT', 'طوكيو': 'NRT', '东京': 'NRT',
  'istanbul': 'IST', 'اسطنبول': 'IST', '伊斯坦布尔': 'IST',
  'los angeles': 'LAX', 'la': 'LAX', 'لوس أنجلوس': 'LAX', '洛杉矶': 'LAX',
  'san francisco': 'SFO', 'sf': 'SFO', 'سان فرانسيسكو': 'SFO', '旧金山': 'SFO',
  'chicago': 'ORD', 'o\'hare': 'ORD', 'شيكاغو': 'ORD', '芝加哥': 'ORD',
  'miami': 'MIA', 'ميامي': 'MIA', '迈阿密': 'MIA',
  'boston': 'BOS', 'logan': 'BOS', 'بوسطن': 'BOS', '波士顿': 'BOS'
};

// City coordinates for weather
const CITY_COORDINATES = {
  'casablanca': { lat: 33.5731, lon: -7.5898 },
  'barcelona': { lat: 41.3851, lon: 2.1734 },
  'paris': { lat: 48.8566, lon: 2.3522 },
  'new york': { lat: 40.7128, lon: -74.0060 },
  'newyork': { lat: 40.7128, lon: -74.0060 },
  'dubai': { lat: 25.2048, lon: 55.2708 },
  'tokyo': { lat: 35.6762, lon: 139.6503 },
  'london': { lat: 51.5074, lon: -0.1278 },
  'los angeles': { lat: 34.0522, lon: -118.2437 },
  'chicago': { lat: 41.8781, lon: -87.6298 },
  'miami': { lat: 25.7617, lon: -80.1918 }
};

// Convert city name to airport code - FIXED
function getAirportCode(city) {
  // If it's already a 3-letter uppercase code, return as-is
  if (city && city.length === 3 && city === city.toUpperCase()) {
    console.log(`   ✅ Already an airport code: ${city}`);
    return city;
  }
  
  const normalized = city.toLowerCase().trim();
  
  // Check our mapping
  for (const [key, code] of Object.entries(AIRPORT_CODES)) {
    if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
      console.log(`   📍 Converted "${city}" → ${code}`);
      return code;
    }
  }
  
  // If not found, return original (might be a valid code we don't know)
  console.log(`   ⚠️ Unknown location "${city}", using as-is`);
  return city;
}

// Get city coordinates with automatic fallback
async function getCityCoordinates(location) {
  const normalized = location.toLowerCase().trim();
  
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized === city || normalized.includes(city) || city.includes(normalized)) {
      return coords;
    }
  }
  
  // Fallback to Google Maps API
  try {
    const params = new URLSearchParams({
      engine: 'google_maps',
      q: location,
      api_key: SERPAPI_KEY
    });
    
    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();
    
    if (data.place_results?.gps_coordinates) {
      return {
        lat: data.place_results.gps_coordinates.latitude,
        lon: data.place_results.gps_coordinates.longitude
      };
    }
  } catch (error) {
    console.error('Error getting coordinates:', error.message);
  }
  
  return { lat: 0, lon: 0 };
}

// 🛫 FLIGHTS - Enhanced with better time extraction
export async function searchFlights({
  origin,
  destination,
  departureDate,
  returnDate,
  adults = 1,
  tripType = 'one_way'
}) {
  try {
    console.log('🛫 Searching flights with SerpApi Google Flights...');
    
    if (!SERPAPI_KEY) {
      console.error('❌ SERPAPI_KEY is missing!');
      return { data: [] };
    }

    const originCode = getAirportCode(origin);
    const destCode = getAirportCode(destination);
    
    console.log(`   Route: ${originCode} → ${destCode}`);
    console.log(`   Date: ${departureDate}`);

    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: originCode,
      arrival_id: destCode,
      outbound_date: departureDate,
      adults: adults.toString(),
      currency: 'USD',
      hl: 'en',
      api_key: SERPAPI_KEY
    });

    if (tripType === 'round_trip' && returnDate) {
      params.append('return_date', returnDate);
      params.append('type', '1');  // Round trip
    } else {
      params.append('type', '2');  // One way
    }

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.error) {
      console.error('❌ SerpApi error:', data.error);
      return { data: [] };
    }

    // Combine best flights and other flights
    const allFlights = [...(data.best_flights || []), ...(data.other_flights || [])];
    
    const flights = allFlights.slice(0, 10).map(flight => {
      // Extract airline name
      const airlineName = flight.airlines?.[0] || 
                         flight.flights?.[0]?.airline ||
                         'Multiple Airlines';
      
      // Extract departure details
      const depAirport = flight.departure_airport || {};
      const departureAirportName = depAirport.name || originCode;
      const departureTime = depAirport.time || flight.flights?.[0]?.departure_airport?.time || '';
      
      // Extract arrival details
      const arrAirport = flight.arrival_airport || {};
      const arrivalAirportName = arrAirport.name || destCode;
      const arrivalTime = arrAirport.time || 
                         flight.flights?.[flight.flights?.length - 1]?.arrival_airport?.time || '';
      
      // Extract price
      let price = 'Check airline';
      if (flight.price) {
        price = typeof flight.price === 'number' ? `USD ${flight.price}` : flight.price;
      }
      
      // Extract duration
      const duration = flight.total_duration || 
                      flight.duration || 
                      flight.flights?.[0]?.duration || 
                      'N/A';
      
      return {
        airline: airlineName,
        flight_number: flight.flights?.[0]?.flight_number || 'Multiple',
        price: price,
        departure_airport: {
          name: departureAirportName,
          time: departureTime,
          id: depAirport.id || originCode
        },
        arrival_airport: {
          name: arrivalAirportName,
          time: arrivalTime,
          id: arrAirport.id || destCode
        },
        duration: duration,
        stops: flight.layovers?.length || 0,
        booking_link: flight.booking_link || '#',
        carbon_emissions: {
          total: flight.carbon_emissions?.this_flight ? 
            `${flight.carbon_emissions.this_flight}kg` : 'N/A'
        },
        departure_time: departureTime, // Added for backward compatibility
        arrival_time: arrivalTime      // Added for backward compatibility
      };
    });

    console.log(`✅ Found ${flights.length} flights`);
    if (flights.length > 0) {
      console.log('   Sample flight:', JSON.stringify(flights[0], null, 2));
    }
    
    return { data: flights };

  } catch (error) {
    console.error('❌ SerpApi Flights error:', error.message);
    return { data: [] };
  }
}

// 🏨 HOTELS - Enhanced with better price extraction
export async function searchHotels({
  city,
  checkIn,
  checkOut,
  adults = 2,
  maxPrice,
  minPrice
}) {
  try {
    console.log('🏨 Searching hotels with SerpApi Google Hotels...');
    
    if (!SERPAPI_KEY) {
      console.error('❌ SERPAPI_KEY is missing!');
      return { data: [] };
    }

    console.log(`   Location: ${city}`);
    console.log(`   Dates: ${checkIn} to ${checkOut}`);
    if (maxPrice) console.log(`   Max price: $${maxPrice}`);

    const params = new URLSearchParams({
      engine: 'google_hotels',
      q: city,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: adults.toString(),
      currency: 'USD',
      hl: 'en',
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.error) {
      console.error('❌ SerpApi error:', data.error);
      return { data: [] };
    }

    const hotels = (data.properties || []).map(hotel => {
      // Extract price from various possible fields
      let price = null;
      
      // Try different price fields in order of preference
      if (hotel.rate_per_night?.extracted) {
        price = hotel.rate_per_night.extracted;
      } else if (hotel.rate_per_night?.lowest) {
        price = hotel.rate_per_night.lowest;
      } else if (hotel.total_rate?.extracted) {
        price = hotel.total_rate.extracted;
      } else if (hotel.price) {
        price = hotel.price;
      }
      
      // Format price as string
      if (typeof price === 'number') {
        price = `$${price}`;
      } else if (!price) {
        price = 'Contact for price';
      }
      
      // Get high quality images
      const images = hotel.images || [];
      const image = images[0]?.original || images[0]?.thumbnail || '';
      
      return {
        name: hotel.name || 'Hotel',
        price: price,
        rate_per_night: hotel.rate_per_night || { extracted: price },
        rating: hotel.overall_rating || hotel.rating || 0,
        reviews: hotel.reviews || hotel.total_reviews || 0,
        link: hotel.link || hotel.serpapi_link || '#',
        image: image,
        images: images,
        location: hotel.neighborhood || city,
        city: city,
        address: hotel.address || '',
        gps_coordinates: hotel.gps_coordinates || null,
        amenities: hotel.amenities || [],
        nearby_places: hotel.nearby_places || [],
        hotel_class: hotel.hotel_class || null,
        check_in_time: hotel.check_in_time || '',
        check_out_time: hotel.check_out_time || '',
        overall_rating: hotel.overall_rating || 0,
        total_reviews: hotel.reviews || 0
      };
    });

    console.log(`✅ Found ${hotels.length} hotels`);
    if (hotels.length > 0) {
      console.log('   Sample hotel:', {
        name: hotels[0].name,
        price: hotels[0].price,
        rating: hotels[0].rating
      });
    }
    
    return { data: hotels };

  } catch (error) {
    console.error('❌ SerpApi Hotels error:', error.message);
    return { data: [] };
  }
}

// 🍴 RESTAURANTS - Enhanced with better image quality
export async function searchRestaurants({ location, cuisine }) {
  try {
    console.log('🍴 Searching restaurants with SerpApi Google Local...');
    
    const query = cuisine ? `${cuisine} restaurants in ${location}` : `restaurants in ${location}`;
    
    const params = new URLSearchParams({
      engine: 'google_local',
      q: query,
      hl: 'en',
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.error) {
      console.error('❌ SerpApi error:', data.error);
      return { data: [] };
    }

    const restaurants = (data.local_results || []).slice(0, 10).map(restaurant => ({
      title: restaurant.title,
      name: restaurant.title,
      rating: restaurant.rating || 0,
      reviews: restaurant.reviews || 0,
      reviews_original: restaurant.reviews_original || '',
      price: restaurant.price || '$$',
      price_level: restaurant.price || '$$',
      cuisine: cuisine || restaurant.type || 'Restaurant',
      type: restaurant.type || 'Restaurant',
      address: restaurant.address || '',
      hours: restaurant.hours || restaurant.operating_hours?.Monday || 'Check website',
      operating_hours: restaurant.operating_hours || {},
      phone: restaurant.phone || '',
      website: restaurant.website || restaurant.link || '#',
      link: restaurant.link || '#',
      thumbnail: restaurant.thumbnail || '',
      image: restaurant.thumbnail || '',
      gps_coordinates: restaurant.gps_coordinates || null,
      links: restaurant.links || {},
      place_id: restaurant.place_id || '',
      dine_in: restaurant.dine_in !== false,
      takeout: restaurant.takeout !== false,
      delivery: restaurant.delivery || false,
      service_options: restaurant.service_options || {}
    }));

    console.log(`✅ Found ${restaurants.length} restaurants`);
    return { data: restaurants };

  } catch (error) {
    console.error('❌ SerpApi Restaurants error:', error.message);
    return { data: [] };
  }
}

// 📍 POI (Points of Interest) - Enhanced
export async function searchPOI({ location }) {
  try {
    console.log('📍 Searching POIs with SerpApi Google Local...');
    
    const params = new URLSearchParams({
      engine: 'google_local',
      q: `attractions things to do in ${location}`,
      hl: 'en',
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.error) {
      console.error('❌ SerpApi error:', data.error);
      return { data: [] };
    }

    const pois = (data.local_results || []).slice(0, 10).map(poi => ({
      title: poi.title,
      name: poi.title,
      rating: poi.rating || 0,
      reviews: poi.reviews || 0,
      reviews_original: poi.reviews_original || '',
      type: poi.type || 'Attraction',
      price: poi.price || poi.ticket_prices?.[0]?.price || 'Free',
      ticket_prices: poi.ticket_prices || [],
      address: poi.address || '',
      location: poi.address || '',
      hours: poi.hours || poi.operating_hours?.Monday || 'Check website',
      operating_hours: poi.operating_hours || {},
      description: poi.description || poi.snippet || '',
      snippet: poi.snippet || '',
      website: poi.website || poi.link || '#',
      link: poi.link || '#',
      thumbnail: poi.thumbnail || '',
      image: poi.thumbnail || '',
      gps_coordinates: poi.gps_coordinates || null,
      links: poi.links || {},
      place_id: poi.place_id || '',
      phone: poi.phone || ''
    }));

    console.log(`✅ Found ${pois.length} POIs`);
    return { data: pois };

  } catch (error) {
    console.error('❌ SerpApi POI error:', error.message);
    return { data: [] };
  }
}

// 🌤️ WEATHER - Unchanged but included for completeness
export async function getWeather({ location, days = 10 }) {
  try {
    console.log('🌤️ Getting weather forecast...');
    
    const coordinates = await getCityCoordinates(location);
    
    if (!coordinates.lat || !coordinates.lon) {
      console.error('❌ Could not determine coordinates');
      return { data: [] };
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=${days}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (!data.daily) {
      console.error('❌ No weather data found');
      return { data: [] };
    }

    const forecast = data.daily.time.map((date, i) => ({
      date,
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      precipitation: Math.round(data.daily.precipitation_sum[i] || 0),
      condition: getWeatherCondition(data.daily.weathercode[i])
    }));

    console.log(`✅ Got ${forecast.length}-day forecast`);
    return { data: forecast };

  } catch (error) {
    console.error('❌ Weather error:', error.message);
    return { data: [] };
  }
}

// Helper function for weather conditions
function getWeatherCondition(code) {
  const conditions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    95: 'Thunderstorm'
  };
  return conditions[code] || 'Clear sky';
}