// src/components/TravelChatUI.tsx - Enhanced with POI and Restaurant support
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Plane, Hotel, MapPin, CloudSun, Globe, Clock, Users, Star,
  MapPinned, Coffee, UtensilsCrossed, Camera, Navigation, Phone,
  ChevronDown, ChevronRight, MessageSquare, Plus, Trash2, Search,
  Sun, Cloud, CloudRain, CloudSnow, Wind, Sparkles, X, Calendar,
  DollarSign, Info, ExternalLink, Menu, Utensils
} from 'lucide-react';
import { useChatStore } from '../store/useChat';
import { TRANSLATIONS } from '../lib/translations';
import './TravelChatUI.css';

// Type definitions
interface FlightData {
  airline: string;
  flightNumber?: string;
  price: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  bookingLink?: string;
  carbonEmissions?: string;
}

interface HotelData {
  name: string;
  rating: number | string;
  reviews: number | string;
  price: string;
  location: string;
  link?: string;
  amenities?: string[];
  image?: string;
  mapUrl?: string;
  address?: string;
}

interface POIData {
  name: string;
  rating: number;
  reviews: number;
  type: string;
  price: string;
  address: string;
  hours: string;
  image?: string;
  mapUrl?: string;
  description: string;
  website?: string;
  phone?: string;
}

interface RestaurantData {
  name: string;
  rating: number;
  reviews: number;
  cuisine: string;
  priceLevel: string;
  address: string;
  hours: string;
  image?: string;
  mapUrl?: string;
  phone?: string;
  website?: string;
  dineIn?: boolean;
  takeout?: boolean;
  delivery?: boolean;
}

interface WeatherData {
  location: string;
  current: {
    temp: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    day: string;
    date: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
    precipitation: number;
  }>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

interface Widget {
  type: string;
  data: FlightData | HotelData | POIData | RestaurantData | WeatherData;
}

type LanguageCode = keyof typeof TRANSLATIONS;

// Airline websites mapping
const AIRLINE_WEBSITES: Record<string, string> = {
  'Royal Air Maroc': 'https://www.royalairmaroc.com',
  'Air France': 'https://www.airfrance.com',
  'Emirates': 'https://www.emirates.com',
  'Turkish Airlines': 'https://www.turkishairlines.com',
  'Qatar Airways': 'https://www.qatarairways.com',
  'Lufthansa': 'https://www.lufthansa.com',
  'British Airways': 'https://www.britishairways.com',
  'KLM': 'https://www.klm.com',
  'Delta': 'https://www.delta.com',
  'United': 'https://www.united.com'
};

// Weather icon mapping
const getWeatherIcon = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'sunny': Sun,
    'mostly-sunny': Sun,
    'partly-cloudy': Cloud,
    'cloudy': Cloud,
    'rain': CloudRain,
    'heavy-rain': CloudRain,
    'drizzle': CloudRain,
    'snow': CloudSnow,
    'heavy-snow': CloudSnow,
    'thunderstorm': CloudRain,
    'fog': Cloud,
    'wind': Wind
  };
  return iconMap[iconName] || Sun;
};

