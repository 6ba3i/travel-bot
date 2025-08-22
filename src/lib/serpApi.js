// src/lib/serpApi.js - Enhanced with POI, Restaurants, and better image handling
import 'dotenv/config';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const BASE_URL = 'https://serpapi.com/search';

console.log('🔧 SerpApi Integration Loaded');
console.log(`   API Key: ${SERPAPI_KEY ? 'Configured ✅' : 'Missing ❌'}`);

// Global airport code mapping (enhanced)
const AIRPORT_CODES = {
  'casablanca': 'CMN', 'mohammed v': 'CMN', 'الدار البيضاء': 'CMN', '卡萨布兰卡': 'CMN',
  'marrakech': 'RAK', 'menara': 'RAK', 'مراكش': 'RAK', '马拉喀什': 'RAK',
  'rabat': 'RBA', 'sale': 'RBA', 'الرباط': 'RBA', '拉巴特': 'RBA',
  'barcelona': 'BCN', 'el prat': 'BCN', 'برشلونة': 'BCN', '巴塞罗那': 'BCN',
  'madrid': 'MAD', 'barajas': 'MAD', 'مدريد': 'MAD', '马德里': 'MAD',
  'paris': 'CDG', 'charles de gaulle': 'CDG', 'باريس': 'CDG', '巴黎': 'CDG',
  'london': 'LHR', 'heathrow': 'LHR', 'لندن': 'LHR', '伦敦': 'LHR',
  'new york': 'JFK', 'jfk': 'JFK', 'نيويورك': 'JFK', '纽约': 'JFK',
  'dubai': 'DXB', 'دبي': 'DXB', '迪拜': 'DXB',
  'tokyo': 'NRT', 'narita': 'NRT', 'طوكيو': 'NRT', '东京': 'NRT',
  'istanbul': 'IST', 'اسطنبول': 'IST', '伊斯坦布尔': 'IST',
  'frankfurt': 'FRA', 'فرانكفورت': 'FRA', '法兰克福': 'FRA',
  'amsterdam': 'AMS', 'schiphol': 'AMS', 'أمستردام': 'AMS', '阿姆斯特丹': 'AMS',
  'munich': 'MUC', 'ميونخ': 'MUC', '慕尼黑': 'MUC',
  'rome': 'FCO', 'fiumicino': 'FCO', 'روما': 'FCO', '罗马': 'FCO',
  'lisbon': 'LIS', 'لشبونة': 'LIS', '里斯本': 'LIS',
  'cairo': 'CAI', 'القاهرة': 'CAI', '开罗': 'CAI',
  'hong kong': 'HKG', 'هونغ كونغ': 'HKG', '香港': 'HKG',
  'singapore': 'SIN', 'changi': 'SIN', 'سنغافورة': 'SIN', '新加坡': 'SIN',
  'bangkok': 'BKK', 'suvarnabhumi': 'BKK', 'بانكوك': 'BKK', '曼谷': 'BKK',
  'beijing': 'PEK', 'بكين': 'PEK', '北京': 'PEK'
};

// City coordinates for weather (enhanced)
const CITY_COORDINATES = {
  'casablanca': { lat: 33.5731, lon: -7.5898 },
  'marrakech': { lat: 31.6295, lon: -7.9811 },
  'rabat': { lat: 33.9716, lon: -6.8498 },
  'barcelona': { lat: 41.3851, lon: 2.1734 },
  'madrid': { lat: 40.4168, lon: -3.7038 },
  'paris': { lat: 48.8566, lon: 2.3522 },
  'london': { lat: 51.5074, lon: -0.1278 },
  'new york': { lat: 40.7128, lon: -74.0060 },
  'dubai': { lat: 25.2048, lon: 55.2708 },
  'tokyo': { lat: 35.6762, lon: 139.6503 },
  'istanbul': { lat: 41.0082, lon: 28.9784 },
  'frankfurt': { lat: 50.1109, lon: 8.6821 },
  'amsterdam': { lat: 52.3676, lon: 4.9041 },
  'munich': { lat: 48.1351, lon: 11.5820 },
  'rome': { lat: 41.9028, lon: 12.4964 },
  'lisbon': { lat: 38.7223, lon: -9.1393 },
  'cairo': { lat: 30.0444, lon: 31.2357 },
  'hong kong': { lat: 22.3193, lon: 114.1694 },
  'singapore': { lat: 1.3521, lon: 103.8198 },
  'bangkok': { lat: 13.7563, lon: 100.5018 }
};

