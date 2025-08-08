// src/lib/serpApi.js - Enhanced with debugging and error handling
import fetch from 'node-fetch';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const BASE_URL = 'https://serpapi.com/search';

// Check if API key is loaded
if (!SERPAPI_KEY) {
  console.error('❌ SERPAPI_KEY is not defined in environment variables!');
  console.error('   Please check your .env file');
}

// 🛫 FLIGHTS - Replace Amadeus
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

    console.log('   Raw response status:', res.status);
    console.log('   Response keys:', Object.keys(data));
    console.log(`✅ Found ${data.best_flights?.length || 0} best flights`);
    console.log(`   Also found ${data.other_flights?.length || 0} other flights`);

    // Try best_flights first, then other_flights
    const flightData = data.best_flights || data.other_flights || [];
    
    const flights = flightData.map(flight => ({
      price: {
        total_amount: flight.price,
        currency: data.search_parameters?.currency || 'USD'
      },
      routes: [{
        airline: flight.flights?.[0]?.airline || 'Unknown Airline',
        departureTime: flight.flights?.[0]?.departure_airport?.time,
        arrivalTime: flight.flights?.[0]?.arrival_airport?.time,
        duration: flight.total_duration || 'Unknown',
        stops: (flight.flights?.length || 1) - 1
      }],
      booking_link: flight.booking_options?.[0]?.book_with_url || '#',
      carbon_emissions: flight.carbon_emissions?.this_flight,
      layovers: flight.layovers
    }));

    console.log(`   Formatted ${flights.length} flights for response`);
    return { data: flights };

  } catch (error) {
    console.error('❌ SerpApi Flights error:', error.message);
    console.error('   Stack:', error.stack);
    return { data: [] };
  }
}

// 🏨 HOTELS - Replace Amadeus  
export async function searchHotels({
  location, // Can be city name, coordinates, etc.
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

    console.log('   Response keys:', Object.keys(data));
    console.log(`✅ Found ${data.properties?.length || 0} hotels`);

    const hotels = (data.properties || []).map(hotel => ({
      hotel: {
        name: hotel.name,
        location: hotel.link,
        rating: hotel.overall_rating,
        reviews: hotel.reviews
      },
      offers: [{
        price: {
          total: hotel.rate_per_night?.extracted_lowest || hotel.total_rate?.extracted_lowest || 'Price not available',
          currency: 'USD'
        },
        url: hotel.link,
        amenities: hotel.amenities
      }],
      coordinates: hotel.gps_coordinates
    }));

    console.log(`   Formatted ${hotels.length} hotels for response`);
    return { data: hotels };

  } catch (error) {
    console.error('❌ SerpApi Hotels error:', error.message);
    console.error('   Stack:', error.stack);
    return { data: [] };
  }
}

// 📍 POINTS OF INTEREST - Replace OpenTripMap
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

    console.log('   Response keys:', Object.keys(data));
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
      link: poi.website || `https://www.google.com/search?q=${encodeURIComponent(poi.title + ' ' + location)}`
    }));

    console.log(`   Formatted ${pois.length} POIs for response`);
    return pois;

  } catch (error) {
    console.error('❌ SerpApi Local error:', error.message);
    console.error('   Stack:', error.stack);
    return [];
  }
}

// 🌤️ Keep OpenWeather for weather since it's free and works well
export async function getWeather({ lat, lon }) {
  try {
    console.log('🌤️ Getting weather from OpenWeather...');
    console.log('   Coordinates:', { lat, lon });
    
    const OWM_KEY = process.env.VITE_OWM_KEY || process.env.OWM_KEY;
    if (!OWM_KEY) {
      console.error('❌ OpenWeather API key is missing!');
      return null;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      const error = await res.text();
      console.error('❌ OpenWeather error:', error);
      throw new Error(error);
    }
    
    const data = await res.json();
    console.log('✅ Weather data received');
    return data;
    
  } catch (error) {
    console.error('❌ Weather error:', error.message);
    return null;
  }
}