// Flight Widget Component
const FlightWidget: React.FC<{ flight: FlightData; index: number; language: LanguageCode }> = ({ flight, index, language }) => {
  const [isHovered, setIsHovered] = useState(false);
  const t = TRANSLATIONS[language];
  
  const formatTime = (time: string) => {
    if (!time || time === 'N/A') return 'N/A';
    return time;
  };
  
  const formatStops = (stops: number) => {
    if (stops === 0) return t.direct || 'Direct';
    if (stops === 1) return '1 stop';
    return `${stops} stops`;
  };
  
  const getAirlineLink = () => {
    for (const [airline, url] of Object.entries(AIRLINE_WEBSITES)) {
      if (flight.airline?.includes(airline)) return url;
    }
    return flight.bookingLink || '#';
  };
  
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-500 transform
        ${isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100 translate-y-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.open(getAirlineLink(), '_blank')}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl 
        ${isHovered ? 'opacity-40' : 'opacity-0'} transition-opacity duration-500`} />
      
      <div className={`relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl 
        rounded-2xl border ${isHovered ? 'border-blue-500/50' : 'border-gray-700/50'} 
        p-6 transition-all duration-300 shadow-2xl`}>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 
              flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">{flight.airline}</div>
              {flight.flightNumber && (
                <div className="text-xs text-gray-400">{flight.flightNumber}</div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 
              bg-clip-text text-transparent">
              {flight.price}
            </div>
            {flight.carbonEmissions && (
              <div className="text-xs text-gray-500">CO₂: {flight.carbonEmissions}</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="text-sm text-gray-500">{t.departure}</div>
            <div className="text-lg font-semibold text-white">{flight.departure}</div>
            <div className="text-sm text-gray-400">{formatTime(flight.departureTime)}</div>
          </div>
          
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-gray-600"></div>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 
                flex items-center justify-center transition-transform duration-300 
                ${isHovered ? 'scale-110' : 'scale-100'}`}>
                <Plane className={`w-3 h-3 text-white transition-transform duration-300 
                  ${isHovered ? 'scale-110' : 'scale-100'}`} />
              </div>
              <div className="w-8 h-px bg-gray-600"></div>
            </div>
          </div>
          
          <div className="flex-1 text-right">
            <div className="text-sm text-gray-500">{t.arrival}</div>
            <div className="text-lg font-semibold text-white">{flight.arrival}</div>
            <div className="text-sm text-gray-400">{formatTime(flight.arrivalTime)}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400">{flight.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400">{formatStops(flight.stops)}</span>
            </div>
          </div>
          
          <button className={`px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 
            text-white font-medium text-sm transition-all duration-300 transform
            ${isHovered ? 'opacity-100 scale-105' : 'opacity-90 scale-100'}`}>
            {t.bookNow} →
          </button>
        </div>
      </div>
    </div>
  );
};

// Hotel Widget Component
const HotelWidget: React.FC<{ hotel: HotelData; index: number; language: LanguageCode }> = ({ hotel, index, language }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const t = TRANSLATIONS[language];
  
  const rating = typeof hotel.rating === 'string' 
    ? parseFloat(hotel.rating.replace('⭐', '').trim()) 
    : Number(hotel.rating) || 4.5;
  
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-500 transform
        ${isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100 translate-y-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.open(hotel.link, '_blank')}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl 
        ${isHovered ? 'opacity-40' : 'opacity-0'} transition-opacity duration-500`} />
      
      <div className={`relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl 
        rounded-2xl border ${isHovered ? 'border-purple-500/50' : 'border-gray-700/50'} 
        overflow-hidden transition-all duration-300 shadow-2xl`}>
        
        <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
          {hotel.image ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 
                  animate-pulse" />
              )}
              <img
                src={hotel.image}
                alt={hotel.name}
                className={`w-full h-full object-cover transition-all duration-700 
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  ${isHovered ? 'scale-110' : 'scale-100'}`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Hotel';
                  setImageLoaded(true);
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br 
              from-gray-700 to-gray-800">
              <Hotel className="w-16 h-16 text-gray-600" />
            </div>
          )}
          
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 
            backdrop-blur-md text-white font-bold">
            {hotel.price}
          </div>
          
          {hotel.mapUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(hotel.mapUrl, '_blank');
              }}
              className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 backdrop-blur-md 
                text-white hover:bg-black/70 transition-colors map-button"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{hotel.name}</h3>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 transition-colors ${
                    i < Math.floor(rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-400">
              {rating} ({hotel.reviews} {t.reviews})
            </span>
          </div>
          
          {hotel.address && (
            <div className="flex items-start gap-2 text-sm text-gray-400 mb-3">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{hotel.address}</span>
            </div>
          )}
          
          <button className={`w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 
            text-white font-medium text-sm transition-all duration-300 transform
            ${isHovered ? 'opacity-100 scale-105' : 'opacity-90 scale-100'}`}>
            {t.viewDetails} →
          </button>
        </div>
      </div>
    </div>
  );
};

// POI Widget Component
const POIWidget: React.FC<{ poi: POIData; index: number; language: LanguageCode }> = ({ poi, index, language }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const t = TRANSLATIONS[language];
  
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-500 transform
        ${isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100 translate-y-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.open(poi.mapUrl || poi.website, '_blank')}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-xl 
        ${isHovered ? 'opacity-40' : 'opacity-0'} transition-opacity duration-500`} />
      
      <div className={`relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl 
        rounded-2xl border ${isHovered ? 'border-green-500/50' : 'border-gray-700/50'} 
        overflow-hidden transition-all duration-300 shadow-2xl`}>
        
        <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
          {poi.image ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 
                  animate-pulse" />
              )}
              <img
                src={poi.image}
                alt={poi.name}
                className={`w-full h-full object-cover transition-all duration-700 
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  ${isHovered ? 'scale-110' : 'scale-100'}`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Attraction';
                  setImageLoaded(true);
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br 
              from-gray-700 to-gray-800">
              <Camera className="w-16 h-16 text-gray-600" />
            </div>
          )}
          
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 
            backdrop-blur-md text-white text-sm">
            {poi.type}
          </div>
          
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 
            backdrop-blur-md text-white font-bold">
            {poi.price}
          </div>
          
          {poi.mapUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(poi.mapUrl, '_blank');
              }}
              className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 backdrop-blur-md 
                text-white hover:bg-black/70 transition-colors map-button"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{poi.name}</h3>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 transition-colors ${
                    i < Math.floor(poi.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-400">
              {poi.rating} ({poi.reviews} reviews)
            </span>
          </div>
          
          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{poi.description}</p>
          
          {poi.hours && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Clock className="w-3 h-3" />
              <span>{poi.hours}</span>
            </div>
          )}
          
          {poi.address && (
            <div className="flex items-start gap-2 text-sm text-gray-400 mb-3">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{poi.address}</span>
            </div>
          )}
          
          <div className="flex gap-2">
            <button className={`flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 
              text-white font-medium text-sm transition-all duration-300 transform
              ${isHovered ? 'opacity-100 scale-105' : 'opacity-90 scale-100'}`}>
              View Details
            </button>
            {poi.website && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(poi.website, '_blank');
                }}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 
                  text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Restaurant Widget Component