// Convert city name to airport code
function getAirportCode(city) {
  const normalized = city.toLowerCase().trim();
  
  for (const [key, code] of Object.entries(AIRPORT_CODES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return code;
    }
  }
  
  if (normalized.length === 3 && normalized === normalized.toUpperCase()) {
    return normalized;
  }
  
  console.warn(`No airport code found for: ${city}, using as-is`);
  return city;
}

// Get city coordinates with automatic fallback
async function getCityCoordinates(location) {
  const normalized = location.toLowerCase().trim();
  
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      return coords;
    }
  }
  
  try {
    const params = new URLSearchParams({
      engine: 'google_maps',
      q: location,
      api_key: SERPAPI_KEY
    });
    
    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();
    
    if (data.place_results?.gps_coordinates) {
      const coords = {
        lat: data.place_results.gps_coordinates.latitude,
        lon: data.place_results.gps_coordinates.longitude
      };
      console.log(`   Found coordinates via Google Maps: ${coords.lat}, ${coords.lon}`);
      return coords;
    }
  } catch (error) {
    console.error('Error getting coordinates:', error.message);
  }
  
  console.warn(`Could not find coordinates for: ${location}`);
  return { lat: 0, lon: 0 };
}

// 🛫 FLIGHTS - Enhanced with automatic airport code conversion
export async function searchFlights({
  origin,
  destination,
  date,
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
    
    console.log(`   Route: ${origin} (${originCode}) → ${destination} (${destCode})`);

    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: originCode,
      arrival_id: destCode,
      outbound_date: date,
      adults: adults.toString(),
      currency: 'USD',
      hl: 'en',
      api_key: SERPAPI_KEY
    });

    if (tripType === 'round_trip' && returnDate) {
      params.append('return_date', returnDate);
      params.append('type', '1');
    } else {
      params.append('type', '2');
    }

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.error) {
      console.error('❌ SerpApi error:', data.error);
      return { data: [] };
    }

    const flights = (data.best_flights || data.other_flights || []).map(flight => {
      // Extract airline name more carefully
      const airlineName = flight.airlines?.[0] || 
                         flight.flights?.[0]?.airline ||
                         'Unknown Airline';
      
      // Get departure and arrival info
      const departureAirport = flight.departure_airport?.name || 
                              flight.flights?.[0]?.departure_airport?.name ||
                              originCode;
      
      const arrivalAirport = flight.arrival_airport?.name || 
                            flight.flights?.[flight.flights?.length - 1]?.arrival_airport?.name ||
                            destCode;
      
      return {
        airline: airlineName,
        price: flight.price ? `USD ${flight.price}` : 'Price unavailable',
        departure: departureAirport,
        arrival: arrivalAirport,
        departureTime: flight.departure_time || flight.flights?.[0]?.departure_time || 'N/A',
        arrivalTime: flight.arrival_time || flight.flights?.[flight.flights?.length - 1]?.arrival_time || 'N/A',
        duration: flight.total_duration || flight.duration || 'N/A',
        stops: flight.layovers?.length || flight.stops || 0,
        bookingLink: flight.booking_link || '#',
        carbonEmissions: flight.carbon_emissions?.this_flight ? 
          `${flight.carbon_emissions.this_flight}kg` : undefined,
        layovers: flight.layovers,
        flightNumber: flight.flights?.[0]?.flight_number || ''
      };
    });

    console.log(`✅ Found ${flights.length} flights`);
    return { data: flights };

  } catch (error) {
    console.error('❌ SerpApi Flights error:', error.message);
    return { data: [] };
  }
}

