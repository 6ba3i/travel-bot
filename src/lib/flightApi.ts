// src/lib/flightApi.ts
export interface Flight {
  price: number
  airline: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  bookingLink: string
  returnRoute?: {
    departureTime: string
    arrivalTime: string
    duration: string
    stops: number
  }
}

export interface SearchFlightsParams {
  origin: string
  destination: string
  date: string
  returnDate?: string
  cabin?: string
  tripType?: 'one_way' | 'round_trip'
}

/**
 * Hits SerpAPI, picks out `best_flights` (or `other_flights`),
 * sorts by numeric price, and returns only the cheapest options.
 */
export async function searchFlights({
  origin,
  destination,
  date,
  returnDate,
  cabin = 'economy',
  tripType = 'one_way',
}: SearchFlightsParams): Promise<{ data: Flight[] }> {
  const params = new URLSearchParams({
    engine:        'google_flights',
    origin,
    destination,
    flight_date:   date,
    return_date:   returnDate || '',
    cabin,
    trip_type:     tripType,
    api_key:       process.env.SERPAPI_KEY || '',
  })
  const res  = await fetch(`https://serpapi.com/search.json?${params}`)
  const json = await res.json()

  // extract best_flights or fallback to other_flights
  let flights = json.best_flights?.length
    ? json.best_flights
    : json.other_flights || []
  if (!flights.length) return { data: [] }

  // sort cheapest first
  flights.sort((a: any, b: any) => {
    const pa = Number(a.price?.total_amount ?? a.price ?? 0)
    const pb = Number(b.price?.total_amount ?? b.price ?? 0)
    return pa - pb
  })

  const transformed: Flight[] = flights.map((f: any) => {
    const outbound = f.flights?.[0] || {}
    const ret     = tripType === 'round_trip' ? f.return_flights?.[0] : null
    return {
      price:        Number(f.price?.total_amount ?? f.price ?? 0),
      airline:      outbound.airline || 'Unknown',
      departureTime: outbound.departure_time || 'N/A',
      arrivalTime:   outbound.arrival_time || 'N/A',
      duration:      outbound.duration || 'N/A',
      stops:         (f.flights?.length ?? 1) - 1,
      bookingLink:   json.search_metadata?.google_flights_url,
      returnRoute: ret
        ? {
            departureTime: ret.departure_time || 'N/A',
            arrivalTime:   ret.arrival_time || 'N/A',
            duration:      ret.duration || 'N/A',
            stops:         (f.return_flights?.length ?? 1) - 1,
          }
        : undefined,
    }
  })

  return { data: transformed }
}
