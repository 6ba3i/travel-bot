// src/components/TravelChatUI.tsx - Complete version with weather widget and fixed hotel grid
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Trash2, Loader2, MapPin, Users, 
  Clock, Star, Plane, Hotel, 
  CloudSun, Sparkles, Globe, Languages, Map,
  MessageSquare, Plus, X, Sun, Cloud, CloudRain,
  CloudSnow, Wind, Droplets
} from 'lucide-react';
import { useChatStore } from '../store/useChat';
import './TravelChatUI.css';

// Translations for UI elements
const TRANSLATIONS = {
  en: {
    sendMessage: 'Send message',
    clearChat: 'New chat',
    typingIndicator: 'TravelBot is thinking...',
    newConversation: 'New conversation',
    samplePromptsTitle: 'Try asking TravelBot:',
    bookNow: 'Book Now',
    viewOnMap: 'View on Map',
    departure: 'Departure',
    arrival: 'Arrival',
    duration: 'Duration',
    stops: 'Stops',
    nonstop: 'Nonstop',
    stop: 'stop',
    stops_plural: 'stops',
    perNight: 'per night',
    reviews: 'reviews',
    rating: 'Rating',
    weather: 'Weather',
    temperature: 'Temperature',
    precipitation: 'Precipitation',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    flightSearchPrompt: 'Find flights from Casablanca to Barcelona',
    hotelSearchPrompt: 'Best hotels in Tokyo under $200',
    itineraryPrompt: '3-day Barcelona itinerary',
    weatherPrompt: 'Weather in Bali next week',
    chatHistory: 'Chat History',
    deleteChat: 'Delete chat',
    today: 'Today',
    tomorrow: 'Tomorrow'
  },
  fr: {
    sendMessage: 'Envoyer le message',
    clearChat: 'Nouveau chat',
    typingIndicator: 'TravelBot réfléchit...',
    newConversation: 'Nouvelle conversation',
    samplePromptsTitle: 'Essayez de demander à TravelBot:',
    bookNow: 'Réserver',
    viewOnMap: 'Voir sur la carte',
    departure: 'Départ',
    arrival: 'Arrivée',
    duration: 'Durée',
    stops: 'Escales',
    nonstop: 'Direct',
    stop: 'escale',
    stops_plural: 'escales',
    perNight: 'par nuit',
    reviews: 'avis',
    rating: 'Note',
    weather: 'Météo',
    temperature: 'Température',
    precipitation: 'Précipitations',
    humidity: 'Humidité',
    windSpeed: 'Vitesse du vent',
    flightSearchPrompt: 'Trouver des vols de Casablanca à Barcelone',
    hotelSearchPrompt: 'Meilleurs hôtels à Tokyo sous 200$',
    itineraryPrompt: 'Itinéraire de 3 jours à Barcelone',
    weatherPrompt: 'Météo à Bali la semaine prochaine',
    chatHistory: 'Historique des chats',
    deleteChat: 'Supprimer le chat',
    today: "Aujourd'hui",
    tomorrow: 'Demain'
  },
  zh: {
    sendMessage: '发送消息',
    clearChat: '新聊天',
    typingIndicator: 'TravelBot 正在思考...',
    newConversation: '新对话',
    samplePromptsTitle: '试着问 TravelBot:',
    bookNow: '立即预订',
    viewOnMap: '在地图上查看',
    departure: '出发',
    arrival: '到达',
    duration: '时长',
    stops: '转机',
    nonstop: '直飞',
    stop: '转机',
    stops_plural: '转机',
    perNight: '每晚',
    reviews: '评价',
    rating: '评分',
    weather: '天气',
    temperature: '温度',
    precipitation: '降水',
    humidity: '湿度',
    windSpeed: '风速',
    flightSearchPrompt: '查找从卡萨布兰卡到巴塞罗那的航班',
    hotelSearchPrompt: '东京200美元以下最佳酒店',
    itineraryPrompt: '巴塞罗那3天行程',
    weatherPrompt: '巴厘岛下周天气',
    chatHistory: '聊天记录',
    deleteChat: '删除聊天',
    today: '今天',
    tomorrow: '明天'
  }
} as const;

// Language options
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
] as const;

// Type definitions
interface FlightData {
  airline: string;
  price: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: string | number;
  bookingLink: string;
  flightNumber?: string;
  carbonEmissions?: string;
  airlineWebsite?: string;
}

interface HotelData {
  name: string;
  rating: string | number;
  reviews: string | number;
  price: string;
  location: string;
  link: string;
  amenities?: string[];
  image?: string;
  mapUrl?: string;
  address?: string;
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
  data: FlightData | HotelData | WeatherData;
}

// Language type
type LanguageCode = keyof typeof TRANSLATIONS;

// Airline website mapping
const AIRLINE_WEBSITES: Record<string, string> = {
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
  'EasyJet': 'https://www.easyjet.com'
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

// Enhanced Weather Widget Component
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
        transition-all duration-300 p-6`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center justify-center">
              <CloudSun className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{weather.location}</h3>
              <p className="text-sm text-gray-400">{t.weather}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{weather.current.temp}°C</div>
            <div className="text-sm text-gray-400">{weather.current.condition}</div>
          </div>
        </div>
        
        {/* Current Weather Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-xs text-gray-500">{t.humidity}</div>
              <div className="text-sm text-white">{weather.current.humidity}%</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">{t.windSpeed}</div>
              <div className="text-sm text-white">{weather.current.windSpeed} km/h</div>
            </div>
          </div>
        </div>
        
        {/* 7-Day Forecast */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">7-Day Forecast</h4>
          <div className="space-y-2">
            {weather.forecast.slice(0, 7).map((day, idx) => {
              const WeatherIcon = getWeatherIcon(day.icon);
              
              return (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-700/20 hover:bg-gray-700/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <WeatherIcon className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-sm font-medium text-white">{day.day}</div>
                      <div className="text-xs text-gray-500">{day.condition}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {day.precipitation > 0 && (
                      <div className="flex items-center gap-1">
                        <CloudRain className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-gray-400">{day.precipitation}%</span>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{day.high}°</div>
                      <div className="text-xs text-gray-400">{day.low}°</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Flight Widget Component
const FlightWidget: React.FC<{ flight: FlightData; index: number; language: LanguageCode }> = ({ flight, index, language }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const t = TRANSLATIONS[language];
  
  const formatTime = (timeString: string): string => {
    if (!timeString) return 'TBD';
    try {
      let date: Date;
      
      if (timeString.includes('T')) {
        date = new Date(timeString);
      } else if (timeString.includes(':')) {
        const today = new Date();
        if (timeString.includes('AM') || timeString.includes('PM')) {
          const [time, period] = timeString.split(' ');
          const [hours, minutes] = time.split(':');
          let hour24 = parseInt(hours);
          
          if (period === 'PM' && hour24 !== 12) hour24 += 12;
          if (period === 'AM' && hour24 === 12) hour24 = 0;
          
          date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour24, parseInt(minutes));
        } else {
          const [hours, minutes] = timeString.split(':');
          date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
        }
      } else {
        date = new Date(timeString);
      }
      
      if (isNaN(date.getTime())) {
        return timeString;
      }
      
      return date.toTimeString().slice(0, 5);
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  const getBookingLink = (): string => {
    const airlineWebsite = AIRLINE_WEBSITES[flight.airline];
    if (airlineWebsite) {
      return airlineWebsite;
    }
    return flight.bookingLink || flight.airlineWebsite || '#';
  };

  const formatStops = (stops: string | number): string => {
    const numStops = typeof stops === 'string' ? parseInt(stops) || 0 : stops || 0;
    if (numStops === 0) return t.nonstop;
    return `${numStops} ${numStops === 1 ? t.stop : t.stops_plural}`;
  };
  
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-500 transform
        ${isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100 translate-y-0'}
        ${isPressed ? 'scale-[0.98]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={() => window.open(getBookingLink(), '_blank')}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl 
        ${isHovered ? 'opacity-40' : 'opacity-0'} transition-opacity duration-500`} />
      
      <div className={`relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl 
        rounded-2xl border ${isHovered ? 'border-blue-500/50' : 'border-gray-700/50'} 
        transition-all duration-300 p-6`}>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{flight.airline}</h3>
              <p className="text-sm text-gray-400">{flight.flightNumber || 'Flight'}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{flight.price}</div>
            {flight.carbonEmissions && (
              <div className="text-xs text-gray-500">{flight.carbonEmissions} CO₂</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="text-sm text-gray-500">{t.departure}</div>
            <div className="text-lg font-semibold text-white">{flight.departure}</div>
            <div className="text-sm text-gray-400">{formatTime(flight.departureTime)}</div>
          </div>
          
          <div className="flex-shrink-0 mx-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-gray-600"></div>
              <div className={`w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center transition-transform duration-300 
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

// Enhanced Hotel Widget Component
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
        transition-all duration-300 overflow-hidden h-full flex flex-col`}>
        
        {/* Hotel Image */}
        <div className="relative h-48 overflow-hidden bg-gray-800 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10" />
          
          {hotel.image ? (
            <>
              {!imageLoaded && (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse flex items-center justify-center">
                  <Hotel className="w-16 h-16 text-gray-500" />
                </div>
              )}
              <img 
                src={hotel.image} 
                alt={hotel.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
              />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Hotel className="w-16 h-16 text-gray-500" />
            </div>
          )}
          
          {/* Map Button */}
          {hotel.mapUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(hotel.mapUrl, '_blank');
              }}
              className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-black/50 backdrop-blur-sm 
                       hover:bg-black/70 transition-all duration-200 tooltip"
              data-tooltip={t.viewOnMap}
            >
              <Map className="w-4 h-4 text-white" />
            </button>
          )}
          
          {/* Price Badge */}
          <div className="absolute bottom-3 left-3 z-20">
            <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold">
              {hotel.price}
              <span className="text-xs ml-1">{t.perNight}</span>
            </div>
          </div>
        </div>
        
        <div className="relative p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-white leading-tight flex-1">{hotel.name}</h3>
          </div>
          
          {hotel.address && (
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400 line-clamp-2">{hotel.address}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(rating)
                      ? 'text-yellow-400 fill-current' 
                      : i < rating 
                        ? 'text-yellow-400 fill-current opacity-50'
                        : 'text-gray-600'
                  }`}
                />
              ))}
              <span className="text-sm text-gray-400 ml-1">{rating}</span>
            </div>
            
            {hotel.reviews && (
              <span className="text-sm text-gray-500">
                ({hotel.reviews} {t.reviews})
              </span>
            )}
          </div>
          
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                <span key={idx} className="px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded-md">
                  {amenity}
                </span>
              ))}
            </div>
          )}
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
}> = ({ 
  language, 
  onClose, 
  conversations, 
  activeId, 
  onSelectConversation, 
  onDeleteConversation, 
  onNewConversation 
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="w-80 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50 flex flex-col">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {t.chatHistory}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewConversation}
            className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 transition-colors"
            title={t.newConversation}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 transition-colors md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {language === 'fr' ? 'Aucune conversation' : 
             language === 'zh' ? '没有对话' : 
             'No conversations'}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {conversations
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 conversation-item
                    ${conversation.id === activeId 
                      ? 'bg-indigo-600/20 border border-indigo-500/30 active' 
                      : 'bg-gray-700/30 hover:bg-gray-700/50 border border-transparent'
                    }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {conversation.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </p>
                      {conversation.messages.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {conversation.messages[conversation.messages.length - 1]?.content.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-400 transition-all duration-200"
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

// Main component
const TravelChatUI: React.FC = () => {
  const { conversations, activeId, loading, send, newConversation, selectConversation, deleteConversation } = useChatStore();
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  // Get messages from active conversation
  const activeConversation = conversations.find(c => c.id === activeId);
  const messages = activeConversation?.messages || [];
  const isLoading = loading;

  // Get sample prompts based on language
  const getSamplePrompts = () => [
    { icon: Plane, text: t.flightSearchPrompt, color: 'from-blue-500 to-indigo-600' },
    { icon: Hotel, text: t.hotelSearchPrompt, color: 'from-purple-500 to-pink-600' },
    { icon: Globe, text: t.itineraryPrompt, color: 'from-green-500 to-emerald-600' },
    { icon: CloudSun, text: t.weatherPrompt, color: 'from-orange-500 to-red-600' },
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Create initial conversation if none exists
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

    // Enhanced widget parsing with better regex patterns
    const widgetPatterns = [
      {
        type: 'flight',
        pattern: /\[FLIGHT_WIDGET\](.*?)\[\/FLIGHT_WIDGET\]/gs
      },
      {
        type: 'hotel',
        pattern: /\[HOTEL_WIDGET\](.*?)\[\/HOTEL_WIDGET\]/gs
      },
      {
        type: 'weather',
        pattern: /\[WEATHER_WIDGET\](.*?)\[\/WEATHER_WIDGET\]/gs
      }
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
      {/* Sidebar */}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Language Selector */}
        <header className="border-b border-gray-800/50 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 transition-colors md:hidden"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">TravelBot</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                >
                  <Languages className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">
                    {LANGUAGES.find(l => l.code === language)?.flag} {LANGUAGES.find(l => l.code === language)?.name}
                  </span>
                </button>
                
                {showLanguageDropdown && (
                  <div className="absolute top-full right-0 mt-2 py-2 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-50 min-w-[150px]">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguageDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-700 transition-colors
                          ${language === lang.code ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => newConversation(language)}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-green-600/20 text-gray-400 hover:text-green-400 transition-colors"
                title={t.clearChat}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-2xl">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  {t.samplePromptsTitle}
                </h2>
                
                <p className="text-gray-400 mb-8 text-lg">
                  TravelBot {language === 'fr' ? 'peut vous aider avec vos voyages' : 
                           language === 'zh' ? '可以帮助您规划旅行' : 
                           'can help you plan your perfect trip'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  {getSamplePrompts().map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(prompt.text)}
                      className={`group p-4 rounded-xl bg-gradient-to-r ${prompt.color} 
                               hover:scale-105 transition-all duration-300 text-left`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <prompt.icon className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">
                          {language === 'fr' ? 'Essayez:' : 
                           language === 'zh' ? '试试:' : 
                           'Try asking:'}
                        </span>
                      </div>
                      <p className="text-white/90 text-sm">{prompt.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-7xl mx-auto p-6">
              {messages.map((msg: Message, idx: number) => {
                const { textContent, widgets } = parseMessage(msg.content);
                
                return (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end max-w-[70%]">
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 w-full">
                        {textContent && (
                          <div className="p-4 rounded-2xl bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 text-gray-300">
                            {textContent}
                          </div>
                        )}
                        
                        {widgets.length > 0 && (
                          <div className="space-y-6">
                            {widgets.map((widget, widgetIdx) => {
                              if (widget.type === 'flight') {
                                return <FlightWidget key={widgetIdx} flight={widget.data as FlightData} index={widgetIdx} language={language} />;
                              } else if (widget.type === 'hotel') {
                                return (
                                  <div key={widgetIdx} className="hotel-grid">
                                    <HotelWidget hotel={widget.data as HotelData} index={widgetIdx} language={language} />
                                  </div>
                                );
                              } else if (widget.type === 'weather') {
                                return <WeatherWidget key={widgetIdx} weather={widget.data as WeatherData} index={widgetIdx} language={language} />;
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-xl border border-gray-700/50">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full bounce-subtle" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full bounce-subtle" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full bounce-subtle" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-gray-400">{t.typingIndicator}</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-800/50 bg-black/20 backdrop-blur-xl p-6">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'fr' ? 'Demandez à TravelBot...' : 
                           language === 'zh' ? '问问 TravelBot...' : 
                           'Ask TravelBot...'}
                className="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl 
                         text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 
                         transition-all duration-200"
                disabled={isLoading}
              />
            </div>
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium 
                       hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all duration-200 flex items-center gap-2"
              title={t.sendMessage}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelChatUI;