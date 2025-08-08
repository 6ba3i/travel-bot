// src/lib/serpApi.js - Complete SerpApi integration
import fetch from 'node-fetch';

const SERPAPI_KEY = process.env.SERPAPI_KEY; // Single API key for everything!
const BASE_URL = 'https://serpapi.com/search';

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

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    console.log(`✅ Found ${data.best_flights?.length || 0} flights`);

    const flights = data.best_flights?.map(flight => ({
      price: {
        total_amount: flight.price,
        currency: data.search_parameters?.currency || 'USD'
      },
      routes: [{
        airline: flight.flights?.[0]?.airline,
        departureTime: flight.flights?.[0]?.departure_airport?.time,
        arrivalTime: flight.flights?.[0]?.arrival_airport?.time,
        duration: flight.total_duration,
        stops: flight.flights?.length - 1
      }],
      booking_link: flight.booking_options?.[0]?.book_with_url || '#',
      carbon_emissions: flight.carbon_emissions?.this_flight,
      layovers: flight.layovers
    })) || [];

    return { data: flights };

  } catch (error) {
    console.error('❌ SerpApi Flights error:', error);
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

    console.log(`✅ Found ${data.properties?.length || 0} hotels`);

    const hotels = data.properties?.map(hotel => ({
      hotel: {
        name: hotel.name,
        location: hotel.link,
        rating: hotel.overall_rating,
        reviews: hotel.reviews
      },
      offers: [{
        price: {
          total: hotel.rate_per_night?.extracted_lowest || hotel.total_rate?.extracted_lowest,
          currency: 'USD'
        },
        url: hotel.link,
        amenities: hotel.amenities
      }],
      coordinates: hotel.gps_coordinates
    })) || [];

    return { data: hotels };

  } catch (error) {
    console.error('❌ SerpApi Hotels error:', error);
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
    
    const params = new URLSearchParams({
      engine: 'google_local',
      q: `${query} in ${location}`,
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    console.log(`✅ Found ${data.local_results?.length || 0} POIs`);

    const pois = data.local_results?.slice(0, limit).map(poi => ({
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
    })) || [];

    return pois;

  } catch (error) {
    console.error('❌ SerpApi Local error:', error);
    return [];
  }
}

// 🗺️ MAPS & LOCATIONS
export async function searchMaps({ 
  query, 
  location 
}) {
  try {
    console.log('🗺️ Searching maps with SerpApi Google Maps...');
    
    const params = new URLSearchParams({
      engine: 'google_maps',
      q: query,
      ll: location, // lat,lng format
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    return data.local_results || [];

  } catch (error) {
    console.error('❌ SerpApi Maps error:', error);
    return [];
  }
}

// ⭐ REVIEWS 
export async function getReviews({ 
  place_id 
}) {
  try {
    console.log('⭐ Getting reviews with SerpApi Google Maps Reviews...');
    
    const params = new URLSearchParams({
      engine: 'google_maps_reviews',
      place_id: place_id,
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    return data.reviews || [];

  } catch (error) {
    console.error('❌ SerpApi Reviews error:', error);
    return [];
  }
}

// 🌤️ You can keep OpenWeather for weather since it's free and works well
export async function getWeather({ lat, lon }) {
  try {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${process.env.OWM_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (error) {
    console.error('❌ Weather error:', error);
    return null;
  }
}