// src/lib/serpApi.js - Enhanced with global location support and automatic coordinate lookup
import fetch from 'node-fetch';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const BASE_URL = 'https://serpapi.com/search';

// Check if API key is loaded
if (!SERPAPI_KEY) {
  console.error('❌ SERPAPI_KEY is not defined in environment variables!');
  console.error('   Please check your .env file');
}

// 🌍 Enhanced airport code conversion mapping with international names
const CITY_TO_AIRPORT = {
  // English names
  'casablanca': 'CMN', 'barcelona': 'BCN', 'paris': 'CDG', 'london': 'LHR',
  'madrid': 'MAD', 'new york': 'JFK', 'tokyo': 'NRT', 'dubai': 'DXB',
  'istanbul': 'IST', 'los angeles': 'LAX', 'rome': 'FCO', 'amsterdam': 'AMS',
  'frankfurt': 'FRA', 'zurich': 'ZUR', 'milan': 'MXP', 'venice': 'VCE',
  'florence': 'FLR', 'berlin': 'BER', 'munich': 'MUC', 'vienna': 'VIE',
  'brussels': 'BRU', 'lisbon': 'LIS', 'porto': 'OPO', 'oslo': 'OSL',
  'stockholm': 'ARN', 'copenhagen': 'CPH', 'helsinki': 'HEL', 'athens': 'ATH',
  'budapest': 'BUD', 'prague': 'PRG', 'warsaw': 'WAW', 'moscow': 'SVO',
  'saint petersburg': 'LED', 'cairo': 'CAI', 'marrakech': 'RAK',
  'rabat': 'RBA', 'fez': 'FEZ', 'tangier': 'TNG', 'agadir': 'AGA',
  'beijing': 'PEK', 'shanghai': 'PVG', 'guangzhou': 'CAN', 'shenzhen': 'SZX',
  'hong kong': 'HKG', 'singapore': 'SIN', 'bangkok': 'BKK', 'kuala lumpur': 'KUL',
  'jakarta': 'CGK', 'manila': 'MNL', 'seoul': 'ICN', 'mumbai': 'BOM',
  'delhi': 'DEL', 'chennai': 'MAA', 'bangalore': 'BLR', 'sydney': 'SYD',
  'melbourne': 'MEL', 'brisbane': 'BNE', 'auckland': 'AKL', 'toronto': 'YYZ',
  'vancouver': 'YVR', 'montreal': 'YUL', 'mexico city': 'MEX', 'cancun': 'CUN',
  'sao paulo': 'GRU', 'rio de janeiro': 'GIG', 'buenos aires': 'EZE',
  'lima': 'LIM', 'bogota': 'BOG', 'santiago': 'SCL', 'cape town': 'CPT',
  'johannesburg': 'JNB', 'nairobi': 'NBO', 'addis ababa': 'ADD', 'lagos': 'LOS',
  
  // Arabic names (romanized and native)
  'الدار البيضاء': 'CMN', 'dar albaida': 'CMN', 'ad dar al bayda': 'CMN',
  'برشلونة': 'BCN', 'barshiluna': 'BCN',
  'باريس': 'CDG', 'baris': 'CDG',
  'لندن': 'LHR', 'landan': 'LHR',
  'مدريد': 'MAD', 'madrid': 'MAD',
  'نيويورك': 'JFK', 'nyu yurk': 'JFK',
  'طوكيو': 'NRT', 'tukyu': 'NRT',
  'دبي': 'DXB', 'dubai': 'DXB',
  'إسطنبول': 'IST', 'istanbol': 'IST',
  'القاهرة': 'CAI', 'qahira': 'CAI',
  'مراكش': 'RAK', 'marakish': 'RAK',
  'الرباط': 'RBA', 'ribat': 'RBA',
  'فاس': 'FEZ', 'fas': 'FEZ',
  'طنجة': 'TNG', 'tanja': 'TNG',
  
  // Chinese names (simplified)
  '卡萨布兰卡': 'CMN', '卡薩布蘭卡': 'CMN',
  '巴塞罗那': 'BCN', '巴塞羅那': 'BCN',
  '巴黎': 'CDG',
  '伦敦': 'LHR', '倫敦': 'LHR',
  '马德里': 'MAD', '馬德里': 'MAD',
  '纽约': 'JFK', '紐約': 'JFK',
  '东京': 'NRT', '東京': 'NRT',
  '迪拜': 'DXB',
  '伊斯坦布尔': 'IST', '伊斯坦堡': 'IST',
  '北京': 'PEK',
  '上海': 'PVG',
  '香港': 'HKG',
  '新加坡': 'SIN',
  '曼谷': 'BKK',
  '首尔': 'ICN', '首爾': 'ICN',
  
  // French names
  'barcelone': 'BCN',
  'londres': 'LHR',
  'lisbonne': 'LIS',
  'bruxelles': 'BRU',
  'vienne': 'VIE',
  'moscou': 'SVO',
  'pékin': 'PEK',
  'hong-kong': 'HKG',
  
  // Spanish names
  'londres': 'LHR',
  'tokio': 'NRT',
  'pekín': 'PEK',
  'nueva york': 'JFK',
  
  // Popular destinations
  'bali': 'DPS',
  'denpasar': 'DPS',
  'phuket': 'HKT',
  'maldives': 'MLE',
  'male': 'MLE',
  'seychelles': 'SEZ',
  'mauritius': 'MRU',
  'fiji': 'NAN',
  'tahiti': 'PPT',
  'santorini': 'JTR',
  'mykonos': 'JMK',
  'ibiza': 'IBZ',
  'mallorca': 'PMI',
  'palma': 'PMI',
  'nice': 'NCE',
  'cannes': 'NCE',
  'monaco': 'NCE'
};

// 🛩️ Airline website mapping for direct booking
const AIRLINE_WEBSITES = {
  'Royal Air Maroc': 'https://www.royalairmaroc.com',
  'Air France': 'https://www.airfrance.com',
  'Lufthansa': 'https://www.lufthansa.com',
  'Emirates': 'https://www.emirates.com',
  'Turkish Airlines': 'https://www.turkishairlines.com',
  'British Airways': 'https://www.britishairways.com',
  'KLM': 'https://www.klm.com',
  'Iberia': 'https://www.iberia.com',
  'Qatar Airways': 'https://www.qatarairways.com',
  'Delta': 'https://www.delta.com',
  'American Airlines': 'https://www.aa.com',
  'United': 'https://www.united.com',
  'Swiss': 'https://www.swiss.com',
  'Austrian Airlines': 'https://www.austrian.com',
  'Brussels Airlines': 'https://www.brusselsairlines.com',
  'TAP Air Portugal': 'https://www.flytap.com',
  'Alitalia': 'https://www.alitalia.com',
  'Vueling': 'https://www.vueling.com',
  'Ryanair': 'https://www.ryanair.com',
  'EasyJet': 'https://www.easyjet.com',
  'Norwegian': 'https://www.norwegian.com',
  'Finnair': 'https://www.finnair.com',
  'SAS': 'https://www.flysas.com',
  'LOT Polish Airlines': 'https://www.lot.com',
  'Czech Airlines': 'https://www.czechairlines.com',
  'Air Canada': 'https://www.aircanada.com',
  'Japan Airlines': 'https://www.jal.com',
  'All Nippon Airways': 'https://www.ana.co.jp',
  'Singapore Airlines': 'https://www.singaporeair.com',
  'Thai Airways': 'https://www.thaiairways.com',
  'Korean Air': 'https://www.koreanair.com',
  'Cathay Pacific': 'https://www.cathaypacific.com'
};

// 🛩️ Convert city name or airport code to IATA code
function getAirportCode(location) {
  if (!location) return '';
  
  const normalized = location.toLowerCase().trim();
  
  // If it's already a 3-letter code, return it uppercase
  if (/^[a-z]{3}$/i.test(normalized)) {
    return normalized.toUpperCase();
  }
  
  // Check our comprehensive mapping
  const airportCode = CITY_TO_AIRPORT[normalized];
  if (airportCode) {
    console.log(`   ✅ Converted "${location}" → ${airportCode}`);
    return airportCode;
  }
  
  // Try fuzzy matching for common variations
  for (const [city, code] of Object.entries(CITY_TO_AIRPORT)) {
    if (city.includes(normalized) || normalized.includes(city)) {
      console.log(`   ✅ Fuzzy matched "${location}" → ${code} (via ${city})`);
      return code;
    }
  }
  
  // If no mapping found, try to extract from common patterns
  const patterns = [
    /\b([A-Z]{3})\b/,
    /([A-Z]{3})$/
  ];
  
  for (const pattern of patterns) {
    const match = location.match(pattern);
    if (match) {
      console.log(`   ✅ Extracted airport code "${match[1]}" from "${location}"`);
      return match[1];
    }
  }
  
  console.warn(`   ⚠️ Could not convert "${location}" to airport code. Using as-is.`);
  return location.toUpperCase();
}

