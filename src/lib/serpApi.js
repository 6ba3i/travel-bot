// src/lib/serpApi.js - Enhanced with 7-day weather, currency support, and hotel images
import fetch from 'node-fetch';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const BASE_URL = 'https://serpapi.com/search';

// Check if API key is loaded
if (!SERPAPI_KEY) {
  console.error('❌ SERPAPI_KEY is not defined in environment variables!');
  console.error('   Please check your .env file');
}

// 🌍 Get coordinates from city name using Google geocoding
async function getCityCoordinates(cityName) {
  try {
    const params = new URLSearchParams({
      engine: 'google',
      q: `${cityName} coordinates`,
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    // Extract coordinates from knowledge graph or organic results
    if (data.knowledge_graph?.coordinates) {
      return data.knowledge_graph.coordinates;
    }

    // Fallback: hardcoded major cities
    const cityCoords = {
      'casablanca': { lat: 33.5731, lon: -7.5898 },
      'barcelona': { lat: 41.3851, lon: 2.1734 },
      'paris': { lat: 48.8566, lon: 2.3522 },
      'madrid': { lat: 40.4168, lon: -3.7038 },
      'london': { lat: 51.5074, lon: -0.1278 },
      'tokyo': { lat: 35.6762, lon: 139.6503 },
      'new york': { lat: 40.7128, lon: -74.0060 },
      'dubai': { lat: 25.2048, lon: 55.2708 },
      'istanbul': { lat: 41.0082, lon: 28.9784 },
      'los angeles': { lat: 34.0522, lon: -118.2437 }
    };

    const normalizedCity = cityName.toLowerCase();
    return cityCoords[normalizedCity] || { lat: 0, lon: 0 };
  } catch (error) {
    console.error('❌ Error getting city coordinates:', error.message);
    return { lat: 0, lon: 0 };
  }
}

// 🖼️ Get hotel images using Google Images search
async function getHotelImages(hotelName, location) {
  try {
    const params = new URLSearchParams({
      engine: 'google_images',
      q: `${hotelName} ${location} hotel`,
      num: 3,
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.images_results && data.images_results.length > 0) {
      return data.images_results.slice(0, 3).map(img => ({
        url: img.original,
        thumbnail: img.thumbnail,
        title: img.title
      }));
    }

    return [];
  } catch (error) {
    console.error('❌ Error getting hotel images:', error.message);
    return [];
  }
}

// 🛫 FLIGHTS - Enhanced with better location handling
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
    console.log('   Parameters:', { origin, destination, date, returnDate, adults, tripType });
    
    if (!SERPAPI_KEY) {
      console.error('❌ SERPAPI_KEY is missing!');
      return { data: [] };
    }

    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: origin.toUpperCase(),
      arrival_id: destination.toUpperCase(),
      outbound_date: date,
      type: tripType === 'round_trip' ? '1' : '2',
      adults: adults.toString(),
      api_key: SERPAPI_KEY
    });

    if (returnDate && tripType === 'round_trip') {
      params.append('return_date', returnDate);
    }

    const url = `${BASE_URL}?${params}`;
    console.log('   Request URL:', url.replace(SERPAPI_KEY, 'HIDDEN'));

    const res = await fetch(url);
    const data = await res.json();

    // Check for API errors
    if (data.error) {
      console.error('❌ SerpApi returned an error:', data.error);
      return { data: [] };
    }

    console.log(`✅ Found ${data.best_flights?.length || 0} best flights`);

    // Try best_flights first, then other_flights
    const flightData = data.best_flights || data.other_flights || [];
    
    const flights = flightData.map(flight => ({
      price: {
        total_amount: flight.price,
        currency: data.search_parameters?.currency || 'USD'
      },
      routes: [{
        airline: flight.flights?.[0]?.airline || 'Unknown Airline',
        departure: flight.flights?.[0]?.departure_airport?.name || origin,
        arrival: flight.flights?.[0]?.arrival_airport?.name || destination,
        departureTime: flight.flights?.[0]?.departure_airport?.time,
        arrivalTime: flight.flights?.[0]?.arrival_airport?.time,
        duration: flight.total_duration || 'Unknown',
        stops: (flight.flights?.length || 1) - 1
      }],
      booking_link: flight.booking_options?.[0]?.book_with_url || `https://www.google.com/flights#flt=${origin}.${destination}.${date};c:${data.search_parameters?.currency || 'USD'};e:1`,
      carbon_emissions: flight.carbon_emissions?.this_flight,
      layovers: flight.layovers
    }));

    console.log(`   Formatted ${flights.length} flights for response`);
    return { data: flights };

  } catch (error) {
    console.error('❌ SerpApi Flights error:', error.message);
    return { data: [] };
  }
}

