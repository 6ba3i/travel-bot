import React, { useState, useEffect, useRef } from 'react';
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

const MyTravels: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<TripStep['type']>('welcome');
  const [tripData, setTripData] = useState<TripData>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [, setFlights] = useState<any[]>([]);
  const [, setReturnFlights] = useState<any[]>([]);
  const [, setHotels] = useState<any[]>([]);
  const [pois, setPois] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedPOIs, setSelectedPOIs] = useState<Set<string>>(new Set());
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (currentStep === 'welcome') {
      addBotMessage("✈️ Let's work on your new trip! Where would you like to go and from where?");
    }
  }, []);
  
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
        useDeepseek: true 
      })
    });
    
    if (!response.ok) throw new Error('API call failed');
    const data = await response.json();
    return data.choices[0].message.content;
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
  
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userInput = input.trim();
    setInput('');
    addUserMessage(userInput);
    
    if (currentStep === 'destination') {
      const parts = userInput.toLowerCase().split(' to ');
      if (parts.length === 2) {
        const from = parts[0].replace('from ', '').trim();
        const to = parts[1].trim();
        setTripData(prev => ({ ...prev, from, to }));
        setCurrentStep('dates');
        addBotMessage(`Great! ${to} from ${from}. When do you want to travel? (departure and return dates)`);
      } else {
        addBotMessage("Please specify both origin and destination, e.g., 'from New York to Paris'");
      }
    }
    
    else if (currentStep === 'dates') {
      const dateParts = userInput.split(' to ');
      if (dateParts.length === 2) {
        setTripData(prev => ({ 
          ...prev, 
          departDate: dateParts[0].trim(),
          returnDate: dateParts[1].trim()
        }));
        setCurrentStep('budget');
        addBotMessage("What's your total budget for this trip? (in USD)");
      } else {
        setTripData(prev => ({ ...prev, departDate: userInput }));
        setCurrentStep('budget');
        addBotMessage("What's your budget for this trip? (in USD)");
      }
    }
    
    else if (currentStep === 'budget') {
      const budget = parseInt(userInput.replace(/\D/g, ''));
      setTripData(prev => ({ ...prev, budget }));
      await searchFlights();
    }
  };
  
  const searchFlights = async () => {
    setLoading(true);
    setCurrentStep('flights');
    
    try {
      const response = await callChatAPI(
        `Find flights from ${tripData.from} to ${tripData.to} on ${tripData.departDate}`
      );
      
      const { widgets } = parseWidgetsFromResponse(response);
      const flightWidgets = widgets.filter(w => w.type === 'flight');
      
      if (flightWidgets.length > 0) {
        const flightData = flightWidgets.map(w => w.data);
        setFlights(flightData);
        
        addBotMessage(
          `Here are the available flights to ${tripData.to}. Choose the one that suits you best:`,
          flightWidgets
        );
      } else {
        addBotMessage("No flights found. Please try different dates or destinations.");
      }
    } catch (error) {
      console.error('Error searching flights:', error);
      addBotMessage("Sorry, there was an error searching for flights. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const selectFlight = async (flight: any) => {
    setTripData(prev => ({ ...prev, selectedFlight: flight }));
    addUserMessage(`Selected: ${flight.airline} - ${flight.price}`);
    
    setLoading(true);
    
    try {
      const response = await callChatAPI(
        `Find return flights from ${tripData.to} to ${tripData.from} on ${tripData.returnDate || 'flexible return date'}`
      );
      
      const { widgets } = parseWidgetsFromResponse(response);
      const flightWidgets = widgets.filter(w => w.type === 'flight');
      
      if (flightWidgets.length > 0) {
        const flightData = flightWidgets.map(w => w.data);
        setReturnFlights(flightData);
        
        addBotMessage(
          'Now choose your return flight:',
          flightWidgets
        );
      } else {
        await searchHotels();
      }
    } catch (error) {
      console.error('Error searching return flights:', error);
      await searchHotels();
    } finally {
      setLoading(false);
    }
  };
  
  const selectReturnFlight = async (flight: any) => {
    setTripData(prev => ({ ...prev, selectedReturnFlight: flight }));
    addUserMessage(`Selected return: ${flight.airline} - ${flight.price}`);
    await searchHotels();
  };
  
  const searchHotels = async () => {
    setLoading(true);
    setCurrentStep('hotels');
    
    try {
      const flightCost = extractPrice(tripData.selectedFlight?.price || '$0') + 
                        extractPrice(tripData.selectedReturnFlight?.price || '$0');
      const remainingBudget = (tripData.budget || 2000) - flightCost;
      const hotelBudget = Math.floor(remainingBudget * 0.5);
      
      const response = await callChatAPI(
        `Find hotels in ${tripData.to} under $${Math.floor(hotelBudget / 5)} per night`
      );
      
      const { widgets } = parseWidgetsFromResponse(response);
      const hotelWidgets = widgets.filter(w => w.type === 'hotel');
      
      if (hotelWidgets.length > 0) {
        const hotelData = hotelWidgets.map(w => w.data);
        setHotels(hotelData);
        
        addBotMessage(
          `Based on your budget (remaining: $${remainingBudget}, recommended hotel budget: $${hotelBudget}), here are some hotels:`,
          hotelWidgets
        );
      } else {
        addBotMessage("No hotels found in your budget range. Let me search for alternatives...");
        const alternativeResponse = await callChatAPI(
          `Find any hotels in ${tripData.to}`
        );
        const { widgets: altWidgets } = parseWidgetsFromResponse(alternativeResponse);
        const altHotelWidgets = altWidgets.filter(w => w.type === 'hotel');
        
        if (altHotelWidgets.length > 0) {
          setHotels(altHotelWidgets.map(w => w.data));
          addBotMessage("Here are some hotel options:", altHotelWidgets);
        }
      }
    } catch (error) {
      console.error('Error searching hotels:', error);
      addBotMessage("Sorry, there was an error searching for hotels. Continuing to attractions...");
      await searchPOIs();
    } finally {
      setLoading(false);
    }
  };
  
  const selectHotel = async (hotel: any) => {
    setTripData(prev => ({ ...prev, selectedHotel: hotel }));
    addUserMessage(`Selected hotel: ${hotel.name} - ${hotel.price}`);
    await searchPOIs();
  };
  
  const searchPOIs = async () => {
    setLoading(true);
    setCurrentStep('pois');
    
    try {
      const response = await callChatAPI(
        `Find top tourist attractions and points of interest in ${tripData.to}`
      );
      
      const { widgets } = parseWidgetsFromResponse(response);
      const poiWidgets = widgets.filter(w => w.type === 'poi');
      
      if (poiWidgets.length > 0) {
        const poiData = poiWidgets.map(w => w.data);
        setPois(poiData);
        
        addBotMessage(
          `Here are the top attractions in ${tripData.to}. Check the ones you'd like to visit:`,
          poiWidgets
        );
      } else {
        addBotMessage("No attractions found. Let me search for restaurants instead...");
        await searchRestaurants();
      }
    } catch (error) {
      console.error('Error searching POIs:', error);
      await searchRestaurants();
    } finally {
      setLoading(false);
    }
  };
  
  const handlePOISelection = () => {
    const selected = Array.from(selectedPOIs).map(id => pois.find(p => p.name === id)).filter(Boolean);
    setTripData(prev => ({ ...prev, selectedPOIs: selected }));
    addUserMessage(`Selected attractions: ${selected.map(p => p.name).join(', ')}`);
    searchRestaurants();
  };
  
  const searchRestaurants = async () => {
    setLoading(true);
    setCurrentStep('restaurants');
    
    try {
      const response = await callChatAPI(
        `Find best restaurants in ${tripData.to} within budget`
      );
      
      const { widgets } = parseWidgetsFromResponse(response);
      const restaurantWidgets = widgets.filter(w => w.type === 'restaurant');
      
      if (restaurantWidgets.length > 0) {
        const restaurantData = restaurantWidgets.map(w => w.data);
        setRestaurants(restaurantData);
        
        addBotMessage(
          `Here are recommended restaurants within your budget. Check the ones you'd like to try:`,
          restaurantWidgets
        );
      } else {
        await showWeather();
      }
    } catch (error) {
      console.error('Error searching restaurants:', error);
      await showWeather();
    } finally {
      setLoading(false);
    }
  };
  
  const handleRestaurantSelection = async () => {
    const selected = Array.from(selectedRestaurants).map(id => restaurants.find(r => r.name === id)).filter(Boolean);
    setTripData(prev => ({ ...prev, selectedRestaurants: selected }));
    addUserMessage(`Selected restaurants: ${selected.map(r => r.name).join(', ')}`);
    await showWeather();
  };
  
  const showWeather = async () => {
    setLoading(true);
    setCurrentStep('weather');
    
    try {
      const response = await callChatAPI(
        `What's the weather forecast in ${tripData.to} for next week?`
      );
      
      const { widgets } = parseWidgetsFromResponse(response);
      const weatherWidget = widgets.find(w => w.type === 'weather');
      
      if (weatherWidget) {
        setTripData(prev => ({ ...prev, weather: weatherWidget.data }));
        addBotMessage(
          `Here's the weather forecast for ${tripData.to} during your trip:`,
          [weatherWidget]
        );
      }
      
      setTimeout(() => {
        setCurrentStep('summary');
        showSummary();
      }, 2000);
    } catch (error) {
      console.error('Error getting weather:', error);
      setCurrentStep('summary');
      showSummary();
    } finally {
      setLoading(false);
    }
  };
  
  const extractPrice = (priceString: string): number => {
    const match = priceString.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };
  
  const calculateTotalCost = () => {
    let total = 0;
    total += extractPrice(tripData.selectedFlight?.price || '$0');
    total += extractPrice(tripData.selectedReturnFlight?.price || '$0');
    
    if (tripData.selectedHotel && tripData.departDate && tripData.returnDate) {
      const nights = 5;
      total += extractPrice(tripData.selectedHotel.price) * nights;
    }
    
    tripData.selectedPOIs?.forEach(poi => {
      total += extractPrice(poi.price || '$0');
    });
    
    total += tripData.selectedRestaurants?.length ? tripData.selectedRestaurants.length * 50 : 0;
    
    return total;
  };
  
  const showSummary = () => {
    const totalCost = calculateTotalCost();
    const summary = `
🎉 **Your Trip to ${tripData.to} is Ready!**

**Flight Details:**
• Outbound: ${tripData.selectedFlight?.airline || 'Not selected'} - ${tripData.selectedFlight?.price || 'N/A'}
  ${tripData.selectedFlight?.departure || ''} → ${tripData.selectedFlight?.arrival || ''}
  ${tripData.selectedFlight?.departureTime || ''} - ${tripData.selectedFlight?.arrivalTime || ''}
  
${tripData.selectedReturnFlight ? `• Return: ${tripData.selectedReturnFlight.airline} - ${tripData.selectedReturnFlight.price}
  ${tripData.selectedReturnFlight.departure} → ${tripData.selectedReturnFlight.arrival}
  ${tripData.selectedReturnFlight.departureTime} - ${tripData.selectedReturnFlight.arrivalTime}` : '• One-way trip'}

**Accommodation:**
${tripData.selectedHotel ? `${tripData.selectedHotel.name} - ${tripData.selectedHotel.price}` : 'Not selected'}

**Attractions:**
${tripData.selectedPOIs?.length ? tripData.selectedPOIs.map(p => `• ${p.name} (${p.price || 'Free'})`).join('\n') : 'None selected'}

**Restaurants:**
${tripData.selectedRestaurants?.length ? tripData.selectedRestaurants.map(r => `• ${r.name} (${r.cuisine || ''}, ${r.priceLevel || ''})`).join('\n') : 'None selected'}

**Total Estimated Cost:** $${totalCost}
**Remaining Budget:** $${Math.max(0, (tripData.budget || 0) - totalCost)}
    `;
    
    addBotMessage(summary);
    saveTripToSidebar();
  };
  
  const saveTripToSidebar = () => {
    const tripName = `${tripData.to} Trip`;
    localStorage.setItem(`trip_${Date.now()}`, JSON.stringify({
      name: tripName,
      data: tripData,
      createdAt: new Date()
    }));
  };
  
  const exportToPDF = () => {
    const pdf = new jsPDF();
    
    pdf.setFontSize(20);
    pdf.text(`Your Trip to ${tripData.to}`, 20, 20);
    
    pdf.setFontSize(14);
    pdf.text('Flight Details', 20, 40);
    pdf.setFontSize(10);
    
    if (tripData.selectedFlight) {
      pdf.text(`Outbound: ${tripData.selectedFlight.airline} - ${tripData.selectedFlight.price}`, 20, 50);
      pdf.text(`${tripData.selectedFlight.departure} to ${tripData.selectedFlight.arrival}`, 20, 55);
      pdf.text(`Time: ${tripData.selectedFlight.departureTime} - ${tripData.selectedFlight.arrivalTime}`, 20, 60);
    }
    
    if (tripData.selectedReturnFlight) {
      pdf.text(`Return: ${tripData.selectedReturnFlight.airline} - ${tripData.selectedReturnFlight.price}`, 20, 70);
      pdf.text(`${tripData.selectedReturnFlight.departure} to ${tripData.selectedReturnFlight.arrival}`, 20, 75);
      pdf.text(`Time: ${tripData.selectedReturnFlight.departureTime} - ${tripData.selectedReturnFlight.arrivalTime}`, 20, 80);
    }
    
    if (tripData.selectedHotel) {
      pdf.setFontSize(14);
      pdf.text('Accommodation', 20, 95);
      pdf.setFontSize(10);
      pdf.text(`${tripData.selectedHotel.name} - ${tripData.selectedHotel.price}`, 20, 105);
      pdf.text(`Location: ${tripData.selectedHotel.location || 'N/A'}`, 20, 110);
    }
    
    if (tripData.selectedPOIs?.length) {
      pdf.setFontSize(14);
      pdf.text('Attractions', 20, 125);
      pdf.setFontSize(10);
      tripData.selectedPOIs.forEach((poi, idx) => {
        pdf.text(`• ${poi.name} (${poi.price || 'Free'})`, 20, 135 + (idx * 5));
      });
    }
    
    if (tripData.selectedRestaurants?.length) {
      pdf.setFontSize(14);
      const yPos = 135 + (tripData.selectedPOIs?.length || 0) * 5 + 10;
      pdf.text('Restaurants', 20, yPos);
      pdf.setFontSize(10);
      tripData.selectedRestaurants.forEach((restaurant, idx) => {
        pdf.text(`• ${restaurant.name} (${restaurant.cuisine || ''})`, 20, yPos + 10 + (idx * 5));
      });
    }
    
    pdf.setFontSize(12);
    const finalY = 200;
    pdf.text(`Total Estimated Cost: $${calculateTotalCost()}`, 20, finalY);
    pdf.text(`Budget Remaining: $${Math.max(0, (tripData.budget || 0) - calculateTotalCost())}`, 20, finalY + 7);
    
    pdf.save(`${tripData.to}_trip.pdf`);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const formatFlightTime = (time: string): string => {
    if (!time || time === 'N/A' || time === 'Check airline') return time;
    
    try {
      if (/^\d{2}:\d{2}$/.test(time)) return time;
      
      const date = new Date(time);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      const isNextDay = time.includes('+1') || time.toLowerCase().includes('next day');
      
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
  
  const FlightWidgetWithSelect = ({ flight, onSelect }: any) => (
    <div className="flight-widget my-travels-widget bg-white rounded-lg shadow-lg p-6 mb-4" style={{ width: '1200px' }}>
      <button 
        onClick={() => onSelect(flight)}
        className="absolute top-4 right-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90"
      >
        Choose This Flight
      </button>
      
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
      
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>{flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</span>
        {flight.carbonEmissions && <span>CO₂: {flight.carbonEmissions}</span>}
      </div>
    </div>
  );
  
  const HotelWidgetWithSelect = ({ hotel, onSelect }: any) => (
    <div className="hotel-widget my-travels-widget bg-white rounded-lg shadow-lg overflow-hidden">
      {hotel.image && (
        <img 
          src={getHighQualityImage(hotel.image)} 
          alt={hotel.name}
          className="w-full h-64 object-cover"
        />
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
                    i < Math.floor(hotel.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({hotel.reviews || 0} reviews)</span>
          </div>
        )}
        
        <div className="text-2xl font-bold text-green-600 mb-2">{hotel.price}</div>
        
        {hotel.location && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
            <MapPin className="w-4 h-4" />
            {hotel.location}
          </div>
        )}
        
        <button 
          onClick={() => onSelect(hotel)}
          className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90"
        >
          Choose This Hotel
        </button>
      </div>
    </div>
  );
  
  const POIWidgetWithCheckbox = ({ poi, checked, onCheck }: any) => (
    <div className="poi-widget my-travels-widget bg-white rounded-lg shadow-lg overflow-hidden relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheck(poi.name, e.target.checked)}
        className="absolute top-4 right-4 w-6 h-6 accent-indigo-600 cursor-pointer z-10"
      />
      
      {poi.image && (
        <img 
          src={getHighQualityImage(poi.image)} 
          alt={poi.name}
          className="w-full h-64 object-cover"
        />
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
                    i < Math.floor(poi.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({poi.reviews || 0})</span>
          </div>
        )}
        
        {poi.price && <div className="text-lg font-bold text-green-600">{poi.price}</div>}
      </div>
    </div>
  );
  
  const RestaurantWidgetWithCheckbox = ({ restaurant, checked, onCheck }: any) => (
    <div className="restaurant-widget my-travels-widget bg-white rounded-lg shadow-lg overflow-hidden relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheck(restaurant.name, e.target.checked)}
        className="absolute top-4 right-4 w-6 h-6 accent-indigo-600 cursor-pointer z-10"
      />
      
      {restaurant.image && (
        <img 
          src={getHighQualityImage(restaurant.image)} 
          alt={restaurant.name}
          className="w-full h-64 object-cover"
        />
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
                    i < Math.floor(restaurant.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({restaurant.reviews || 0})</span>
          </div>
        )}
        
        {restaurant.priceLevel && <div className="text-lg font-bold text-green-600">{restaurant.priceLevel}</div>}
      </div>
    </div>
  );
  
  const WeatherWidget = ({ weather }: any) => (
    <div className="weather-widget bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
      <h3 className="text-2xl font-bold mb-4">{weather.location}</h3>
      
      <div className="bg-white/20 backdrop-blur-lg rounded-lg p-4 mb-4">
        <div className="text-4xl font-bold">{weather.current?.temp}°</div>
        <div className="text-lg">{weather.current?.condition}</div>
        <div className="flex gap-4 mt-2 text-sm">
          <span>💧 {weather.current?.humidity}%</span>
          <span>💨 {weather.current?.windSpeed} km/h</span>
        </div>
      </div>
      
      {weather.forecast && (
        <div className="grid grid-cols-7 gap-2">
          {weather.forecast.slice(0, 7).map((day: any, idx: number) => (
            <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-lg p-2 text-center">
              <div className="text-xs">{day.day}</div>
              <div className="text-lg my-1">{day.icon === 'sun' ? '☀️' : day.icon === 'cloud' ? '☁️' : '🌧️'}</div>
              <div className="text-sm font-bold">{day.high}°</div>
              <div className="text-xs">{day.low}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900">
      <div className="w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 flex flex-col">
        <div className="p-4 border-b border-gray-800/50">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </button>
          
          <h2 className="text-xl font-bold text-white">My Trips</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {currentStep === 'summary' && tripData.to && (
            <div className="p-4 bg-indigo-600/20 border border-indigo-600/50 rounded-lg mb-4">
              <h3 className="text-white font-medium mb-2">{tripData.to} Trip</h3>
              <p className="text-xs text-gray-400 mb-3">
                {tripData.departDate} - {tripData.returnDate || 'One way'}
              </p>
              <button
                onClick={exportToPDF}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Previous Trips</div>
            {Object.keys(localStorage)
              .filter(key => key.startsWith('trip_'))
              .map(key => {
                const trip = JSON.parse(localStorage.getItem(key) || '{}');
                return (
                  <div key={key} className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 cursor-pointer">
                    <div className="text-white font-medium text-sm">{trip.name}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(trip.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            {Object.keys(localStorage).filter(key => key.startsWith('trip_')).length === 0 && (
              <p className="text-gray-500 text-sm">No previous trips yet</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-800/50 bg-black/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Plan Your Trip</h1>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {messages.map((message, idx) => (
              <div key={idx} className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-4xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                  {message.content && (
                    <div className={`inline-block p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 text-gray-200'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  )}
                  
                  {message.widgets && message.widgets.length > 0 && (
                    <div className="mt-4">
                      {message.widgets.filter((w: any) => w.type === 'flight').map((widget: any, widgetIdx: number) => (
                        <FlightWidgetWithSelect
                          key={widgetIdx}
                          flight={widget.data}
                          onSelect={currentStep === 'flights' && !tripData.selectedFlight ? selectFlight : selectReturnFlight}
                        />
                      ))}
                      
                      {message.widgets.filter((w: any) => w.type === 'hotel').length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {message.widgets.filter((w: any) => w.type === 'hotel').map((widget: any, widgetIdx: number) => (
                            <HotelWidgetWithSelect
                              key={widgetIdx}
                              hotel={widget.data}
                              onSelect={selectHotel}
                            />
                          ))}
                        </div>
                      )}
                      
                      {message.widgets.filter((w: any) => w.type === 'poi').length > 0 && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {message.widgets.filter((w: any) => w.type === 'poi').map((widget: any, widgetIdx: number) => (
                              <POIWidgetWithCheckbox
                                key={widgetIdx}
                                poi={widget.data}
                                checked={selectedPOIs.has(widget.data.name)}
                                onCheck={(name: string, checked: boolean) => {
                                  const newSet = new Set(selectedPOIs);
                                  if (checked) newSet.add(name);
                                  else newSet.delete(name);
                                  setSelectedPOIs(newSet);
                                }}
                              />
                            ))}
                          </div>
                          {currentStep === 'pois' && (
                            <button
                              onClick={handlePOISelection}
                              disabled={selectedPOIs.size === 0}
                              className="mt-6 mx-auto block px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                            >
                              Done Selecting Attractions
                            </button>
                          )}
                        </>
                      )}
                      
                      {message.widgets.filter((w: any) => w.type === 'restaurant').length > 0 && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {message.widgets.filter((w: any) => w.type === 'restaurant').map((widget: any, widgetIdx: number) => (
                              <RestaurantWidgetWithCheckbox
                                key={widgetIdx}
                                restaurant={widget.data}
                                checked={selectedRestaurants.has(widget.data.name)}
                                onCheck={(name: string, checked: boolean) => {
                                  const newSet = new Set(selectedRestaurants);
                                  if (checked) newSet.add(name);
                                  else newSet.delete(name);
                                  setSelectedRestaurants(newSet);
                                }}
                              />
                            ))}
                          </div>
                          {currentStep === 'restaurants' && (
                            <button
                              onClick={handleRestaurantSelection}
                              disabled={selectedRestaurants.size === 0}
                              className="mt-6 mx-auto block px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                            >
                              Done Selecting Restaurants
                            </button>
                          )}
                        </>
                      )}
                      
                      {message.widgets.filter((w: any) => w.type === 'weather').map((widget: any, widgetIdx: number) => (
                        <WeatherWidget key={widgetIdx} weather={widget.data} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start mb-6">
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className="text-gray-400">Searching with live data...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {currentStep !== 'summary' && (
          <div className="border-t border-gray-800/50 bg-black/20 backdrop-blur-xl p-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    currentStep === 'welcome' || currentStep === 'destination' ? "e.g., 'From New York to Paris'" :
                    currentStep === 'dates' ? "e.g., 'August 19 to August 26' or '2024-08-19 to 2024-08-26'" :
                    currentStep === 'budget' ? "e.g., '$2000' or '2000'" :
                    "Type your message..."
                  }
                  className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700/50 rounded-xl
                    text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50
                    transition-colors backdrop-blur-xl"
                  disabled={loading || ['flights', 'hotels', 'pois', 'restaurants', 'weather', 'summary'].includes(currentStep)}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600
                    text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTravels;