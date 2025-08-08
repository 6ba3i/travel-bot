// src/lib/amadeus.js - Amadeus Production API
import fetch from 'node-fetch';

// Token management
let token = '';
let expires = 0;

async function getToken() {
  // Return cached token if still valid
  if (token && Date.now() < expires) {
    console.log('♻️ Using cached Amadeus token');
    return token;
  }

  console.log('🔑 Getting new Amadeus token...');
  
  // Check for required environment variables
  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    throw new Error('Missing AMADEUS_API_KEY or AMADEUS_API_SECRET in environment variables');
  }
  
  try {
    // Create form data for OAuth2 client credentials flow
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', process.env.AMADEUS_API_KEY.trim());
    formData.append('client_secret', process.env.AMADEUS_API_SECRET.trim());
    
    console.log('📤 Requesting token from Amadeus Production API');
    
    const res = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString()
    });

    const responseText = await res.text();
    
    if (!res.ok) {
      console.error('❌ Amadeus token error:');
      console.error('   Status:', res.status);
      console.error('   Response:', responseText);
      
      // Parse error if it's JSON
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error_description) {
          throw new Error(`Amadeus auth failed: ${errorData.error_description}`);
        }
      } catch (e) {
        // If not JSON, use raw text
      }
      
      throw new Error(`Amadeus auth failed: ${responseText}`);
    }

    const json = JSON.parse(responseText);
    
    if (!json.access_token) {
      throw new Error('No access token in Amadeus response');
    }
    
    token = json.access_token;
    expires = Date.now() + (json.expires_in * 1000) - 60000; // Refresh 1 minute before expiry
    
    console.log('✅ Amadeus token obtained successfully');
    console.log(`   Token expires in ${json.expires_in} seconds`);
    
    return token;
    
  } catch (error) {
    console.error('❌ Failed to get Amadeus token:', error.message);
    throw error;
  }
}

export async function searchFlights({
  origin,
  destination,
  date,
  returnDate,
  cabin = 'ECONOMY',
  adults = 1
}) {
  try {
    const bearer = await getToken();
    
    // Build query parameters
    const params = new URLSearchParams({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: date,
      adults: adults.toString(),
      travelClass: cabin,
      currencyCode: 'USD',
      max: '10'
    });

    if (returnDate) {
      params.append('returnDate', returnDate);
    }

    console.log('🛫 Searching flights with params:', Object.fromEntries(params));

    const res = await fetch(
      `https://api.amadeus.com/v2/shopping/flight-offers?${params}`,
      {
        headers: { 
          'Authorization': `Bearer ${bearer}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!res.ok) {
      const error = await res.text();
      console.error('❌ Amadeus flight search error:', error);
      console.error('   Status:', res.status);
      
      // Check if token expired
      if (res.status === 401) {
        console.log('🔄 Token might be expired, clearing cache...');
        token = '';
        expires = 0;
      }
      
      throw new Error(`Flight search failed: ${error}`);
    }

    const data = await res.json();
    console.log(`✅ Found ${data.data?.length || 0} flight offers`);

    // Transform Amadeus response to our format
    const flights = data.data?.map(offer => {
      const outbound = offer.itineraries[0];
      const segments = outbound.segments;
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      const stops = segments.length - 1;

      const flight = {
        price: {
          total_amount: offer.price.total,
          currency: offer.price.currency
        },
        routes: [{
          airline: firstSegment.carrierCode,
          departureTime: firstSegment.departure.at,
          arrivalTime: lastSegment.arrival.at,
          duration: outbound.duration,
          stops
        }],
        booking_link: `https://www.amadeus.com/booking`
      };

      // Add return flight if it exists
      if (offer.itineraries.length > 1) {
        const returnFlight = offer.itineraries[1];
        const returnSegments = returnFlight.segments;
        const firstReturn = returnSegments[0];
        const lastReturn = returnSegments[returnSegments.length - 1];

        flight.returnRoute = {
          airline: firstReturn.carrierCode,
          departureTime: firstReturn.departure.at,
          arrivalTime: lastReturn.arrival.at,
          duration: returnFlight.duration,
          stops: returnSegments.length - 1
        };
      }

      return flight;
    }) || [];

    return { data: flights };

  } catch (error) {
    console.error('❌ Flight search error:', error);
    return { data: [] };
  }
}

export async function searchHotels({
  cityCode,
  checkIn,
  checkOut,
  nights = 1,
  adults = 1,
  rooms = 1
}) {
  try {
    const bearer = await getToken();
    
    // Calculate checkout date if not provided
    const checkOutDate = checkOut || (() => {
      const date = new Date(checkIn);
      date.setDate(date.getDate() + nights);
      return date.toISOString().slice(0, 10);
    })();

    console.log('🏨 Searching hotels in:', cityCode, 'from', checkIn, 'to', checkOutDate);

    // Build query parameters
    const params = new URLSearchParams({
      cityCode: cityCode.toUpperCase(),
      checkInDate: checkIn,
      checkOutDate: checkOutDate,
      adults: adults.toString(),
      roomQuantity: rooms.toString(),
      currency: 'USD',
      bestRateOnly: 'true',
      view: 'FULL',
      sort: 'PRICE'
    });

    const res = await fetch(
      `https://api.amadeus.com/v3/shopping/hotel-offers?${params}`,
      {
        headers: { 
          'Authorization': `Bearer ${bearer}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!res.ok) {
      const error = await res.text();
      console.error('❌ Amadeus hotel search error:', error);
      console.error('   Status:', res.status);
      
      // Check if token expired
      if (res.status === 401) {
        console.log('🔄 Token might be expired, clearing cache...');
        token = '';
        expires = 0;
      }
      
      throw new Error(`Hotel search failed: ${error}`);
    }

    const data = await res.json();
    console.log(`✅ Found ${data.data?.length || 0} hotel offers`);

    // Transform Amadeus response to our format
    const hotels = data.data?.map(hotelData => ({
      hotel: {
        name: hotelData.hotel.name,
        cityCode: hotelData.hotel.cityCode,
        hotelId: hotelData.hotel.hotelId
      },
      offers: hotelData.offers?.map(offer => ({
        price: {
          total: offer.price.total,
          currency: offer.price.currency
        },
        checkInDate: offer.checkInDate,
        checkOutDate: offer.checkOutDate,
        room: offer.room?.typeEstimated?.category || 'Standard',
        url: `https://www.amadeus.com/hotels`,
        bookingLink: `https://www.amadeus.com/hotels`
      })) || []
    })) || [];

    return { data: hotels };

  } catch (error) {
    console.error('❌ Hotel search error:', error);
    return { data: [] };
  }
}

// Debug function to test authentication
export async function testAuth() {
  try {
    console.log('🧪 Testing Amadeus authentication...');
    const authToken = await getToken();
    console.log('✅ Authentication successful!');
    console.log(`   Token (first 20 chars): ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
}