const RestaurantWidget: React.FC<{ restaurant: RestaurantData; index: number; language: LanguageCode }> = ({ restaurant, index, language }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const t = TRANSLATIONS[language];
  
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-500 transform
        ${isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100 translate-y-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.open(restaurant.mapUrl || restaurant.website, '_blank')}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-xl 
        ${isHovered ? 'opacity-40' : 'opacity-0'} transition-opacity duration-500`} />
      
      <div className={`relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl 
        rounded-2xl border ${isHovered ? 'border-orange-500/50' : 'border-gray-700/50'} 
        overflow-hidden transition-all duration-300 shadow-2xl`}>
        
        <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
          {restaurant.image ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 
                  animate-pulse" />
              )}
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className={`w-full h-full object-cover transition-all duration-700 
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  ${isHovered ? 'scale-110' : 'scale-100'}`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Restaurant';
                  setImageLoaded(true);
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br 
              from-gray-700 to-gray-800">
              <Utensils className="w-16 h-16 text-gray-600" />
            </div>
          )}
          
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 
            backdrop-blur-md text-white text-sm">
            {restaurant.cuisine}
          </div>
          
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 
            backdrop-blur-md text-white font-bold">
            {restaurant.priceLevel}
          </div>
          
          {restaurant.mapUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(restaurant.mapUrl, '_blank');
              }}
              className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 backdrop-blur-md 
                text-white hover:bg-black/70 transition-colors map-button"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{restaurant.name}</h3>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 transition-colors ${
                    i < Math.floor(restaurant.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-400">
              {restaurant.rating} ({restaurant.reviews} reviews)
            </span>
          </div>
          
          <div className="flex gap-2 mb-2">
            {restaurant.dineIn && (
              <span className="px-2 py-1 text-xs rounded-full bg-gray-700/50 text-gray-300">
                Dine-in
              </span>
            )}
            {restaurant.takeout && (
              <span className="px-2 py-1 text-xs rounded-full bg-gray-700/50 text-gray-300">
                Takeout
              </span>
            )}
            {restaurant.delivery && (
              <span className="px-2 py-1 text-xs rounded-full bg-gray-700/50 text-gray-300">
                Delivery
              </span>
            )}
          </div>
          
          {restaurant.hours && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Clock className="w-3 h-3" />
              <span>{restaurant.hours}</span>
            </div>
          )}
          
          {restaurant.address && (
            <div className="flex items-start gap-2 text-sm text-gray-400 mb-3">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{restaurant.address}</span>
            </div>
          )}
          
          <div className="flex gap-2">
            <button className={`flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 
              text-white font-medium text-sm transition-all duration-300 transform
              ${isHovered ? 'opacity-100 scale-105' : 'opacity-90 scale-100'}`}>
              Reserve Table
            </button>
            {restaurant.phone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `tel:${restaurant.phone}`;
                }}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 
                  text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Weather Widget Component (unchanged)
const WeatherWidget: React.FC<{ weather: WeatherData; index: number; language: LanguageCode }> = ({ weather, index, language }) => {
  const [isHovered, setIsHovered] = useState(false);
  const t = TRANSLATIONS[language];
  
  return (
    <div
      className={`relative group transition-all duration-500 transform
        ${isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100 translate-y-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl blur-xl 
        ${isHovered ? 'opacity-40' : 'opacity-0'} transition-opacity duration-500`} />
      
      <div className={`relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl 
        rounded-2xl border ${isHovered ? 'border-blue-400/50' : 'border-gray-700/50'} 
        p-6 transition-all duration-300 shadow-2xl`}>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{weather.location}</h3>
            <p className="text-gray-400">{t.weatherForecast}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">{weather.current.temp}°</div>
            <div className="text-sm text-gray-400">{weather.current.condition}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {weather.forecast.map((day, idx) => {
            const Icon = getWeatherIcon(day.icon);
            return (
              <div
                key={idx}
                className="text-center p-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 
                  transition-all duration-200 cursor-pointer weather-day"
              >
                <div className="text-xs text-gray-400 mb-2">{day.day}</div>
                <Icon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <div className="text-sm font-semibold text-white">{day.high}°</div>
                <div className="text-xs text-gray-500">{day.low}°</div>
                {day.precipitation > 0 && (
                  <div className="text-xs text-blue-400 mt-1">{day.precipitation}%</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar: React.FC<{
  language: LanguageCode;
  onClose: () => void;
  conversations: any[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
}> = ({ language, onClose, conversations, activeId, onSelectConversation, onDeleteConversation, onNewConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = TRANSLATIONS[language];
  
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 flex flex-col">
      <div className="p-4 border-b border-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{t.conversations}</h2>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-gray-800/50 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <button
          onClick={onNewConversation}
          className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 
            text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.newChat}
        </button>
        
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg
              text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? t.noResults : t.noConversations}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations
              .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
              .map(conv => (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`group p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200
                    ${activeId === conv.id
                      ? 'bg-indigo-600/20 border border-indigo-600/50'
                      : 'hover:bg-gray-800/50 border border-transparent'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {conv.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conv.updatedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 
                        hover:text-red-400 transition-all duration-200"
                      title={t.deleteChat}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const TravelChatUI: React.FC = () => {
  const { conversations, activeId, loading, send, newConversation, selectConversation, deleteConversation } = useChatStore();
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  const activeConversation = conversations.find(c => c.id === activeId);
  const messages = activeConversation?.messages || [];
  const isLoading = loading;

  const getSamplePrompts = () => [
    { icon: Plane, text: t.flightSearchPrompt, color: 'from-blue-500 to-indigo-600' },
    { icon: Hotel, text: t.hotelSearchPrompt, color: 'from-purple-500 to-pink-600' },
    { icon: Camera, text: 'Show me tourist attractions in Paris', color: 'from-green-500 to-emerald-600' },
    { icon: Utensils, text: 'Find Italian restaurants in Barcelona', color: 'from-orange-500 to-red-600' },
    { icon: CloudSun, text: t.weatherPrompt, color: 'from-cyan-500 to-blue-600' },
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (conversations.length === 0) {
      newConversation(language);
    }
  }, [conversations.length, newConversation, language]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    await send(userMessage, language);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const parseMessage = (content: string): { textContent: string; widgets: Widget[] } => {
    const widgets: Widget[] = [];
    let textContent = content;

    const widgetPatterns = [
      { type: 'flight', pattern: /\[FLIGHT_WIDGET\](.*?)\[\/FLIGHT_WIDGET\]/gs },
      { type: 'hotel', pattern: /\[HOTEL_WIDGET\](.*?)\[\/HOTEL_WIDGET\]/gs },
      { type: 'poi', pattern: /\[POI_WIDGET\](.*?)\[\/POI_WIDGET\]/gs },
      { type: 'restaurant', pattern: /\[RESTAURANT_WIDGET\](.*?)\[\/RESTAURANT_WIDGET\]/gs },
      { type: 'weather', pattern: /\[WEATHER_WIDGET\](.*?)\[\/WEATHER_WIDGET\]/gs }
    ];

    widgetPatterns.forEach(({ type, pattern }) => {
      const matches = [...textContent.matchAll(pattern)];
      matches.forEach(match => {
        try {
          const data = JSON.parse(match[1]);
          widgets.push({ type, data });
          textContent = textContent.replace(match[0], '');
        } catch (error) {
          console.error(`Error parsing ${type} widget:`, error);
        }
      });
    });

    return { textContent: textContent.trim(), widgets };
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900">
      {sidebarOpen && (
        <Sidebar
          language={language}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          activeId={activeId}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onNewConversation={() => newConversation(language)}
        />
      )}

      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-800/50 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">TravelBot</h1>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 
                  text-white transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{TRANSLATIONS[language].languageName}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-800/95 backdrop-blur-xl 
                  border border-gray-700/50 shadow-2xl overflow-hidden z-50">
                  {(Object.keys(TRANSLATIONS) as LanguageCode[]).map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLanguageDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-700/50 transition-colors
                        ${language === lang ? 'bg-indigo-600/20 text-indigo-400' : 'text-white'}`}
                    >
                      {TRANSLATIONS[lang].languageName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 
                flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{t.welcome}</h2>
              <p className="text-gray-400 text-center mb-8 max-w-md">{t.subtitle}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
                {getSamplePrompts().map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(prompt.text)}
                    className="group p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 
                      border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300
                      text-left flex items-start gap-3"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${prompt.color} 
                      flex items-center justify-center flex-shrink-0 
                      group-hover:scale-110 transition-transform duration-300`}>
                      <prompt.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {prompt.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
              {messages.map((message, idx) => {
                const { textContent, widgets } = parseMessage(message.content);
                
                return (
                  <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-4xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                      {textContent && (
                        <div className={`inline-block p-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            : 'bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 text-white'
                        }`}>
                          <div className="prose prose-invert max-w-none">
                            {textContent.split('\n').map((line, i) => (
                              <p key={i} className="mb-2 last:mb-0">{line}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {widgets.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {/* Hotels in 3-column grid */}
                          {(widgets.filter(w => w.type === 'hotel').length > 0) && (
                            <div className="hotel-grid">
                              {widgets.filter(w => w.type === 'hotel').map((widget, widgetIdx) => (
                                <HotelWidget 
                                  key={widgetIdx} 
                                  hotel={widget.data as HotelData} 
                                  index={widgetIdx} 
                                  language={language} 
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* POIs in 3-column grid */}
                          {(widgets.filter(w => w.type === 'poi').length > 0) && (
                            <div className="hotel-grid">
                              {widgets.filter(w => w.type === 'poi').map((widget, widgetIdx) => (
                                <POIWidget 
                                  key={widgetIdx} 
                                  poi={widget.data as POIData} 
                                  index={widgetIdx} 
                                  language={language} 
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* Restaurants in 3-column grid */}
                          {(widgets.filter(w => w.type === 'restaurant').length > 0) && (
                            <div className="hotel-grid">
                              {widgets.filter(w => w.type === 'restaurant').map((widget, widgetIdx) => (
                                <RestaurantWidget 
                                  key={widgetIdx} 
                                  restaurant={widget.data as RestaurantData} 
                                  index={widgetIdx} 
                                  language={language} 
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* Flights (not in grid) */}
                          {widgets.filter(w => w.type === 'flight').map((widget, widgetIdx) => (
                            <FlightWidget 
                              key={widgetIdx} 
                              flight={widget.data as FlightData} 
                              index={widgetIdx} 
                              language={language} 
                            />
                          ))}
                          
                          {/* Weather (not in grid) */}
                          {widgets.filter(w => w.type === 'weather').map((widget, widgetIdx) => (
                            <WeatherWidget 
                              key={widgetIdx} 
                              weather={widget.data as WeatherData} 
                              index={widgetIdx} 
                              language={language} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-xl 
                    border border-gray-700/50">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full bounce-subtle" 
                        style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full bounce-subtle" 
                        style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full bounce-subtle" 
                        style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-gray-400">{t.typingIndicator}</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-800/50 bg-black/20 backdrop-blur-xl p-6">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.inputPlaceholder}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl
                  text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 
                  transition-colors"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 
                text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all duration-300 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {t.send}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelChatUI;