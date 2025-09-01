import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Send, Sparkles, Hotel, Plane, Camera, Utensils, CloudSun, Map, 
  MessageSquare, X, Search, Plus, Trash2, ChevronDown, User, Globe,
  Settings, HelpCircle, LogOut, CreditCard, Bell, Shield, Star,
  MapPin, Clock, Sun, Cloud, CloudRain, CloudSnow,
  Wind, Droplets
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
  location?: string;
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

// Helper functions
const formatFlightTime = (time: string): string => {
  if (!time || time === 'N/A' || time === 'Check airline') return time;
  
  try {
    if (/^\d{2}:\d{2}$/.test(time)) return time;
    
    const date = new Date(time);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isNextDay = date.toDateString() === tomorrow.toDateString() || 
                     time.includes('+1') || 
                     time.toLowerCase().includes('next day');
    
    return `${hours}:${minutes}${isNextDay ? ' j+1' : ''}`;
  } catch {
    const timeMatch = time.match(/\d{1,2}:\d{2}/);
    return timeMatch ? timeMatch[0] : time;
  }
};

const getHighQualityImage = (imageUrl: string): string => {
  if (!imageUrl) return '';
  
  if (imageUrl.includes('googleusercontent.com')) {
    return imageUrl
      .replace(/=s\d+/, '=s1000')
      .replace(/=w\d+-h\d+/, '=w1000-h750')
      .replace(/=w\d+/, '=w1000');
  }
  
  if (imageUrl.includes('cloudinary')) {
    return imageUrl.replace(/w_\d+/, 'w_1000').replace(/h_\d+/, 'h_750');
  }
  
  return imageUrl;
};

// Flight Widget Component
const FlightWidget: React.FC<{ 
  flight: FlightData; 
  index: number; 
  language: LanguageCode;
  isMyTravels?: boolean;
  onSelect?: () => void;
}> = ({ flight, index, language, isMyTravels = false, onSelect }) => {
  const [, setIsHovered] = useState(false);
  const t = TRANSLATIONS[language];
  
  return (
    <div
      className={`flight-widget ${isMyTravels ? 'my-travels-widget' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 100}ms`, width: '1200px', padding: '2rem' }}
    >
      {isMyTravels && onSelect && (
        <button onClick={onSelect} className="select-flight-btn">
          Choose This Flight
        </button>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">{flight.airline}</div>
          {flight.flightNumber && (
            <div className="text-sm text-gray-500">Flight {flight.flightNumber}</div>
          )}
        </div>
        <div className="text-3xl font-bold text-green-600">{flight.price}</div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="text-center flex-1">
          <div className="text-3xl font-bold text-gray-800">{flight.departure}</div>
          <div className="text-xl text-gray-600 mt-1">{formatFlightTime(flight.departureTime)}</div>
        </div>
        
        <div className="px-8">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-24 h-px bg-gray-300"></div>
            <Plane className="w-6 h-6" />
            <div className="w-24 h-px bg-gray-300"></div>
          </div>
          <div className="text-center text-sm text-gray-500 mt-1">{flight.duration}</div>
        </div>
        
        <div className="text-center flex-1">
          <div className="text-3xl font-bold text-gray-800">{flight.arrival}</div>
          <div className="text-xl text-gray-600 mt-1">{formatFlightTime(flight.arrivalTime)}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-6">
          <span className="text-sm text-gray-500">
            {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </span>
          {flight.carbonEmissions && (
            <span className="text-sm text-gray-500">CO₂: {flight.carbonEmissions}</span>
          )}
        </div>
        {!isMyTravels && flight.bookingLink && (
          <a
            href={flight.bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90"
          >
            Book Now →
          </a>
        )}
      </div>
    </div>
  );
};

// Hotel Widget Component
const HotelWidget: React.FC<{ 
  hotel: HotelData; 
  index: number; 
  language: LanguageCode;
  isMyTravels?: boolean;
  onSelect?: () => void;
}> = ({ hotel, index, language, isMyTravels = false, onSelect }) => {
  const [, setIsHovered] = useState(false);
  const t = TRANSLATIONS[language];
  const highQualityImage = getHighQualityImage(hotel.image || '');
  
  return (
    <div
      className={`hotel-widget ${isMyTravels ? 'my-travels-widget' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {highQualityImage && (
        <div className="hotel-image-container">
          <img 
            src={highQualityImage} 
            alt={hotel.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
        
        {hotel.rating && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(hotel.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({hotel.reviews} {t.reviews})</span>
          </div>
        )}
        
        <div className="text-2xl font-bold text-green-600 mb-2">{hotel.price}</div>
        
        {hotel.location && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4" />
            {hotel.location}
          </div>
        )}
        
        {isMyTravels && onSelect ? (
          <button onClick={onSelect} className="select-hotel-btn">
            Choose This Hotel
          </button>
        ) : (
          <div className="flex gap-2">
            {hotel.link && (
              <a
                href={hotel.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700"
              >
                View Details
              </a>
            )}
            {hotel.mapUrl && (
              <a
                href={hotel.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <MapPin className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// POI Widget Component
const POIWidget: React.FC<{ 
  poi: POIData; 
  index: number; 
  language: LanguageCode;
  isMyTravels?: boolean;
  checked?: boolean;
  onCheck?: (checked: boolean) => void;
}> = ({ poi, index, isMyTravels = false, checked = false, onCheck }) => {
  const highQualityImage = getHighQualityImage(poi.image || '');
  
  return (
    <div className={`poi-widget ${isMyTravels ? 'my-travels-widget' : ''}`} style={{ animationDelay: `${index * 100}ms` }}>
      {isMyTravels && onCheck && (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheck(e.target.checked)}
          className="poi-checkbox"
        />
      )}
      
      {highQualityImage && (
        <div className="poi-image-container">
          <img 
            src={highQualityImage} 
            alt={poi.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{poi.name}</h3>
        
        {poi.type && <div className="text-sm text-gray-600 mb-1">{poi.type}</div>}
        
        {poi.rating && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(poi.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({poi.reviews})</span>
          </div>
        )}
        
        {poi.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{poi.description}</p>
        )}
        
        {poi.price && <div className="text-lg font-bold text-green-600 mb-2">{poi.price}</div>}
        
        {poi.hours && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <Clock className="w-4 h-4" />
            {poi.hours}
          </div>
        )}
        
        {!isMyTravels && (
          <div className="flex gap-2">
            {poi.website && (
              <a
                href={poi.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700"
              >
                Visit Website
              </a>
            )}
            {poi.mapUrl && (
              <a
                href={poi.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <MapPin className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Restaurant Widget Component
const RestaurantWidget: React.FC<{ 
  restaurant: RestaurantData; 
  index: number; 
  language: LanguageCode;
  isMyTravels?: boolean;
  checked?: boolean;
  onCheck?: (checked: boolean) => void;
}> = ({ restaurant, index, isMyTravels = false, checked = false, onCheck }) => {
  const highQualityImage = getHighQualityImage(restaurant.image || '');
  
  return (
    <div className={`restaurant-widget ${isMyTravels ? 'my-travels-widget' : ''}`} style={{ animationDelay: `${index * 100}ms` }}>
      {isMyTravels && onCheck && (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheck(e.target.checked)}
          className="restaurant-checkbox"
        />
      )}
      
      {highQualityImage && (
        <div className="restaurant-image-container">
          <img 
            src={highQualityImage} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name}</h3>
        
        {restaurant.cuisine && <div className="text-sm text-gray-600 mb-1">{restaurant.cuisine}</div>}
        
        {restaurant.rating && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(restaurant.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({restaurant.reviews})</span>
          </div>
        )}
        
        {restaurant.priceLevel && (
          <div className="text-lg font-bold text-green-600 mb-2">{restaurant.priceLevel}</div>
        )}
        
        {restaurant.address && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4" />
            {restaurant.address}
          </div>
        )}
        
        {!isMyTravels && (
          <div className="flex gap-2">
            {restaurant.website && (
              <a
                href={restaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700"
              >
                Visit Website
              </a>
            )}
            {restaurant.mapUrl && (
              <a
                href={restaurant.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <MapPin className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Weather Widget Component
const WeatherWidget: React.FC<{ weather: WeatherData; index: number; language: LanguageCode }> = ({ weather, index, language }) => {
  const t = TRANSLATIONS[language];
  
  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) return Sun;
    if (lowerCondition.includes('cloud')) return Cloud;
    if (lowerCondition.includes('rain')) return CloudRain;
    if (lowerCondition.includes('snow')) return CloudSnow;
    if (lowerCondition.includes('wind')) return Wind;
    return Sun;
  };
  
  return (
    <div className="weather-widget" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="text-2xl font-bold text-white mb-4">{weather.location}</div>
      
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-white">{weather.current.temp}°</div>
            <div className="text-white/80">{weather.current.condition}</div>
          </div>
          {React.createElement(getWeatherIcon(weather.current.condition), { className: "w-16 h-16 text-white" })}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2 text-white/80">
            <Droplets className="w-4 h-4" />
            <span>{weather.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Wind className="w-4 h-4" />
            <span>{weather.current.windSpeed} km/h</span>
          </div>
        </div>
      </div>
      
      <div className="text-lg font-semibold text-white mb-2">{t.weatherForecast}</div>
      
      <div className="grid grid-cols-7 gap-2">
        {weather.forecast.slice(0, 7).map((day, idx) => {
          const IconComponent = getWeatherIcon(day.condition);
          return (
            <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-lg p-3 text-center">
              <div className="text-xs text-white/80 mb-1">{day.day}</div>
              <IconComponent className="w-8 h-8 text-white mx-auto mb-1" />
              <div className="text-sm font-bold text-white">{day.high}°</div>
              <div className="text-xs text-white/60">{day.low}°</div>
              {day.precipitation > 0 && (
                <div className="text-xs text-blue-400 mt-1">{day.precipitation}%</div>
              )}
            </div>
          );
        })}
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
      
      <div className="p-4 border-t border-gray-800/50">
        <a
          href="/my-travels"
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
  const accountDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  const activeConversation = conversations.find(c => c.id === activeId);
  const messages = activeConversation?.messages || [];
  const isLoading = loading;

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

  const handleAccountMouseEnter = () => {
    if (accountDropdownTimeoutRef.current) {
      clearTimeout(accountDropdownTimeoutRef.current);
    }
    setShowAccountDropdown(true);
  };

  const handleAccountMouseLeave = () => {
    accountDropdownTimeoutRef.current = setTimeout(() => {
      setShowAccountDropdown(false);
    }, 300);
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

  const getSamplePrompts = () => [
    { icon: Plane, text: t.flightSearchPrompt, color: 'from-blue-500 to-indigo-600' },
    { icon: Hotel, text: t.hotelSearchPrompt, color: 'from-purple-500 to-pink-600' },
    { icon: Camera, text: 'Show me tourist attractions in Paris', color: 'from-green-500 to-emerald-600' },
    { icon: Utensils, text: 'Find Italian restaurants in Barcelona', color: 'from-orange-500 to-red-600' },
    { icon: CloudSun, text: t.weatherPrompt, color: 'from-cyan-500 to-blue-600' },
  ];

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
              {/* Account Section */}
              <div className="relative">
                <button
                  onMouseEnter={handleAccountMouseEnter}
                  onMouseLeave={handleAccountMouseLeave}
                  onClick={() => window.location.href = '/my-account'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 
                    text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>My Account</span>
                </button>
                
                {showAccountDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-xl 
                      border border-gray-700/50 overflow-hidden z-50"
                    onMouseEnter={handleAccountMouseEnter}
                    onMouseLeave={handleAccountMouseLeave}
                  >
                    <div className="p-2 border-b border-gray-700/50">
                      <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-1">Quick Tools</div>
                      <button 
                        onClick={() => window.location.href = '/my-account#payment'}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Payment Methods
                      </button>
                      <button 
                        onClick={() => window.location.href = '/my-account#notifications'}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2"
                      >
                        <Bell className="w-4 h-4" />
                        Notifications
                      </button>
                      <button 
                        onClick={() => window.location.href = '/my-account#privacy'}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Privacy Settings
                      </button>
                    </div>
                    
                    <div className="p-2">
                      <button 
                        onClick={() => window.location.href = '/my-account#api'}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        API Settings
                      </button>
                      <button 
                        onClick={() => window.location.href = '/my-account'}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Manage Account
                      </button>
                      <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-300 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Help & Support
                      </button>
                      <button 
                        onClick={() => {/* Add logout logic */}}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-red-400 flex items-center gap-2"
                      >
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
                          ${language === lang ? 'bg-indigo-600/20 text-white' : 'text-gray-300'}`}
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

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {messages.length === 0 ? (
              <div className="px-6 py-12">
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-bold text-white mb-4">{t.welcome}</h1>
                  <p className="text-xl text-gray-400">{t.subtitle}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getSamplePrompts().map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(prompt.text)}
                      className={`p-4 rounded-xl bg-gradient-to-r ${prompt.color} 
                        text-white text-left hover:scale-105 transition-all duration-300 
                        shadow-lg hover:shadow-xl group`}
                    >
                      <prompt.icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium">{prompt.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-6 py-6">
                {messages.map((message, idx) => {
                  const { textContent, widgets } = parseMessage(message.content);
                  
                  return (
                    <div key={idx} className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                            {widgets.filter(w => w.type === 'flight').map((widget, widgetIdx) => (
                              <FlightWidget 
                                key={widgetIdx} 
                                flight={widget.data as FlightData} 
                                index={widgetIdx} 
                                language={language} 
                              />
                            ))}
                            
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
                  <div className="flex justify-start mb-6">
                    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                      <div className="flex items-center gap-2">
                        <div className="animate-bounce w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <div className="animate-bounce w-2 h-2 bg-indigo-500 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                        <div className="animate-bounce w-2 h-2 bg-indigo-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-gray-400 ml-2">{t.typingIndicator}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800/50 bg-black/20 backdrop-blur-xl p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.inputPlaceholder}
                className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700/50 rounded-xl
                  text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500/50
                  transition-colors backdrop-blur-xl"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600
                  text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelChatUI;