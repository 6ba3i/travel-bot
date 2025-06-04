import React from 'react';
import FlightCard from './FlightCard';

// RegEx patterns to extract flight data from formatted markdown strings
const FLIGHT_REGEX = {
  PRICE: /\*\*\$(\d+)\*\*/,
  AIRLINE: /\*\*\$\d+\*\* - ([^|\n]+)/,
  OUTBOUND: /• Outbound: ([^(]+)/,
  RETURN: /• Return: ([^(]+)/,
  DURATION: /\(([^,]+), /,
  STOPS: /(Nonstop|\d+ stop(?:s)?)\)/,
  LINK: /\[Book flight\]\(([^)]+)\)/
};

interface FlightResultsProps {
  introText: string;
  content: string;
}

// Define the Flight interface to match the FlightCard component
interface Flight {
  price: number;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  bookingLink: string;
  returnInfo?: {
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
  };
}

export default function FlightResults({ introText, content }: FlightResultsProps) {
  // Parse flight information from the content
  const parseFlights = (content: string): Flight[] => {
    const flights: Flight[] = [];
    const flightBlocks = content.split(/\d+\.\s+\*\*\$/);
    
    // Skip the intro part (first element)
    for (let i = 1; i < flightBlocks.length; i++) {
      const block = '$' + flightBlocks[i]; // Add back the $ that was removed in the split
      
      try {
        // Extract basic flight details
        const priceMatch = block.match(FLIGHT_REGEX.PRICE);
        const airlineMatch = block.match(FLIGHT_REGEX.AIRLINE);
        const outboundMatch = block.match(FLIGHT_REGEX.OUTBOUND);
        const linkMatch = block.match(FLIGHT_REGEX.LINK);
        
        if (!priceMatch || !airlineMatch || !outboundMatch || !linkMatch) {
          console.error('Missing required flight details', { block });
          continue;
        }
        
        // Extract outbound details
        const outboundStr = outboundMatch[1];
        const [depTime, arrTime] = outboundStr.split(' → ');
        
        const durationMatch = block.match(FLIGHT_REGEX.DURATION);
        const stopsMatch = block.match(FLIGHT_REGEX.STOPS);
        
        const flight: Flight = {
          price: parseInt(priceMatch[1]),
          airline: airlineMatch[1].trim(),
          departureTime: depTime.trim(),
          arrivalTime: arrTime.trim(),
          duration: durationMatch ? durationMatch[1].trim() : 'N/A',
          stops: stopsMatch ? (stopsMatch[1] === 'Nonstop' ? 0 : parseInt(stopsMatch[1])) : 0,
          bookingLink: linkMatch[1]
        };
        
        // Check for return flight details
        const returnMatch = block.match(FLIGHT_REGEX.RETURN);
        if (returnMatch) {
          const returnStr = returnMatch[1];
          const [returnDepTime, returnArrTime] = returnStr.split(' → ');
          
          // For return flight, we need to find the second duration and stops pattern
          const allDurations = [...block.matchAll(/\(([^,]+), /g)];
          const allStops = [...block.matchAll(/(Nonstop|\d+ stop(?:s)?)\)/g)];
          
          if (allDurations.length > 1 && allStops.length > 1) {
            flight.returnInfo = {
              departureTime: returnDepTime.trim(),
              arrivalTime: returnArrTime.trim(),
              duration: allDurations[1][1].trim(),
              stops: allStops[1][1] === 'Nonstop' ? 0 : parseInt(allStops[1][1])
            };
          }
        }
        
        flights.push(flight);
      } catch (error) {
        console.error('Error parsing flight block', error, { block });
      }
    }
    
    return flights;
  };
  
  const flights = parseFlights(content);
  
  // Extract any text after the flight information (e.g., closing message)
  const closingText = content.split(/\n\n(?!•)/);
  const closing = closingText.length > 1 ? closingText[closingText.length - 1] : '';

  return (
    <div className="flight-results max-w-2xl mx-auto my-4">
      <div className="text-lg font-medium mb-4">{introText}</div>
      
      {flights.map((flight, index) => (
        <FlightCard 
          key={index}
          price={flight.price}
          airline={flight.airline}
          departureTime={flight.departureTime}
          arrivalTime={flight.arrivalTime}
          duration={flight.duration}
          stops={flight.stops}
          bookingLink={flight.bookingLink}
          returnInfo={flight.returnInfo}
        />
      ))}
      
      {closing && (
        <div className="text-sm text-gray-600 mt-2">{closing}</div>
      )}
    </div>
  );
}