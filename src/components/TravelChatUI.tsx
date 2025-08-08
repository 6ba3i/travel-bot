// src/components/TravelChatUI.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Trash2, Loader2, MapPin, Users, 
  Clock, Star, ChevronRight, Plane, Hotel, 
  CloudSun, Sparkles, Globe
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
}

// Interactive Flight Widget Component
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
        
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-transparent to-indigo-500" />
        </div>
        
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
                <div className="text-xs text-gray-500">{flight.carbonEmissions} CO₂</div>
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
                <div className="relative w-full">
                  <div className="h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    ${isHovered ? 'animate-bounce' : ''}`}>
                    <ChevronRight className="w-5 h-5 text-blue-400" />
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
              
              <button className={`px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 
                text-white font-medium text-sm transition-all duration-300
                ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                Book Now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Interactive Hotel Widget Component
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
        
        <div className="relative h-48 overflow-hidden bg-gray-800">
          <div className={`absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10`} />
          {hotel.image ? (
            <img 
              src={hotel.image} 
              alt={hotel.name}
              className={`w-full h-full object-cover transition-all duration-700
                ${isHovered ? 'scale-110' : 'scale-100'}`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
              <Hotel className="w-16 h-16 text-white/20" />
            </div>
          )}
          
          <div className="absolute top-4 right-4 z-20">
            <div className={`px-3 py-1 rounded-full bg-black/50 backdrop-blur-xl border border-white/20
              ${isHovered ? 'animate-pulse' : ''}`}>
              <span className="text-xl font-bold text-white">{hotel.price}</span>
              <span className="text-xs text-gray-300 ml-1">/ night</span>
            </div>
          </div>
        </div>
        
        <div className="relative p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">{hotel.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{hotel.location}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`w-4 h-4 transition-all duration-300
                      ${i < Math.floor(rating) 
                        ? 'text-yellow-400 fill-current' 
                        : i < rating 
                          ? 'text-yellow-400 fill-current opacity-50'
                          : 'text-gray-600'}`}
                  />
                ))}
              </div>
              <span className="text-white font-semibold">{rating}</span>
              <span className="text-gray-500 text-sm">({hotel.reviews} reviews)</span>
            </div>
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
            text-white font-medium transition-all duration-300
            ${isHovered ? 'opacity-100' : 'opacity-80'}`}>
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Travel Chat UI Component
export default function TravelChatUI() {
  const { conversations, activeId, send, newConversation, selectConversation, deleteConversation } = useChatStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const activeConversation = conversations.find(c => c.id === activeId);
  const messages = activeConversation?.messages || [];
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Parse messages to extract widgets
  const parseMessage = useCallback((content: string) => {
    const widgets: Array<{ type: string; data: any }> = [];
    let textContent = content;
    
    // Extract hotel data with the specific format from the example
    const hotelRegex = /(\d+)\.\s\*\*([^*]+)\*\*\s(⭐\s[\d.]+)?\s*•?\s*\$?(\d+)\sper\snight\s*•?\s*(\d+)\sreviews\s*•?\s*\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = hotelRegex.exec(content)) !== null) {
      widgets.push({
        type: 'hotel',
        data: {
          name: match[2].trim(),
          rating: match[3]?.replace('⭐', '').trim() || '4.5',
          price: `$${match[4]}`,
          reviews: match[5],
          location: 'City Center',
          link: match[7]
        }
      });
    }
    
    // Extract flight data
    const flightRegex = /(\d+)\.\s\*\*([^*]+)\*\*\s-\s([^\n]+)(?:\n\s+•[^\n]+)+\n\s+•\s\[([^\]]+)\]\(([^)]+)\)/g;
    while ((match = flightRegex.exec(content)) !== null) {
      widgets.push({
        type: 'flight',
        data: {
          airline: match[3],
          price: match[2],
          departure: 'Departure City',
          arrival: 'Arrival City',
          departureTime: '10:00 AM',
          arrivalTime: '1:30 PM',
          duration: '3h 30m',
          stops: 'Nonstop',
          bookingLink: match[5]
        }
      });
    }
    
    // Remove widget text from content for cleaner display
    if (widgets.length > 0) {
      textContent = content
        .replace(hotelRegex, '')
        .replace(flightRegex, '')
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
    await send(input);
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
      
      {/* Sidebar */}
      <aside className={`relative z-10 ${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 
        bg-gray-900/80 backdrop-blur-xl border-r border-gray-800 overflow-hidden`}>
        <div className="p-4 h-full flex flex-col">
          <button 
            onClick={newConversation}
            className="flex items-center justify-center gap-2 w-full p-3 rounded-xl
              bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
              text-white font-medium transition-all duration-300 transform hover:scale-105 mb-4"
          >
            <Sparkles className="w-5 h-5" />
            <span>New Adventure</span>
          </button>
          
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {conversations.map((conv) => (
              <div key={conv.id} className="group flex items-center gap-2">
                <button
                  onClick={() => selectConversation(conv.id)}
                  className={`flex-1 p-3 rounded-lg text-left transition-all duration-300
                    ${conv.id === activeId 
                      ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-white' 
                      : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'}`}
                >
                  {conv.title}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300
                    hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
      
      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center mb-12">
                <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text 
                  bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
                  Travel Bot
                </h1>
                <p className="text-xl text-gray-400">Where would you like to explore today?</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(prompt.text)}
                    className="group relative overflow-hidden p-6 rounded-2xl
                      bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl
                      border border-gray-700/50 hover:border-gray-600/50
                      transition-all duration-500 transform hover:scale-105"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${prompt.color} opacity-0 
                      group-hover:opacity-10 transition-opacity duration-500`} />
                    <div className="relative flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${prompt.color} bg-opacity-20`}>
                        <prompt.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-left text-gray-300 group-hover:text-white transition-colors">
                        {prompt.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, idx) => {
                const { textContent, widgets } = parseMessage(msg.content);
                
                return (
                  <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-[70%] p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {textContent && (
                          <div className="p-4 rounded-2xl bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 text-gray-300">
                            {textContent}
                          </div>
                        )}
                        
                        {widgets.length > 0 && (
                          <div className="grid gap-4">
                            {widgets.map((widget, widgetIdx) => {
                              if (widget.type === 'flight') {
                                return <FlightWidget key={widgetIdx} flight={widget.data} index={widgetIdx} />;
                              } else if (widget.type === 'hotel') {
                                return <HotelWidget key={widgetIdx} hotel={widget.data} index={widgetIdx} />;
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
                  <span>Travel Assistant is thinking...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t border-gray-800 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about flights, hotels, restaurants, or destinations..."
                className="w-full px-6 py-4 pr-14 rounded-2xl
                  bg-gray-800/50 backdrop-blur-xl border border-gray-700/50
                  text-white placeholder-gray-500
                  focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20
                  transition-all duration-300"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl
                  transition-all duration-300 transform
                  ${input.trim() && !isTyping
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-110 cursor-pointer' 
                    : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}