// 🌍 Enhanced coordinate lookup using Google geocoding through SerpApi
async function getCityCoordinates(cityName) {
  try {
    console.log(`   🔍 Looking up coordinates for: ${cityName}`);
    
    // First try Google search for coordinates
    const params = new URLSearchParams({
      engine: 'google',
      q: `${cityName} coordinates latitude longitude`,
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    // Try to extract coordinates from knowledge graph
    if (data.knowledge_graph?.coordinates) {
      console.log(`   ✅ Found coordinates in knowledge graph: ${JSON.stringify(data.knowledge_graph.coordinates)}`);
      return data.knowledge_graph.coordinates;
    }

    // Try to extract from organic results
    if (data.organic_results) {
      for (const result of data.organic_results) {
        const text = (result.snippet || result.title || '').toLowerCase();
        
        // Look for coordinate patterns in text
        const coordPattern = /(-?\d+\.?\d*)[°\s]*[ns]?\s*[,\s]\s*(-?\d+\.?\d*)[°\s]*[ew]?/i;
        const match = text.match(coordPattern);
        
        if (match) {
          const lat = parseFloat(match[1]);
          const lon = parseFloat(match[2]);
          
          // Basic validation
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            console.log(`   ✅ Extracted coordinates from search: lat=${lat}, lon=${lon}`);
            return { lat, lon };
          }
        }
      }
    }

    // Fallback to Google Maps search
    const mapsParams = new URLSearchParams({
      engine: 'google_maps',
      q: cityName,
      api_key: SERPAPI_KEY
    });

    const mapsRes = await fetch(`${BASE_URL}?${mapsParams}`);
    const mapsData = await mapsRes.json();

    if (mapsData.place_results?.gps_coordinates) {
      console.log(`   ✅ Found coordinates via Google Maps: ${JSON.stringify(mapsData.place_results.gps_coordinates)}`);
      return {
        lat: mapsData.place_results.gps_coordinates.latitude,
        lon: mapsData.place_results.gps_coordinates.longitude
      };
    }

    // Enhanced fallback for major cities worldwide
    const cityCoords = {
      // Major cities
      'casablanca': { lat: 33.5731, lon: -7.5898 },
      'barcelona': { lat: 41.3851, lon: 2.1734 },
      'paris': { lat: 48.8566, lon: 2.3522 },
      'madrid': { lat: 40.4168, lon: -3.7038 },
      'london': { lat: 51.5074, lon: -0.1278 },
      'tokyo': { lat: 35.6762, lon: 139.6503 },
      'new york': { lat: 40.7128, lon: -74.0060 },
      'dubai': { lat: 25.2048, lon: 55.2708 },
      'istanbul': { lat: 41.0082, lon: 28.9784 },
      'los angeles': { lat: 34.0522, lon: -118.2437 },
      
      // Popular destinations
      'bali': { lat: -8.3405, lon: 115.0920 },
      'denpasar': { lat: -8.6705, lon: 115.2126 },
      'phuket': { lat: 7.8804, lon: 98.3923 },
      'maldives': { lat: 3.2028, lon: 73.2207 },
      'male': { lat: 4.1755, lon: 73.5093 },
      'seychelles': { lat: -4.6796, lon: 55.4920 },
      'mauritius': { lat: -20.3484, lon: 57.5522 },
      'santorini': { lat: 36.3932, lon: 25.4615 },
      'mykonos': { lat: 37.4467, lon: 25.3289 },
      'ibiza': { lat: 38.9067, lon: 1.4206 },
      'nice': { lat: 43.7102, lon: 7.2620 },
      'cannes': { lat: 43.5528, lon: 7.0174 },
      'monaco': { lat: 43.7384, lon: 7.4246 },
      
      // Middle East & Africa
      'marrakech': { lat: 31.6295, lon: -7.9811 },
      'cairo': { lat: 30.0444, lon: 31.2357 },
      'cape town': { lat: -33.9249, lon: 18.4241 },
      'nairobi': { lat: -1.2921, lon: 36.8219 },
      
      // Asia Pacific
      'singapore': { lat: 1.3521, lon: 103.8198 },
      'bangkok': { lat: 13.7563, lon: 100.5018 },
      'hong kong': { lat: 22.3193, lon: 114.1694 },
      'seoul': { lat: 37.5665, lon: 126.9780 },
      'beijing': { lat: 39.9042, lon: 116.4074 },
      'shanghai': { lat: 31.2304, lon: 121.4737 },
      'mumbai': { lat: 19.0760, lon: 72.8777 },
      'delhi': { lat: 28.7041, lon: 77.1025 },
      'sydney': { lat: -33.8688, lon: 151.2093 },
      'melbourne': { lat: -37.8136, lon: 144.9631 },
      
      // Americas
      'toronto': { lat: 43.6532, lon: -79.3832 },
      'vancouver': { lat: 49.2827, lon: -123.1207 },
      'mexico city': { lat: 19.4326, lon: -99.1332 },
      'cancun': { lat: 21.1619, lon: -86.8515 },
      'sao paulo': { lat: -23.5558, lon: -46.6396 },
      'rio de janeiro': { lat: -22.9068, lon: -43.1729 },
      'buenos aires': { lat: -34.6118, lon: -58.3960 },
      'lima': { lat: -12.0464, lon: -77.0428 },
      
      // Alternative spellings and translations
      'الدار البيضاء': { lat: 33.5731, lon: -7.5898 },
      '卡萨布兰卡': { lat: 33.5731, lon: -7.5898 },
      '巴塞罗那': { lat: 41.3851, lon: 2.1734 },
      '巴黎': { lat: 48.8566, lon: 2.3522 },
      '伦敦': { lat: 51.5074, lon: -0.1278 },
      '东京': { lat: 35.6762, lon: 139.6503 },
      '迪拜': { lat: 25.2048, lon: 55.2708 },
      'バリ': { lat: -8.3405, lon: 115.0920 },
      'بالي': { lat: -8.3405, lon: 115.0920 }
    };

    const normalizedCity = cityName.toLowerCase().trim();
    
    // Direct match
    if (cityCoords[normalizedCity]) {
      console.log(`   ✅ Found in fallback coordinates: ${normalizedCity}`);
      return cityCoords[normalizedCity];
    }
    
    // Fuzzy match
    for (const [city, coords] of Object.entries(cityCoords)) {
      if (city.includes(normalizedCity) || normalizedCity.includes(city)) {
        console.log(`   ✅ Fuzzy matched in fallback: ${normalizedCity} → ${city}`);
        return coords;
      }
    }

    console.warn(`   ⚠️ Could not find coordinates for "${cityName}". Using default.`);
    return { lat: 0, lon: 0 };
    
  } catch (error) {
    console.error('❌ Error getting city coordinates:', error.message);
    return { lat: 0, lon: 0 };
  }
}

// 🕐 Enhanced time formatting function
function formatFlightTime(timeString, date) {
  if (!timeString) return null;
  
  try {
    let formattedTime;
    
    if (timeString.includes('T')) {
      formattedTime = new Date(timeString);
    } else if (timeString.includes(':')) {
      const today = new Date(date || new Date());
      
      if (timeString.includes('AM') || timeString.includes('PM')) {
        const [time, period] = timeString.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;
        
        formattedTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour24, parseInt(minutes));
      } else {
        const [hours, minutes] = timeString.split(':');
        formattedTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
      }
    } else {
      return timeString;
    }
    
    if (isNaN(formattedTime.getTime())) {
      return timeString;
    }
    
    return formattedTime.toTimeString().slice(0, 5);
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
}

// 🖼️ Enhanced hotel image search
async function getHotelImages(hotelName, location) {
  try {
    const params = new URLSearchParams({
      engine: 'google_images',
      q: `${hotelName} ${location} hotel exterior interior`,
      num: 5,
      safe: 'active',
      api_key: SERPAPI_KEY
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.images_results && data.images_results.length > 0) {
      // Filter for high-quality images
      const goodImages = data.images_results.filter(img => 
        img.original && 
        img.original.startsWith('http') &&
        !img.original.includes('favicon') &&
        !img.original.includes('logo')
      );
      
      return goodImages.slice(0, 3).map(img => ({
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

// 🛫 FLIGHTS - Enhanced with automatic airport code conversion and better data formatting
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
    console.log('   Raw parameters:', { origin, destination, date, returnDate, adults, tripType });
    
    if (!SERPAPI_KEY) {
      console.error('❌ SERPAPI_KEY is missing!');
      return { data: [] };
    }

    // Convert city names to airport codes
    const originCode = getAirportCode(origin);
    const destinationCode = getAirportCode(destination);
    
    console.log('   Converted parameters:', { 
      origin: `${origin} → ${originCode}`, 
      destination: `${destination} → ${destinationCode}`,
      date, returnDate, adults, tripType 
    });

    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: originCode,
      arrival_id: destinationCode,
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

    if (data.error) {
      console.error('❌ SerpApi returned an error:', data.error);
      return { data: [] };
    }

    console.log(`✅ Found ${data.best_flights?.length || 0} best flights`);

    const flightData = data.best_flights || data.other_flights || [];
    
    const flights = flightData.map((flight, index) => {
      const firstFlight = flight.flights?.[0] || {};
      const airlineName = firstFlight.airline || 'Unknown Airline';
      
      const airlineWebsite = AIRLINE_WEBSITES[airlineName];
      const bookingLink = airlineWebsite || flight.booking_options?.[0]?.book_with_url || `https://www.google.com/flights#flt=${originCode}.${destinationCode}.${date};c:${data.search_parameters?.currency || 'USD'};e:1`;
      
      return {
        airline: airlineName,
        flightNumber: firstFlight.flight_number || `Flight ${index + 1}`,
        price: `${data.search_parameters?.currency || 'USD'} ${flight.price}`,
        departure: firstFlight.departure_airport?.name || origin,
        arrival: firstFlight.arrival_airport?.name || destination,
        departureTime: formatFlightTime(firstFlight.departure_airport?.time, date) || firstFlight.departure_airport?.time || 'TBD',
        arrivalTime: formatFlightTime(firstFlight.arrival_airport?.time, date) || firstFlight.arrival_airport?.time || 'TBD',
        duration: flight.total_duration || 'Unknown',
        stops: Math.max(0, (flight.flights?.length || 1) - 1),
        bookingLink: bookingLink,
        airlineWebsite: airlineWebsite,
        carbonEmissions: flight.carbon_emissions?.this_flight ? `${flight.carbon_emissions.this_flight}kg` : undefined,
        layovers: flight.layovers
      };
    });

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

    if (data.error) {
      console.error('❌ SerpApi returned an error:', data.error);
      return { data: [] };
    }

    console.log(`✅ Found ${data.properties?.length || 0} hotels`);

    // Get images for hotels in parallel with better error handling
    const hotelsWithImages = await Promise.all(
      (data.properties || []).slice(0, 6).map(async (hotel) => {
        let images = [];
        try {
          images = await getHotelImages(hotel.name, location);
        } catch (error) {
          console.warn(`Failed to get images for ${hotel.name}:`, error.message);
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
      return { data: [] };
    }

    const params = new URLSearchParams({
      engine: 'google_local',
      q: `${query} in ${location}`,
      hl: 'en',
      api_key: SERPAPI_KEY
    });

    const url = `${BASE_URL}?${params}`;
    console.log('   Request URL:', url.replace(SERPAPI_KEY, 'HIDDEN'));

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('❌ SerpApi returned an error:', data.error);
      return { data: [] };
    }

    console.log(`✅ Found ${data.local_results?.length || 0} POIs`);

    const pois = (data.local_results || []).slice(0, limit).map(poi => ({
      name: poi.title,
      rating: poi.rating,
      reviews: poi.reviews,
      address: poi.address,
      hours: poi.hours,
      phone: poi.phone,
      website: poi.website,
      coordinates: poi.gps_coordinates,
      mapUrl: poi.gps_coordinates ? 
        `https://maps.google.com/maps?q=${poi.gps_coordinates.latitude},${poi.gps_coordinates.longitude}` :
        `https://maps.google.com/maps?q=${encodeURIComponent(poi.title + ' ' + location)}`,
      description: poi.description,
      type: poi.type
    }));

    console.log(`   Formatted ${pois.length} POIs for response`);
    return { data: pois };

  } catch (error) {
    console.error('❌ SerpApi POI error:', error.message);
    return { data: [] };
  }
}

// 🌤️ WEATHER with enhanced coordinates auto-detection
export async function getWeather({ location }) {
  try {
    console.log('🌤️ Getting weather forecast...');
    console.log(`   Getting coordinates for: ${location}`);
    
    const coordinates = await getCityCoordinates(location);
    
    console.log('   Coordinates:', coordinates);
    
    if (!coordinates.lat || !coordinates.lon || (coordinates.lat === 0 && coordinates.lon === 0)) {
      console.error('❌ Could not determine coordinates for weather');
      return { data: [] };
    }

    // Using Open-Meteo (free weather API)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto&forecast_days=7`;
    
    console.log('   Weather URL:', weatherUrl);
    
    const res = await fetch(weatherUrl);
    const data = await res.json();
    
    if (data.error) {
      console.error('❌ Weather API error:', data.error);
      return { data: [] };
    }
    
    const forecast = data.daily.time.map((date, index) => ({
      date,
      maxTemp: Math.round(data.daily.temperature_2m_max[index]),
      minTemp: Math.round(data.daily.temperature_2m_min[index]),
      precipitation: data.daily.precipitation_sum[index],
      weatherCode: data.daily.weather_code[index],
      condition: getWeatherCondition(data.daily.weather_code[index])
    }));
    
    // Add current weather if available
    if (data.current) {
      forecast.current = {
        temp: Math.round(data.current.temperature_2m),
        condition: getWeatherCondition(data.current.weather_code),
        humidity: Math.round(data.current.relative_humidity_2m),
        windSpeed: Math.round(data.current.wind_speed_10m)
      };
    }
    
    console.log(`✅ Got 7-day weather forecast for ${location}`);
    return { data: forecast };
    
  } catch (error) {
    console.error('❌ Weather error:', error.message);
    return { data: [] };
  }
}

// Weather code to condition mapping
function getWeatherCondition(code) {
  const conditions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with heavy hail'
  };
  
  return conditions[code] || 'Unknown';
}