// 🏨 HOTELS - Enhanced with images and maps
export async function searchHotels({
  location,
  checkIn,
  checkOut,
  adults = 2,
  children = 0
}) {
  try {
    console.log('🏨 Searching hotels with SerpApi Google Hotels...');
    console.log('   Parameters:', { location, checkIn, checkOut, adults, children });
    
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

    const url = `${BASE_URL}?${params}`;
    console.log('   Request URL:', url.replace(SERPAPI_KEY, 'HIDDEN'));

    const res = await fetch(url);
    const data = await res.json();

    // Check for API errors
    if (data.error) {
      console.error('❌ SerpApi returned an error:', data.error);
      return { data: [] };
    }

    console.log(`✅ Found ${data.properties?.length || 0} hotels`);

    // Get images for hotels in parallel
    const hotelsWithImages = await Promise.all(
      (data.properties || []).slice(0, 6).map(async (hotel) => {
        const images = await getHotelImages(hotel.name, location);
        
        return {
          hotel: {
            name: hotel.name,
            location: hotel.link,
            rating: hotel.overall_rating,
            reviews: hotel.reviews,
            address: hotel.address
          },
          offers: [{
            price: {
              total: hotel.rate_per_night?.extracted_lowest || hotel.total_rate?.extracted_lowest || 'Price not available',
              currency: 'USD'
            },
            url: hotel.link,
            amenities: hotel.amenities
          }],
          coordinates: hotel.gps_coordinates,
          images: images,
          mapUrl: hotel.gps_coordinates ? 
            `https://maps.google.com/maps?q=${hotel.gps_coordinates.latitude},${hotel.gps_coordinates.longitude}` :
            `https://maps.google.com/maps?q=${encodeURIComponent(hotel.name + ' ' + location)}`
        };
      })
    );

    console.log(`   Formatted ${hotelsWithImages.length} hotels with images`);
    return { data: hotelsWithImages };

  } catch (error) {
    console.error('❌ SerpApi Hotels error:', error.message);
    return { data: [] };
  }
}

// 📍 POINTS OF INTEREST with Google Maps integration
export async function searchPOI({ 
  location, 
  query = 'tourist attractions',
  limit = 10 
}) {
  try {
    console.log('📍 Searching POIs with SerpApi Google Local...');
    console.log('   Parameters:', { location, query, limit });
    
    if (!SERPAPI_KEY) {
      console.error('❌ SERPAPI_KEY is missing!');
      return [];
    }

    const params = new URLSearchParams({
      engine: 'google_local',
      q: `${query} in ${location}`,
      api_key: SERPAPI_KEY
    });

    const url = `${BASE_URL}?${params}`;
    console.log('   Request URL:', url.replace(SERPAPI_KEY, 'HIDDEN'));

    const res = await fetch(url);
    const data = await res.json();

    // Check for API errors
    if (data.error) {
      console.error('❌ SerpApi returned an error:', data.error);
      return [];
    }

    console.log(`✅ Found ${data.local_results?.length || 0} POIs`);

    const pois = (data.local_results || []).slice(0, limit).map(poi => ({
      name: poi.title,
      rating: poi.rating,
      reviews: poi.reviews,
      address: poi.address,
      phone: poi.phone,
      website: poi.website,
      hours: poi.hours,
      price_level: poi.price,
      coordinates: poi.gps_coordinates,
      link: poi.website || `https://www.google.com/search?q=${encodeURIComponent(poi.title + ' ' + location)}`,
      mapUrl: poi.gps_coordinates ? 
        `https://maps.google.com/maps?q=${poi.gps_coordinates.latitude},${poi.gps_coordinates.longitude}` :
        `https://maps.google.com/maps?q=${encodeURIComponent(poi.title + ' ' + location)}`
    }));

    console.log(`   Formatted ${pois.length} POIs for response`);
    return pois;

  } catch (error) {
    console.error('❌ SerpApi Local error:', error.message);
    return [];
  }
}

// 🌤️ Enhanced 7-day weather forecast with auto-location detection
export async function getWeather({ lat, lon, city }) {
  try {
    console.log('🌤️ Getting 7-day weather forecast...');
    
    // If city is provided but no coordinates, get them first
    if (city && (!lat || !lon)) {
      const coords = await getCityCoordinates(city);
      lat = coords.lat;
      lon = coords.lon;
    }
    
    console.log('   Coordinates:', { lat, lon });
    
    const OWM_KEY = process.env.VITE_OWM_KEY || process.env.OWM_KEY;
    if (!OWM_KEY) {
      console.error('❌ OpenWeather API key is missing!');
      return null;
    }

    // Get 7-day forecast using OneCall API 3.0
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${OWM_KEY}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      const error = await res.text();
      console.error('❌ OpenWeather error:', error);
      throw new Error(error);
    }
    
    const data = await res.json();
    console.log('✅ 7-day weather forecast received');
    
    // Format for better display
    return {
      current: data.current,
      daily: data.daily.slice(0, 7), // 7-day forecast
      hourly: data.hourly.slice(0, 24), // 24-hour forecast
      location: { lat, lon },
      timezone: data.timezone
    };
    
  } catch (error) {
    console.error('❌ Weather error:', error.message);
    return null;
  }
}