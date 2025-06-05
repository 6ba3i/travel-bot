import React from 'react';

export type FlightResult = {
  kind: 'flight';
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
};

export type PoiResult = {
  kind: 'poi';
  name: string;
  category?: string;
  link: string;
};

export type Result = FlightResult | PoiResult;

interface Props {
  result: Result;
}

export default function ResultCard({ result }: Props) {
  if (result.kind === 'flight') {
    const { price, airline, departureTime, arrivalTime, duration, stops, bookingLink, returnInfo } = result;
    const stopsText = stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`;

    const handleClick = () => {
      window.open(bookingLink, '_blank');
    };

    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer animate-expand"
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
          <button className="text-sm text-blue-600 hover:underline" onClick={handleClick}>
            Book now
          </button>
        </div>
      </div>
    );
  }

  // POI
  const { name, category, link } = result;

  const handleClick = () => {
    window.open(link, '_blank');
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer animate-expand"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-lg">{name}</div>
          {category && <div className="text-sm text-gray-500">{category}</div>}
        </div>
        <button className="text-sm text-blue-600 hover:underline" onClick={handleClick}>
          Directions
        </button>
      </div>
    </div>
  );
}
