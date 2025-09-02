import { useState, useEffect, useRef, FC } from 'react';
import { 
  Send, Sparkles, ArrowLeft, Download, Plane, MapPin, Loader2, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

interface TripStep {
  type: 'welcome' | 'destination' | 'dates' | 'budget' | 'flights' | 'hotels' | 'pois' | 'restaurants' | 'weather' | 'summary';
  completed: boolean;
}

interface TripData {
  from?: string;
  to?: string;
  departDate?: string;
  returnDate?: string;
  budget?: number;
  selectedFlight?: any;
  selectedReturnFlight?: any;
  selectedHotel?: any;
  selectedPOIs?: any[];
  selectedRestaurants?: any[];
  weather?: any;
}

const MyTravels: FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<TripStep['type']>('welcome');
  const [tripData, setTripData] = useState<TripData>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [returnFlights, setReturnFlights] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [pois, setPois] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedPOIs, setSelectedPOIs] = useState<Set<string>>(new Set());
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (!hasInitialized.current && currentStep === 'welcome') {
      hasInitialized.current = true;
      addBotMessage("✈️ Let's work on your new trip! Where would you like to go and from where?");
    }
  }, [currentStep]);
  
  const addBotMessage = (content: string, widgets?: any[]) => {
    setMessages(prev => [...prev, { 
      role: 'bot', 
      content, 
      widgets: widgets || [],
      timestamp: new Date()
    }]);
  };
  
  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { 
      role: 'user', 
      content,
      timestamp: new Date()
    }]);
  };
  
  const callChatAPI = async (message: string) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message,
        language: 'en',
        sessionId: `travel-${Date.now()}`
      })
    });
    
    if (!response.ok) throw new Error('API call failed');
    const data = await response.json();
    return data.response || data.message || '';
  };
  
  const parseWidgetsFromResponse = (content: string) => {
    const widgets: any[] = [];
    let textContent = content;
    
    const patterns = [
      { type: 'flight', pattern: /\[FLIGHT_WIDGET\](.*?)\[\/FLIGHT_WIDGET\]/gs },
      { type: 'hotel', pattern: /\[HOTEL_WIDGET\](.*?)\[\/HOTEL_WIDGET\]/gs },
      { type: 'poi', pattern: /\[POI_WIDGET\](.*?)\[\/POI_WIDGET\]/gs },
      { type: 'restaurant', pattern: /\[RESTAURANT_WIDGET\](.*?)\[\/RESTAURANT_WIDGET\]/gs },
      { type: 'weather', pattern: /\[WEATHER_WIDGET\](.*?)\[\/WEATHER_WIDGET\]/gs }
    ];
    
    patterns.forEach(({ type, pattern }) => {
      const matches = [...content.matchAll(pattern)];
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
  
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userInput = input.trim();
    setInput('');
    addUserMessage(userInput);
    setLoading(true);
    
    try {
      switch(currentStep) {
        case 'welcome':
        case 'destination': {
          const locationMatch = userInput.match(/from\s+(\w+)\s+to\s+(\w+)/i) ||
                              userInput.match(/(\w+)\s+to\s+(\w+)/i);
          
          if (locationMatch) {
            setTripData(prev => ({
              ...prev,
              from: locationMatch[1],
              to: locationMatch[2]
            }));
            
            addBotMessage(`Great! Planning a trip from ${locationMatch[1]} to ${locationMatch[2]}. What are your travel dates?`);
            setCurrentStep('dates');
          } else {
            addBotMessage("Please specify your trip like: 'From New York to Paris' or 'London to Tokyo'");
          }
          break;
        }
        
        case 'dates': {
          const dates = userInput.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g);
          
          if (dates && dates.length >= 2) {
            setTripData(prev => ({
              ...prev,
              departDate: dates[0],
              returnDate: dates[1]
            }));
            
            addBotMessage(`Perfect! Departing ${dates[0]} and returning ${dates[1]}. What's your budget per person?`);
            setCurrentStep('budget');
          } else {
            addBotMessage("Please provide departure and return dates, like: '12/15/2024 to 12/22/2024'");
          }
          break;
        }
        
        case 'budget': {
          const budgetMatch = userInput.match(/\$?(\d+)/);
          
          if (budgetMatch) {
            const budget = parseInt(budgetMatch[1]);
            setTripData(prev => ({ ...prev, budget }));
            
            addBotMessage(`Budget set to $${budget}. Searching for flights...`);
            setCurrentStep('flights');
            
            // Search for flights
            const flightQuery = `flights from ${tripData.from} to ${tripData.to} on ${tripData.departDate}`;
            const flightResponse = await callChatAPI(flightQuery);
            const { widgets: flightWidgets } = parseWidgetsFromResponse(flightResponse);
            
            if (flightWidgets.length > 0) {
              const flightData = flightWidgets.filter(w => w.type === 'flight').map(w => w.data);
              setFlights(flightData);
              addBotMessage("Here are the available flights. Select one for your outbound journey:", flightWidgets);
            } else {
              addBotMessage("I couldn't find specific flights. Let's move on to hotels.");
              setCurrentStep('hotels');
            }
          } else {
            addBotMessage("Please enter your budget, like: '$2000' or '1500'");
          }
          break;
        }
        
        case 'flights': {
          if (userInput.toLowerCase().includes('select') || userInput.toLowerCase().includes('skip')) {
            addBotMessage("Searching for hotels at your destination...");
            setCurrentStep('hotels');
            
            // Search for hotels
            const hotelQuery = `hotels in ${tripData.to} for ${tripData.departDate}`;
            const hotelResponse = await callChatAPI(hotelQuery);
            const { widgets: hotelWidgets } = parseWidgetsFromResponse(hotelResponse);
            
            if (hotelWidgets.length > 0) {
              const hotelData = hotelWidgets.filter(w => w.type === 'hotel').map(w => w.data);
              setHotels(hotelData);
              addBotMessage("Here are some great hotels. Select where you'd like to stay:", hotelWidgets);
            }
          }
          break;
        }
        
        case 'hotels': {
          addBotMessage("Finding top attractions at your destination...");
          setCurrentStep('pois');
          
          // Search for POIs
          const poiQuery = `top attractions in ${tripData.to}`;
          const poiResponse = await callChatAPI(poiQuery);
          const { widgets: poiWidgets } = parseWidgetsFromResponse(poiResponse);
          
          if (poiWidgets.length > 0) {
            const poiData = poiWidgets.filter(w => w.type === 'poi').map(w => w.data);
            setPois(poiData);
            addBotMessage("Here are the must-see attractions:", poiWidgets);
          }
          break;
        }
        
        case 'pois': {
          addBotMessage("Looking for great restaurants...");
          setCurrentStep('restaurants');
          
          // Search for restaurants
          const restaurantQuery = `best restaurants in ${tripData.to}`;
          const restaurantResponse = await callChatAPI(restaurantQuery);
          const { widgets: restaurantWidgets } = parseWidgetsFromResponse(restaurantResponse);
          
          if (restaurantWidgets.length > 0) {
            const restaurantData = restaurantWidgets.filter(w => w.type === 'restaurant').map(w => w.data);
            setRestaurants(restaurantData);
            addBotMessage("Here are top-rated restaurants:", restaurantWidgets);
          }
          break;
        }
        
        case 'restaurants': {
          addBotMessage("Checking the weather forecast...");
          setCurrentStep('weather');
          
          // Get weather
          const weatherQuery = `weather in ${tripData.to} next week`;
          const weatherResponse = await callChatAPI(weatherQuery);
          const { widgets: weatherWidgets } = parseWidgetsFromResponse(weatherResponse);
          
          if (weatherWidgets.length > 0) {
            addBotMessage("Here's the weather forecast:", weatherWidgets);
          }
          
          setTimeout(() => {
            setCurrentStep('summary');
            addBotMessage("🎉 Your trip planning is complete! Here's your summary:");
          }, 2000);
          break;
        }
        
        default:
          // Handle general queries
          const response = await callChatAPI(userInput);
          const { textContent, widgets } = parseWidgetsFromResponse(response);
          
          if (textContent || widgets.length > 0) {
            addBotMessage(textContent, widgets);
          }
      }
    } catch (error) {
      console.error('Error:', error);
      addBotMessage("Sorry, there was an error processing your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const generatePDF = () => {
    const pdf = new jsPDF();
    
    // Title
    pdf.setFontSize(20);
    pdf.text('Travel Itinerary', 20, 20);
    
    // Trip details
    pdf.setFontSize(12);
    pdf.text(`From: ${tripData.from || 'N/A'}`, 20, 40);
    pdf.text(`To: ${tripData.to || 'N/A'}`, 20, 50);
    pdf.text(`Dates: ${tripData.departDate || 'N/A'} - ${tripData.returnDate || 'N/A'}`, 20, 60);
    pdf.text(`Budget: $${tripData.budget || 'N/A'}`, 20, 70);
    
    // Add more details...
    
    pdf.save('travel-itinerary.pdf');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex">
      <div className="w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 p-6">
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-6">Trip Planner</h2>
        
        <div className="space-y-4">
          {['destination', 'dates', 'budget', 'flights', 'hotels', 'pois', 'restaurants', 'weather', 'summary'].map((step) => (
            <div
              key={step}
              className={`p-3 rounded-lg transition-all ${
                currentStep === step 
                  ? 'bg-indigo-600/20 border border-indigo-600/50 text-white' 
                  : 'bg-gray-800/30 text-gray-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  currentStep === step ? 'bg-indigo-500' : 'bg-gray-600'
                }`} />
                <span className="capitalize">{step}</span>
              </div>
            </div>
          ))}
        </div>
        
        {currentStep === 'summary' && (
          <button
            onClick={generatePDF}
            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 
              text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Itinerary
          </button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 text-gray-200'
                }`}>
                  {msg.content}
                  
                  {msg.widgets && msg.widgets.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {msg.widgets.map((widget: any, widgetIdx: number) => (
                        <div key={widgetIdx} className="bg-gray-900/50 p-4 rounded-lg">
                          {/* Render widget based on type */}
                          <pre className="text-xs">{JSON.stringify(widget.data, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 p-4 rounded-2xl">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-800/50">
          <div className="max-w-4xl mx-auto flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your response..."
              className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg
                text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg
                font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTravels;