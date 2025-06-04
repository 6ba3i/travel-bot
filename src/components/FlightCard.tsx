interface FlightProps {
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
  
  export default function FlightCard({ 
    price, 
    airline, 
    departureTime, 
    arrivalTime, 
    duration, 
    stops, 
    bookingLink,
    returnInfo
  }: FlightProps) {
    const stopsText = stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`;
    
    const handleClick = () => {
      window.open(bookingLink, '_blank');
    };
  
    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="font-medium text-lg">{airline}</div>
          <div className="text-xl font-bold text-blue-600">${price}</div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <div className="font-medium">{departureTime}</div>
            <div className="text-gray-500">→</div>
            <div className="font-medium">{arrivalTime}</div>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <div>{duration}</div>
            <div>{stopsText}</div>
          </div>
        </div>
        
        {returnInfo && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Return</div>
            <div className="flex justify-between mb-1">
              <div className="font-medium">{returnInfo.departureTime}</div>
              <div className="text-gray-500">→</div>
              <div className="font-medium">{returnInfo.arrivalTime}</div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <div>{returnInfo.duration}</div>
              <div>{returnInfo.stops === 0 ? 'Nonstop' : `${returnInfo.stops} stop${returnInfo.stops > 1 ? 's' : ''}`}</div>
            </div>
          </div>
        )}
        
        <div className="mt-3 text-center">
          <button className="text-sm text-blue-600 hover:underline">Book this flight</button>
        </div>
      </div>
    );
  }