// 🏨 HOTELS - Enhanced with better image handling
export async function searchHotels({
  location,
  checkIn,
  checkOut,
  adults = 2,
  children = 0
}) {
  try {
    console.log('🏨 Searching hotels with SerpApi Google Hotels...');
    
    if (!SERPAPI_KEY) {
      console.error('❌ SERPAPI_KEY is missing!');
      return { data: [] };
    }

    const params = new URLSearchParams({
      engine: 'google_hotels',
      q: location,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: adults.toString(),
      children: children.toString(),
      currency: 'USD',
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.error) {
      console.error('❌ SerpApi error:', data.error);
      return { data: [] };
    }

    const hotelsWithImages = await Promise.all(
      (data.properties || []).slice(0, 9).map(async (hotel) => {
        let images = [];
        try {
          images = await getImages(`${hotel.name} ${location} hotel`, 'hotel');
        } catch (error) {
          console.warn(`Failed to get images for ${hotel.name}`);
        }
        
        return {
          name: hotel.name,
          rating: hotel.overall_rating || 4.5,
          reviews: hotel.reviews || 'No reviews',
          price: `$${hotel.rate_per_night?.extracted_lowest || hotel.total_rate?.extracted_lowest || 'N/A'}`,
          location: location,
          link: hotel.link || '#',
          amenities: hotel.amenities || [],
          image: images.length > 0 ? images[0].url : null,
          mapUrl: hotel.gps_coordinates ? 
            `https://maps.google.com/maps?q=${hotel.gps_coordinates.latitude},${hotel.gps_coordinates.longitude}` :
            `https://maps.google.com/maps?q=${encodeURIComponent(hotel.name + ' ' + location)}`,
          address: hotel.address || location
        };
      })
    );

    console.log(`✅ Found ${hotelsWithImages.length} hotels`);
    return { data: hotelsWithImages };

  } catch (error) {
    console.error('❌ SerpApi Hotels error:', error.message);
    return { data: [] };
  }
}

// 📍 POINTS OF INTEREST - Enhanced with images
export async function searchPOI({ 
  location, 
  query = 'tourist attractions must visit iconic places',
  limit = 9 
}) {
  try {
    console.log('📍 Searching POIs with SerpApi Google Local...');
    
    if (!SERPAPI_KEY) {
      console.error('❌ SERPAPI_KEY is missing!');
      return { data: [] };
    }

    const params = new URLSearchParams({
      engine: 'google_local',
      q: `${query} in ${location}`,
      hl: 'en',
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.error) {
      console.error('❌ SerpApi error:', data.error);
      return { data: [] };
    }

    const poisWithImages = await Promise.all(
      (data.local_results || []).slice(0, limit).map(async (poi) => {
        let images = [];
        try {
          images = await getImages(`${poi.title} ${location}`, 'poi');
        } catch (error) {
          console.warn(`Failed to get images for ${poi.title}`);
        }

        return {
          name: poi.title,
          rating: poi.rating || 4.5,
          reviews: poi.reviews || 0,
          address: poi.address || location,
          hours: poi.hours || 'Hours not available',
          phone: poi.phone,
          website: poi.website,
          image: images.length > 0 ? images[0].url : null,
          mapUrl: poi.gps_coordinates ? 
            `https://maps.google.com/maps?q=${poi.gps_coordinates.latitude},${poi.gps_coordinates.longitude}` :
            `https://maps.google.com/maps?q=${encodeURIComponent(poi.title + ' ' + location)}`,
          description: poi.description || poi.type || 'Tourist attraction',
          type: poi.type || 'Attraction',
          price: poi.price || 'Free'
        };
      })
    );

    console.log(`✅ Found ${poisWithImages.length} POIs`);
    return { data: poisWithImages };

  } catch (error) {
    console.error('❌ SerpApi POI error:', error.message);
    return { data: [] };
  }
}

// 🍽️ RESTAURANTS - New function for restaurant search
export async function searchRestaurants({ 
  location, 
  cuisine = '',
  priceRange = '',
  limit = 9 
}) {
  try {
    console.log('🍽️ Searching restaurants with SerpApi Google Local...');
    
    if (!SERPAPI_KEY) {
      console.error('❌ SERPAPI_KEY is missing!');
      return { data: [] };
    }

    let searchQuery = `restaurants in ${location}`;
    if (cuisine) searchQuery = `${cuisine} restaurants in ${location}`;
    if (priceRange) searchQuery += ` ${priceRange}`;

    const params = new URLSearchParams({
      engine: 'google_local',
      q: searchQuery,
      hl: 'en',
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.error) {
      console.error('❌ SerpApi error:', data.error);
      return { data: [] };
    }

    console.log(`✅ Found ${data.local_results?.length || 0} restaurants`);
    console.log('📊 Full Restaurant Response:', JSON.stringify(data.local_results?.slice(0, 2), null, 2));

    const restaurantsWithImages = await Promise.all(
      (data.local_results || []).slice(0, limit).map(async (restaurant) => {
        let images = [];
        try {
          images = await getImages(`${restaurant.title} ${location} restaurant`, 'restaurant');
        } catch (error) {
          console.warn(`Failed to get images for ${restaurant.title}`);
        }

        // Create Google Maps URL with place name
        const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(restaurant.title + ' ' + location)}`;

        return {
          name: restaurant.title,
          rating: restaurant.rating || 4.0,
          reviews: restaurant.reviews || 0,
          priceLevel: restaurant.price || '$',
          cuisine: cuisine || restaurant.type || 'International',
          address: restaurant.address || location,
          hours: restaurant.hours || 'Hours vary',
          phone: restaurant.phone,
          website: restaurant.website,
          image: images.length > 0 ? images[0].url : null,
          mapUrl: mapUrl,
          description: restaurant.description || `${cuisine || 'Great'} restaurant in ${location}`,
          type: 'Restaurant',
          dineIn: restaurant.dine_in !== false,
          takeout: restaurant.takeout !== false,
          delivery: restaurant.delivery !== false
        };
      })
    );
    return { data: restaurantsWithImages };

  } catch (error) {
    console.error('❌ SerpApi Restaurants error:', error.message);
    return { data: [] };
  }
}

// 🌤️ WEATHER - with automatic coordinate detection
export async function getWeather({ location }) {
  try {
    console.log('🌤️ Getting weather forecast...');
    
    const coordinates = await getCityCoordinates(location);
    
    if (!coordinates.lat || !coordinates.lon) {
      console.error('❌ Could not determine coordinates');
      return { data: [] };
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=10`;
    
    const res = await fetch(url);
    const data = await res.json();

    console.log('📊 Full Weather Response:', JSON.stringify(data, null, 2));

    if (!data.daily) {
      console.error('❌ No daily weather data found');
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

// Helper function to get weather condition
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

// 🖼️ Enhanced image search for all types
async function getImages(query, type = 'general') {
  try {
    const imageQuery = type === 'restaurant' ? 
      `${query} interior exterior food` :
      type === 'hotel' ? 
      `${query} exterior lobby room` :
      type === 'poi' ?
      `${query} tourist attraction landmark` :
      query;

    const params = new URLSearchParams({
      engine: 'google_images',
      q: imageQuery,
      num: 5,
      safe: 'active',
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.images_results && data.images_results.length > 0) {
      const goodImages = data.images_results.filter(img => 
        img.original && 
        img.original.startsWith('http') &&
        !img.original.includes('favicon') &&
        !img.original.includes('logo') &&
        !img.original.includes('icon')
      );
      
      return goodImages.slice(0, 3).map(img => ({
        url: img.original,
        thumbnail: img.thumbnail,
        title: img.title
      }));
    }

    return [];
  } catch (error) {
    console.error('Error getting images:', error.message);
    return [];
  }
}