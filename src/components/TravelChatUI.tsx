// src/components/TravelChatUI.tsx - Enhanced with all requested improvements
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Trash2, Loader2, MapPin, Users, 
  Clock, Star, ChevronRight, Plane, Hotel, 
  CloudSun, Sparkles, Globe, Languages, Map,
  Calendar, Thermometer, Eye, Navigation
} from 'lucide-react';
import { useChatStore } from '../store/useChat';
import './TravelChatUI.css';

// Sample prompts for new users
const SAMPLE_PROMPTS = [
  { icon: Plane, text: 'Find flights from casablanca to barcelona', color: 'from-blue-500 to-indigo-600' },
  { icon: Hotel, text: 'Best hotels in Tokyo under $200', color: 'from-purple-500 to-pink-600' },
  { icon: Globe, text: '3-day Barcelona itinerary', color: 'from-green-500 to-emerald-600' },
  { icon: CloudSun, text: 'Weather in Bali next week', color: 'from-orange-500 to-red-600' },
];

// Language options
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

// Type definitions
interface FlightData {
  airline: string;
  price: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: string;
  bookingLink: string;
  flightNumber?: string;
  carbonEmissions?: string;
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
  current: {
    temp: number;
    description: string;
    icon: string;
  };
  daily: Array<{
    date: string;
    temp: { min: number; max: number };
    description: string;
    icon: string;
  }>;
}

