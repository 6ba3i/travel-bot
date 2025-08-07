// src/lib/amadeus.ts
import fetch from 'node-fetch';

let token = '';
let expires = 0;

// Get & cache Amadeus OAuth token
async function getToken(): Promise<string> {
  if (token && Date.now() < expires) return token;

  console.log('🔑 Getting new Amadeus token...');
  
  const res = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY || '',
      client_secret: '' // Self-service APIs don't need client_secret
    })
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('❌ Amadeus token error:', error);
    throw new Error(`Amadeus auth failed: ${error}`);
  }

  const json = await res.json() as { access_token: string; expires_in: number };
  token = json.access_token;
  expires = Date.now() + json.expires_in * 1000 - 60_000; // renew 1 min early
  
  console.log('✅ Amadeus token obtained');
  return token;
}

// Flight search interface
export interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  returnDate?: string;
  cabin?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  tripType?: 'one_way' | 'round_trip';
  adults?: number;
}

export interface Flight {
  price: {
    total_amount: string;
    currency: string;
  };
  routes: Array<{
    airline: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
  }>;
  returnRoute?: {
    airline: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
  };
  booking_link: string;
}

export async function searchFlights({
  origin,
  destination,
  date,
  returnDate,
  cabin = 'ECONOMY',
  adults = 1
}: FlightSearchParams): Promise<{ data: Flight[] }> {
  try {
    const bearer = await getToken();
    
    // Build query parameters
    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: adults.toString(),
      travelClass: cabin,
      max: '10' // Limit results
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
          'Content-Type': 'application/json'
        }
      }
    );

    if (!res.ok) {
      const error = await res.text();
      console.error('❌ Amadeus flight search error:', error);
      throw new Error(`Flight search failed: ${error}`);
    }

    const data = await res.json() as { data: any[] };
    console.log(`✅ Found ${data.data?.length || 0} flight offers`);

    // Transform Amadeus response to our format
    const flights: Flight[] = data.data?.map(offer => {
      const outbound = offer.itineraries[0];
      const segments = outbound.segments;
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];

      // Calculate stops (segments - 1)
      const stops = segments.length - 1;

      const flight: Flight = {
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
        booking_link: `https://www.amadeus.com/booking` // Placeholder - Amadeus doesn't provide direct booking links
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

// Hotel search interface
export interface HotelSearchParams {
  cityCode: string; // IATA city code like "PAR" for Paris
  checkIn: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD
  nights?: number;
  adults?: number;
  rooms?: number;
}

export interface Hotel {
  hotel: {
    name: string;
    cityCode: string;
  };
  offers: Array<{
    price: {
      total: string;
      currency: string;
    };
    url?: string;
    bookingLink?: string;
  }>;
}

export async function searchHotels({
  cityCode,
  checkIn,
  checkOut,
  nights = 1,
  adults = 1,
  rooms = 1
}: HotelSearchParams): Promise<{ data: Hotel[] }> {
  try {
    const bearer = await getToken();
    
    // Calculate checkout date if not provided
    const checkOutDate = checkOut || (() => {
      const date = new Date(checkIn);
      date.setDate(date.getDate() + nights);
      return date.toISOString().slice(0, 10);
    })();

    console.log('🏨 Searching hotels in:', cityCode, 'from', checkIn, 'to', checkOutDate);

    const res = await fetch(
      `https://api.amadeus.com/v3/shopping/hotel-offers?cityCode=${cityCode}&checkInDate=${checkIn}&checkOutDate=${checkOutDate}&adults=${adults}&roomQuantity=${rooms}&bestRateOnly=true`,
      {
        headers: { 
          'Authorization': `Bearer ${bearer}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!res.ok) {
      const error = await res.text();
      console.error('❌ Amadeus hotel search error:', error);
      throw new Error(`Hotel search failed: ${error}`);
    }

    const data = await res.json() as { data: any[] };
    console.log(`✅ Found ${data.data?.length || 0} hotel offers`);

    // Transform Amadeus response to our format
    const hotels: Hotel[] = data.data?.map(hotelData => ({
      hotel: {
        name: hotelData.hotel.name,
        cityCode: hotelData.hotel.cityCode
      },
      offers: hotelData.offers.map((offer: any) => ({
        price: {
          total: offer.price.total,
          currency: offer.price.currency
        },
        url: `https://www.amadeus.com/hotels`, // Placeholder
        bookingLink: `https://www.amadeus.com/hotels` // Placeholder
      }))
    })) || [];

    return { data: hotels };

  } catch (error) {
    console.error('❌ Hotel search error:', error);
    return { data: [] };
  }
}