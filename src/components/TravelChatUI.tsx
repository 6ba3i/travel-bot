// src/components/TravelChatUI.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Plane, Hotel, MapPin, CloudSun, Camera, Star, Clock, Users, 
  ChevronDown, Globe, MessageSquare, Plus, Search, Trash2, X, Sparkles,
  TreePine, Utensils, Building, Wind, Sun, Cloud, CloudRain, CloudSnow,
  User, Settings, LogOut, CreditCard, HelpCircle, Bell, Shield, Map
} from 'lucide-react';
import { useChatStore } from '../store/useChat';
import { TRANSLATIONS, LanguageCode } from '../lib/translations';
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
  rating?: number;
  reviews?: number;
  price: string;
  location: string;
  link?: string;
  image?: string;
  mapUrl?: string;
  address?: string;
}

interface POIData {
  name: string;
  rating?: number;
  reviews?: number;
  type?: string;
  price?: string;
  address?: string;
  hours?: string;
  image?: string;
  mapUrl?: string;
  description?: string;
  website?: string;
}

interface RestaurantData {
  name: string;
  rating?: number;
  reviews?: number;
  cuisine?: string;
  priceLevel?: string;
  address?: string;
  hours?: string;
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

interface Widget {
  type: string;
  data: FlightData | HotelData | POIData | RestaurantData | WeatherData;
}

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

// Hotel Widget Component with purple hover effect
const HotelWidget: React.FC<{ hotel: HotelData; index: number; language: LanguageCode }> = ({ hotel, index, language }) => {
  const [isHovered, setIsHovered] = useState(false);
  const t = TRANSLATIONS[language];
  
  const getGoogleMapsUrl = () => {
    const searchQuery = `${hotel.name} ${hotel.address || hotel.location}`;
    return `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
  };
  
  return (
    <div
      className={`relative group transition-all duration-500 transform
        ${isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100 translate-y-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Purple glow on hover - external effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl blur-xl 
        ${isHovered ? 'opacity-30' : 'opacity-0'} transition-opacity duration-500`} />
      
      <div className={`travel-card relative overflow-hidden rounded-xl bg-gray-800/50 backdrop-blur-lg 
        border ${isHovered ? 'border-purple-500/50' : 'border-gray-700/50'} 
        transition-all duration-300`}>
        
        {/* Image with fixed height */}
        <div className="relative h-48 w-full overflow-hidden">
          {hotel.image ? (
            <img 
              src={hotel.image} 
              alt={hotel.name}
              className="travel-card-image w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Hotel';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-700 to-purple-800 flex items-center justify-center">
              <Hotel className="w-12 h-12 text-purple-600" />
            </div>
          )}
          
          {/* Price Badge at top */}
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full">
            <span className="text-white font-bold">{hotel.price}</span>
          </div>
          
          {/* Rating Badge */}
          {hotel.rating && (
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-sm">{hotel.rating}</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="travel-card-body p-4 flex flex-col h-full">
          <h3 className="travel-card-title text-white font-semibold text-lg mb-2 line-clamp-2">
            {hotel.name}
          </h3>
          
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{hotel.address || hotel.location}</span>
          </div>
          
          {hotel.reviews && (
            <div className="text-sm text-gray-400 mb-3">
              {hotel.reviews} {t.reviews}
            </div>
          )}
          
          <div className="flex-grow"></div>
          
          <div className="travel-card-footer pt-3 mt-auto border-t border-gray-700/50">
            <div className="flex gap-2">
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm text-center transition-colors"
              >
                {t.viewDetails}
              </a>
              <a
                href={hotel.mapUrl || getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <MapPin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// POI Widget Component with green hover effect
const POIWidget: React.FC<{ poi: POIData; index: number; language: LanguageCode }> = ({ poi, index, language }) => {
  const [isHovered, setIsHovered] = useState(false);
  const t = TRANSLATIONS[language];
  
  const getTypeIcon = (type: string) => {
    if (type?.toLowerCase().includes('museum')) return Building;
    if (type?.toLowerCase().includes('park')) return TreePine;
    if (type?.toLowerCase().includes('restaurant')) return Utensils;
    return MapPin;
  };
  
  const TypeIcon = getTypeIcon(poi.type || '');
  
  const getGoogleMapsUrl = () => {
    const searchQuery = `${poi.name} ${poi.address || ''}`;
    return `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
  };
  
  return (
    <div
      className={`relative group transition-all duration-500 transform
        ${isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100 translate-y-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Green glow on hover - external effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-xl blur-xl 
        ${isHovered ? 'opacity-30' : 'opacity-0'} transition-opacity duration-500`} />
      
      <div className={`poi-card relative overflow-hidden rounded-xl bg-gray-800/50 backdrop-blur-lg 
        border ${isHovered ? 'border-green-500/50' : 'border-gray-700/50'} 
        transition-all duration-300`}>
        
        {/* Image with fixed height */}
        <div className="relative h-48 w-full overflow-hidden">
          {poi.image ? (
            <img 
              src={poi.image} 
              alt={poi.name}
              className="travel-card-image w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Attraction';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-700 to-green-800 flex items-center justify-center">
              <TypeIcon className="w-12 h-12 text-green-600" />
            </div>
          )}
          
          {/* Price Badge at top */}
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full">
            <span className="text-white font-bold">{poi.price || 'Free'}</span>
          </div>
          
          {/* Rating Badge */}
          {poi.rating && (
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-sm">{poi.rating}</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="travel-card-body p-4 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2">
            <TypeIcon className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-xs font-medium uppercase tracking-wider">
              {poi.type}
            </span>
          </div>
          
          <h3 className="travel-card-title text-white font-semibold text-lg mb-2 line-clamp-2">
            {poi.name}
          </h3>
          
          <p className="travel-card-description text-gray-400 text-sm mb-3 line-clamp-3">
            {poi.description}
          </p>
          
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{poi.address}</span>
          </div>
          
          {poi.hours && (
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
              <Clock className="w-3 h-3" />
              <span className="line-clamp-1">{poi.hours}</span>
            </div>
          )}
          
          <div className="flex-grow"></div>
          
          <div className="travel-card-footer pt-3 mt-auto border-t border-gray-700/50">
            {poi.reviews && (
              <div className="text-sm text-gray-400 mb-3">
                {poi.reviews} {t.reviews}
              </div>
            )}
            
            <div className="flex gap-2">
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm text-center transition-colors"
              >
                {t.viewDetails}
              </a>
              <a
                href={poi.mapUrl || getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <MapPin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Restaurant Widget Component with orange hover effect
const RestaurantWidget: React.FC<{ restaurant: RestaurantData; index: number; language: LanguageCode }> = ({ restaurant, index, language }) => {
  const [isHovered, setIsHovered] = useState(false);
  const t = TRANSLATIONS[language];
  
  const getPriceLevelDisplay = (level: string) => {
    const count = level?.length || 2;
    return level || '$';
  };
  
  const getGoogleMapsUrl = () => {
    const searchQuery = `${restaurant.name} restaurant ${restaurant.address || restaurant.cuisine || ''}`;
    return `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
  };
  
  return (
    <div
      className={`relative group transition-all duration-500 transform
        ${isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100 translate-y-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Orange glow on hover - external effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl blur-xl 
        ${isHovered ? 'opacity-30' : 'opacity-0'} transition-opacity duration-500`} />
      
      <div className={`restaurant-card relative overflow-hidden rounded-xl bg-gray-800/50 backdrop-blur-lg 
        border ${isHovered ? 'border-orange-500/50' : 'border-gray-700/50'} 
        transition-all duration-300`}>
        
        {/* Image with fixed height */}
        <div className="relative h-48 w-full overflow-hidden">
          {restaurant.image ? (
            <img 
              src={restaurant.image} 
              alt={restaurant.name}
              className="travel-card-image w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Restaurant';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-700 to-orange-800 flex items-center justify-center">
              <Utensils className="w-12 h-12 text-orange-600" />
            </div>
          )}
          
          {/* Price Level Badge at top */}
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full">
            <span className="text-white font-bold text-sm">{getPriceLevelDisplay(restaurant.priceLevel || '')}</span>
          </div>
          
          {/* Rating Badge */}
          {restaurant.rating && (
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-sm">{restaurant.rating}</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="travel-card-body p-4 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2">
            <Utensils className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-xs font-medium uppercase tracking-wider">
              {restaurant.cuisine || 'Restaurant'}
            </span>
          </div>
          
          <h3 className="travel-card-title text-white font-semibold text-lg mb-2 line-clamp-2">
            {restaurant.name}
          </h3>
          
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{restaurant.address}</span>
          </div>
          
          {restaurant.hours && (
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
              <Clock className="w-3 h-3" />
              <span className="line-clamp-1">{restaurant.hours}</span>
            </div>
          )}
          
          <div className="flex-grow"></div>
          
          <div className="travel-card-footer pt-3 mt-auto border-t border-gray-700/50">
            {restaurant.reviews && (
              <div className="text-sm text-gray-400 mb-3">
                {restaurant.reviews} {t.reviews}
              </div>
            )}
            
            <div className="flex gap-2">
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm text-center transition-colors"
              >
                {t.viewDetails}
              </a>
              <a
                href={restaurant.mapUrl || getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <MapPin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Weather Widget Component
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
        
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-3">
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

// Sidebar Component with My Travels button
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
      
      {/* My Travels Button */}
      <div className="p-4 border-t border-gray-800/50">
        <a
          href="#"
          className="w-full py-2 px-4 rounded-lg bg-gray-800/50 border border-gray-700/50
            text-gray-300 font-medium hover:bg-gray-700/50 hover:text-white hover:border-gray-600/50
            transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Map className="w-4 h-4" />
          My Travels
        </a>
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
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
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
            
            <div className="flex items-center gap-3">
              {/* Account Section with Hover Menu */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowAccountDropdown(true)}
                  onMouseLeave={() => setShowAccountDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 
                    text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Account</span>
                </button>
                
                {showAccountDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-xl 
                      border border-gray-700/50 overflow-hidden z-50"
                    onMouseEnter={() => setShowAccountDropdown(true)}
                    onMouseLeave={() => setShowAccountDropdown(false)}
                  >
                    {/* Quick Tools Section */}
                    <div className="p-2 border-b border-gray-700/50">
                      <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-1">Quick Tools</div>
                      <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Payment Methods
                      </button>
                      <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications
                      </button>
                      <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Privacy Settings
                      </button>
                    </div>
                    
                    {/* Account Actions */}
                    <div className="p-2">
                      <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Manage Account
                      </button>
                      <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Help & Support
                      </button>
                      <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-red-400 flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Language Selector */}
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
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-xl 
                    border border-gray-700/50 overflow-hidden z-50">
                    {Object.keys(TRANSLATIONS).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang as LanguageCode);
                          setShowLanguageDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-800/50 transition-colors
                          ${language === lang ? 'bg-indigo-600/20 text-indigo-400' : 'text-white'}`}
                      >
                        {TRANSLATIONS[lang as LanguageCode].languageName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                            : 'bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 text-gray-200'
                        }`}>
                          <div className="whitespace-pre-wrap">{textContent}</div>
                        </div>
                      )}
                      
                      {widgets.length > 0 && (
                        <div className="mt-4">
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
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" 
                        style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" 
                        style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" 
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