// Enhanced Flight Widget Component
const FlightWidget: React.FC<{ flight: FlightData; index: number }> = ({ flight, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-500 transform
        ${isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100 translate-y-0'}
        ${isPressed ? 'scale-[0.98]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={() => window.open(flight.bookingLink, '_blank')}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl 
        ${isHovered ? 'opacity-40' : 'opacity-0'} transition-opacity duration-500`} />
      
      <div className={`relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl 
        rounded-2xl border ${isHovered ? 'border-blue-500/50' : 'border-gray-700/50'} 
        transition-all duration-300 overflow-hidden`}>
        
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 
                ${isHovered ? 'animate-pulse' : ''}`}>
                <Plane className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{flight.airline}</h3>
                <p className="text-sm text-gray-400">{flight.flightNumber || flight.stops}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                {flight.price}
              </div>
              {flight.carbonEmissions && (
                <div className="text-xs text-gray-500">{flight.carbonEmissions}</div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-gray-500">Departure</div>
                <div className="text-lg font-semibold text-white">{flight.departure}</div>
                <div className="text-sm text-gray-400">{flight.departureTime}</div>
              </div>
              
              <div className="flex-1 flex items-center justify-center px-4">
                <div className="relative w-full flex items-center">
                  <div className="h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <ChevronRight className={`w-5 h-5 text-blue-400 transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`} />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 text-right">
                <div className="text-sm text-gray-500">Arrival</div>
                <div className="text-lg font-semibold text-white">{flight.arrival}</div>
                <div className="text-sm text-gray-400">{flight.arrivalTime}</div>
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
                  <span className="text-sm text-gray-400">{flight.stops}</span>
                </div>
              </div>
              
              <button className={`px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 
                text-white font-medium text-sm transition-all duration-300 transform
                ${isHovered ? 'opacity-100 scale-105' : 'opacity-90 scale-100'}`}>
                Book Now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Hotel Widget Component with Images and Map Button
const HotelWidget: React.FC<{ hotel: HotelData; index: number }> = ({ hotel, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  
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
        transition-all duration-300 overflow-hidden`}>
        
        {/* Hotel Image */}
        <div className="relative h-48 overflow-hidden bg-gray-800">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10" />
          {hotel.image ? (
            <img 
              src={hotel.image} 
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
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
                       hover:bg-black/70 transition-all duration-200"
            >
              <Map className="w-4 h-4 text-white" />
            </button>
          )}
          
          {/* Price Badge */}
          <div className="absolute bottom-3 left-3 z-20">
            <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold">
              {hotel.price}
            </div>
          </div>
        </div>
        
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-white leading-tight">{hotel.name}</h3>
          </div>
          
          {hotel.address && (
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400">{hotel.address}</span>
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
            </div>
            <span className="text-white font-semibold">{rating}</span>
            {hotel.reviews && (
              <span className="text-gray-500 text-sm">({hotel.reviews} reviews)</span>
            )}
          </div>
          
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {hotel.amenities.slice(0, 3).map((amenity, i) => (
                <span key={i} className="px-2 py-1 text-xs rounded-lg bg-gray-700/50 text-gray-300">
                  {amenity}
                </span>
              ))}
            </div>
          )}
          
          <button className={`w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 
            text-white font-medium transition-all duration-300 transform
            ${isHovered ? 'opacity-100 scale-105' : 'opacity-90 scale-100'}`}>
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Weather Widget
const WeatherWidget: React.FC<{ weather: WeatherData }> = ({ weather }) => {
  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <CloudSun className="w-6 h-6 text-orange-400" />
        <h3 className="text-xl font-bold text-white">7-Day Weather Forecast</h3>
      </div>
      
      {/* Current Weather */}
      {weather.current && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Current</div>
              <div className="text-3xl font-bold text-white">{Math.round(weather.current.temp)}°C</div>
              <div className="text-sm text-gray-300">{weather.current.description}</div>
            </div>
            <Thermometer className="w-12 h-12 text-orange-400" />
          </div>
        </div>
      )}
      
      {/* 7-Day Forecast */}
      <div className="space-y-3">
        {weather.daily.map((day, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-white w-16">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <CloudSun className="w-5 h-5 text-blue-400" />
              <div className="text-sm text-gray-300">{day.description}</div>
            </div>
            <div className="text-right">
              <div className="text-white font-semibold">
                {Math.round(day.temp.max)}° / {Math.round(day.temp.min)}°
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Language Switcher Component
const LanguageSwitcher: React.FC<{ currentLang: string; onLanguageChange: (lang: string) => void }> = ({ currentLang, onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = LANGUAGES.find(lang => lang.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 
                 hover:bg-gray-700/50 transition-all duration-200"
      >
        <Languages className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">{currentLanguage.flag}</span>
        <span className="text-sm text-gray-300">{currentLanguage.name}</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onLanguageChange(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors
                ${lang.code === currentLang ? 'bg-gray-700' : ''}`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-gray-300">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Travel Chat UI Component
export default function TravelChatUI() {
  const { conversations, activeId, send, newConversation, selectConversation, deleteConversation } = useChatStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const activeConversation = conversations.find(c => c.id === activeId);
  const messages = activeConversation?.messages || [];
  
  // Auto-focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Enhanced message parsing with support for all widget types
  const parseMessage = useCallback((content: string) => {
    const widgets: Array<{ type: string; data: any }> = [];
    let textContent = content;
    
    // Extract hotel data with enhanced format
    const hotelRegex = /(\d+)\.\s\*\*([^*]+)\*\*\s(⭐\s[\d.]+)?\s*•?\s*\$?(\d+)\sper\snight\s*•?\s*(\d+)\sreviews\s*•?\s*([^\n]*)\s*•?\s*\[📍\sView\son\sMap\]\(([^)]+)\)\s*•?\s*\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = hotelRegex.exec(content)) !== null) {
      widgets.push({
        type: 'hotel',
        data: {
          name: match[2].trim(),
          rating: match[3]?.replace('⭐', '').trim() || '4.5',
          price: `$${match[4]}`,
          reviews: match[5],
          address: match[6]?.trim(),
          mapUrl: match[7],
          link: match[9],
          location: 'City Center'
        }
      });
    }
    
    // Extract flight data with enhanced format
    const flightRegex = /(\d+)\.\s\*\*([^*]+)\*\*\s-\s([^\n]+)\n\s+•\s([^→]+)→([^\n]+)\n\s+•\s([^\n]+)\n(?:\s+•\s([^\n]+)\n)?\s+•\s\[([^\]]+)\]\(([^)]+)\)/g;
    while ((match = flightRegex.exec(content)) !== null) {
      widgets.push({
        type: 'flight',
        data: {
          airline: match[3],
          price: match[2],
          departure: match[4].trim(),
          arrival: match[5].trim(),
          duration: match[6],
          departureTime: '10:00 AM',
          arrivalTime: '1:30 PM',
          stops: 'Nonstop',
          bookingLink: match[9],
          carbonEmissions: match[7]
        }
      });
    }
    
    // Extract weather data
    const weatherRegex = /Here's your 7-day weather forecast:([\s\S]*?)(?:\n\n|$)/;
    const weatherMatch = content.match(weatherRegex);
    if (weatherMatch) {
      // Parse weather data from the text
      const weatherText = weatherMatch[1];
      const currentMatch = weatherText.match(/\*\*Now\*\*:\s(\d+)°C,\s([^\n]+)/);
      const dailyMatches = [...weatherText.matchAll(/\*\*([^*]+)\*\*:\s([^,]+),\s(\d+)°C–(\d+)°C/g)];
      
      if (currentMatch || dailyMatches.length > 0) {
        widgets.push({
          type: 'weather',
          data: {
            current: currentMatch ? {
              temp: parseInt(currentMatch[1]),
              description: currentMatch[2],
              icon: 'clear'
            } : null,
            daily: dailyMatches.map(match => ({
              date: new Date().toISOString(), // You'd parse the actual date
              temp: { max: parseInt(match[4]), min: parseInt(match[3]) },
              description: match[2],
              icon: 'clear'
            }))
          }
        });
      }
    }
    
    // Remove widget text from content for cleaner display
    if (widgets.length > 0) {
      textContent = content
        .replace(hotelRegex, '')
        .replace(flightRegex, '')
        .replace(weatherRegex, '')
        .replace(/^[\d.]+\s*$/gm, '')
        .trim();
      
      // Keep intro text if present
      const introMatch = content.match(/^[^0-9*]+(?=\d\.|\*)/);
      if (introMatch) {
        textContent = introMatch[0].trim();
      }
    }
    
    return { textContent, widgets };
  }, []);
  
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    setIsTyping(true);
    await send(input, currentLanguage);
    setInput('');
    setIsTyping(false);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-950">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>
      
      {/* Sidebar - Enhanced Chat History */}
      <aside className={`relative z-10 ${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <div className="h-full bg-gray-900/50 backdrop-blur-xl border-r border-gray-800/50 flex flex-col">
          <div className="p-4 border-b border-gray-800/50">
            <button
              onClick={newConversation}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 
                       text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
            >
              <Sparkles className="w-5 h-5" />
              New Travel Plan
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer 
                  transition-all duration-200 ${
                  conv.id === activeId 
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30' 
                    : 'hover:bg-gray-800/30'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {conv.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {conv.messages.length} messages
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 
                           text-gray-400 hover:text-red-400 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Language Switcher in Sidebar */}
          <div className="p-4 border-t border-gray-800/50">
            <LanguageSwitcher 
              currentLang={currentLanguage}
              onLanguageChange={setCurrentLanguage}
            />
          </div>
        </div>
      </aside>
      
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TravelBot AI</h1>
              <p className="text-sm text-gray-400">Your multilingual travel assistant</p>
            </div>
          </div>
          
          <LanguageSwitcher 
            currentLang={currentLanguage}
            onLanguageChange={setCurrentLanguage}
          />
        </header>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 
                              flex items-center justify-center mb-6 mx-auto">
                  <Globe className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Plan Your Perfect Trip</h2>
                <p className="text-gray-400 text-lg max-w-md mx-auto">
                  Ask me about flights, hotels, weather, or attractions anywhere in the world!
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(prompt.text)}
                    className={`group p-4 rounded-xl bg-gradient-to-r ${prompt.color} 
                             hover:scale-105 transition-all duration-300 text-left`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <prompt.icon className="w-5 h-5 text-white" />
                      <span className="text-white font-medium">Try asking:</span>
                    </div>
                    <p className="text-white/90 text-sm">{prompt.text}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-6xl mx-auto">
              {messages.map((msg, idx) => {
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
                                return <FlightWidget key={widgetIdx} flight={widget.data} index={widgetIdx} />;
                              } else if (widget.type === 'hotel') {
                                return (
                                  <div key={widgetIdx} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <HotelWidget hotel={widget.data} index={widgetIdx} />
                                  </div>
                                );
                              } else if (widget.type === 'weather') {
                                return <WeatherWidget key={widgetIdx} weather={widget.data} />;
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
              
              {isTyping && (
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-200" />
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce animation-delay-400" />
                  </div>
                  <span>TravelBot is planning your trip...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Enhanced Input Area */}
        <div className="p-6 border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask about flights, hotels, weather... (${LANGUAGES.find(l => l.code === currentLanguage)?.name})`}
                className="w-full px-6 py-4 pr-14 rounded-2xl bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 
                         text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 focus:ring-2 
                         focus:ring-indigo-500/20 transition-all duration-200"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-gradient-to-r 
                         from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}