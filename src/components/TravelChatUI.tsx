import { useState, useEffect, useRef, useCallback, FC } from 'react';
import { 
  Send, Plus, Trash2, Globe, ChevronDown, 
  Plane, MapPin, Star,
  Cloud, Droplets, Wind,
  Utensils,
  User, Map, Hotel, TreePine, Sparkles, MessageSquare, Search
} from 'lucide-react';
import { useChatStore } from '../store/useChat';
import './TravelChatUI.css';

// Types
interface Widget {
  type: 'flight' | 'hotel' | 'poi' | 'restaurant' | 'weather';
  data: any;
}

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

type LanguageCode = 'en' | 'fr' | 'zh' | 'ar' | 'es';

// Translation strings
const TRANSLATIONS: Record<LanguageCode, any> = {
  en: {
    newChat: 'New Chat',
    placeholder: 'Ask me about flights, hotels, or destinations...',
    send: 'Send',
    today: 'Today',
    chats: 'Chats',
    searchChats: 'Search conversations...',
    reviews: 'reviews',
    perNight: 'per night',
    book: 'Book',
    viewOnMap: 'View on Map',
    visitWebsite: 'Visit Website',
    call: 'Call',
    weather: 'Weather',
    humidity: 'Humidity',
    wind: 'Wind',
    precipitation: 'Precip',
    myAccount: 'My Account',
    myTravels: 'My Travels',
    welcomeTitle: 'Where would you like to explore today?',
    welcomeSubtitle: 'I can help you find flights, hotels, restaurants, and plan your perfect trip.',
    examplePrompts: {
      flights: 'Find flights to Barcelona',
      hotels: 'Hotels in Paris under $200',
      pois: 'Top attractions in Tokyo',
      restaurants: 'Italian restaurants in Rome',
      weather: 'Weather in Dubai next week'
    }
  },
  fr: {
    newChat: 'Nouvelle Discussion',
    placeholder: 'Demandez-moi des vols, hôtels, ou destinations...',
    send: 'Envoyer',
    today: "Aujourd'hui",
    chats: 'Discussions',
    searchChats: 'Rechercher des conversations...',
    reviews: 'avis',
    perNight: 'par nuit',
    book: 'Réserver',
    viewOnMap: 'Voir sur la carte',
    visitWebsite: 'Visiter le site',
    call: 'Appeler',
    weather: 'Météo',
    humidity: 'Humidité',
    wind: 'Vent',
    precipitation: 'Précip',
    myAccount: 'Mon Compte',
    myTravels: 'Mes Voyages',
    welcomeTitle: 'Où aimeriez-vous explorer aujourd\'hui?',
    welcomeSubtitle: 'Je peux vous aider à trouver des vols, des hôtels, des restaurants et planifier votre voyage parfait.',
    examplePrompts: {
      flights: 'Trouver des vols pour Barcelone',
      hotels: 'Hôtels à Paris moins de 200$',
      pois: 'Attractions principales à Tokyo',
      restaurants: 'Restaurants italiens à Rome',
      weather: 'Météo à Dubaï semaine prochaine'
    }
  },
  zh: {
    newChat: '新对话',
    placeholder: '询问航班、酒店或目的地...',
    send: '发送',
    today: '今天',
    chats: '对话',
    searchChats: '搜索对话...',
    reviews: '评论',
    perNight: '每晚',
    book: '预订',
    viewOnMap: '在地图上查看',
    visitWebsite: '访问网站',
    call: '致电',
    weather: '天气',
    humidity: '湿度',
    wind: '风速',
    precipitation: '降水',
    myAccount: '我的账户',
    myTravels: '我的旅行',
    welcomeTitle: '今天您想探索哪里？',
    welcomeSubtitle: '我可以帮您找到航班、酒店、餐厅，并规划您的完美旅行。',
    examplePrompts: {
      flights: '查找去巴塞罗那的航班',
      hotels: '巴黎200美元以下的酒店',
      pois: '东京的主要景点',
      restaurants: '罗马的意大利餐厅',
      weather: '迪拜下周的天气'
    }
  },
  ar: {
    newChat: 'محادثة جديدة',
    placeholder: 'اسألني عن الرحلات أو الفنادق أو الوجهات...',
    send: 'إرسال',
    today: 'اليوم',
    chats: 'المحادثات',
    searchChats: 'البحث في المحادثات...',
    reviews: 'تقييمات',
    perNight: 'لليلة',
    book: 'احجز',
    viewOnMap: 'عرض على الخريطة',
    visitWebsite: 'زيارة الموقع',
    call: 'اتصل',
    weather: 'الطقس',
    humidity: 'الرطوبة',
    wind: 'الرياح',
    precipitation: 'الأمطار',
    myAccount: 'حسابي',
    myTravels: 'رحلاتي',
    welcomeTitle: 'أين تود الاستكشاف اليوم؟',
    welcomeSubtitle: 'يمكنني مساعدتك في العثور على الرحلات والفنادق والمطاعم والتخطيط لرحلتك المثالية.',
    examplePrompts: {
      flights: 'ابحث عن رحلات إلى برشلونة',
      hotels: 'فنادق في باريس أقل من 200 دولار',
      pois: 'أهم المعالم في طوكيو',
      restaurants: 'مطاعم إيطالية في روما',
      weather: 'الطقس في دبي الأسبوع المقبل'
    }
  },
  es: {
    newChat: 'Nueva Conversación',
    placeholder: 'Pregúntame sobre vuelos, hoteles o destinos...',
    send: 'Enviar',
    today: 'Hoy',
    chats: 'Conversaciones',
    searchChats: 'Buscar conversaciones...',
    reviews: 'reseñas',
    perNight: 'por noche',
    book: 'Reservar',
    viewOnMap: 'Ver en el mapa',
    visitWebsite: 'Visitar sitio web',
    call: 'Llamar',
    weather: 'Clima',
    humidity: 'Humedad',
    wind: 'Viento',
    precipitation: 'Precipitación',
    myAccount: 'Mi Cuenta',
    myTravels: 'Mis Viajes',
    welcomeTitle: '¿Dónde te gustaría explorar hoy?',
    welcomeSubtitle: 'Puedo ayudarte a encontrar vuelos, hoteles, restaurantes y planificar tu viaje perfecto.',
    examplePrompts: {
      flights: 'Buscar vuelos a Barcelona',
      hotels: 'Hoteles en París menos de $200',
      pois: 'Principales atracciones en Tokio',
      restaurants: 'Restaurantes italianos en Roma',
      weather: 'Clima en Dubai próxima semana'
    }
  }
};

// Utility Functions
const formatFlightTime = (time: string): string => {
  try {
    const date = new Date(time);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch {
    const timeMatch = time.match(/\d{1,2}:\d{2}/);
    return timeMatch ? timeMatch[0] : time;
  }
};

// Check if arrival is next day
const isNextDay = (departureTime: string, arrivalTime: string): boolean => {
  try {
    const dep = new Date(departureTime);
    const arr = new Date(arrivalTime);
    return arr.getDate() > dep.getDate() || arr.getMonth() > dep.getMonth() || arr.getFullYear() > dep.getFullYear();
  } catch {
    return false;
  }
};

// Enhanced image fetching with fallbacks
const getHighQualityImage = (imageUrl: string, fallbackType: string = 'hotel'): string => {
  if (!imageUrl) {
    // Return high-quality placeholder based on type
    return `https://source.unsplash.com/800x600/?${fallbackType},luxury`;
  }
  
  // Google Images optimization
  if (imageUrl.includes('googleusercontent.com') || imageUrl.includes('gstatic.com')) {
    let enhancedUrl = imageUrl
      .replace(/=s\d+/, '=s2000')
      .replace(/=w\d+-h\d+/, '=w2000-h1500')
      .replace(/=w\d+/, '=w2000')
      .replace(/&w=\d+/, '&w=2000')
      .replace(/&h=\d+/, '&h=1500');
    
    if (!enhancedUrl.includes('&q=')) {
      enhancedUrl += '&q=100';
    }
    
    return enhancedUrl;
  }
  
  // Cloudinary optimization
  if (imageUrl.includes('cloudinary')) {
    return imageUrl
      .replace(/w_\d+/, 'w_2000')
      .replace(/h_\d+/, 'h_1500')
      .replace(/q_\d+/, 'q_100')
      .replace(/f_auto/, 'f_auto,q_100');
  }
  
  // Unsplash optimization
  if (imageUrl.includes('unsplash.com')) {
    return imageUrl
      .replace(/w=\d+/, 'w=2000')
      .replace(/&q=\d+/, '&q=100')
      .replace(/&fit=\w+/, '&fit=crop');
  }
  
  return imageUrl;
};

// Create map URL with place name instead of coordinates
const createMapUrl = (name: string, address?: string): string => {
  const query = encodeURIComponent(`${name}${address ? ', ' + address : ''}`);
  return `https://maps.google.com/maps?q=${query}`;
};

// Example Prompt Buttons Component - Enhanced design
const ExamplePrompts: FC<{ 
  onSelectPrompt: (prompt: string) => void;
  language: LanguageCode;
}> = ({ onSelectPrompt, language }) => {
  const t = TRANSLATIONS[language];
  
  const prompts = [
    { icon: <Plane className="w-5 h-5" />, text: t.examplePrompts.flights, gradient: 'from-sky-500 to-blue-600' },
    { icon: <Hotel className="w-5 h-5" />, text: t.examplePrompts.hotels, gradient: 'from-purple-500 to-purple-700' },
    { icon: <TreePine className="w-5 h-5" />, text: t.examplePrompts.pois, gradient: 'from-emerald-500 to-green-600' },
    { icon: <Utensils className="w-5 h-5" />, text: t.examplePrompts.restaurants, gradient: 'from-orange-500 to-orange-600' },
    { icon: <Cloud className="w-5 h-5" />, text: t.examplePrompts.weather, gradient: 'from-blue-500 to-indigo-600' }
  ];
  
  return (
    <div className="example-prompts-enhanced">
      <div className="prompts-header">
        <div className="prompts-decoration left"></div>
        <span>Popular searches</span>
        <div className="prompts-decoration right"></div>
      </div>
      <div className="prompts-grid-centered">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(prompt.text)}
            className={`prompt-card-enhanced bg-gradient-to-br ${prompt.gradient}`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="prompt-icon-wrapper">
              {prompt.icon}
            </div>
            <span className="prompt-text-enhanced">{prompt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Widget Components with sophisticated design
const FlightWidget: FC<{ flight: FlightData; index: number; language: LanguageCode }> = ({ flight, index, language }) => {
  const t = TRANSLATIONS[language];
  const showNextDay = isNextDay(flight.departureTime, flight.arrivalTime);
  
  return (
    <div
      className="flight-widget widget-sophisticated"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="widget-header">
        <div className="airline-info">
          <h3 className="airline-name">{flight.airline}</h3>
          {flight.flightNumber && (
            <span className="flight-number">{flight.flightNumber}</span>
          )}
        </div>
        <div className="price-badge">{flight.price}</div>
      </div>
      
      <div className="flight-route">
        <div className="route-point">
          <div className="airport-code">{flight.departure}</div>
          <div className="time">{formatFlightTime(flight.departureTime)}</div>
        </div>
        
        <div className="route-connector">
          <div className="route-line"></div>
          <Plane className="route-icon" />
          <div className="route-line"></div>
          <span className="duration">{flight.duration}</span>
        </div>
        
        <div className="route-point">
          <div className="airport-code">{flight.arrival}</div>
          <div className="time">
            {formatFlightTime(flight.arrivalTime)}
            {showNextDay && <span className="next-day">+1</span>}
          </div>
        </div>
      </div>
      
      <div className="widget-footer">
        <div className="flight-details">
          <span className="detail-item">
            {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </span>
          {flight.carbonEmissions && (
            <span className="detail-item">CO₂: {flight.carbonEmissions}</span>
          )}
        </div>
        {flight.bookingLink && (
          <a
            href={flight.bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="book-button sky-gradient"
          >
            {t.book} →
          </a>
        )}
      </div>
    </div>
  );
};

const HotelWidget: FC<{ hotel: HotelData; index: number; language: LanguageCode }> = ({ hotel, index, language }) => {
  const t = TRANSLATIONS[language];
  const highQualityImage = getHighQualityImage(hotel.image || '', 'hotel,luxury');
  const mapUrl = createMapUrl(hotel.name, hotel.address || hotel.location);
  
  return (
    <div
      className="hotel-widget widget-sophisticated widget-purple-theme"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="widget-image-container">
        <img 
          src={highQualityImage} 
          alt={hotel.name}
          className="widget-image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = `https://source.unsplash.com/800x600/?hotel,${hotel.name},luxury`;
          }}
        />
        {hotel.rating && (
          <div className="rating-badge">
            <Star className="star-icon" />
            <span>{hotel.rating}</span>
          </div>
        )}
      </div>
      
      <div className="widget-content">
        <h3 className="widget-title">{hotel.name}</h3>
        
        {hotel.reviews && (
          <div className="reviews-count">
            {hotel.reviews} {t.reviews}
          </div>
        )}
        
        <div className="price-display">
          <span className="price">{hotel.price}</span>
          <span className="price-period">{t.perNight}</span>
        </div>
        
        {hotel.location && (
          <div className="location-info">
            <MapPin className="location-icon" />
            <span>{hotel.location}</span>
          </div>
        )}
        
        <div className="widget-actions">
          {hotel.link && (
            <a
              href={hotel.link}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button primary purple-gradient"
            >
              {t.book}
            </a>
          )}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button secondary"
            title={hotel.name}
          >
            <MapPin className="button-icon" />
          </a>
        </div>
      </div>
    </div>
  );
};

const POIWidget: FC<{ poi: POIData; index: number; language: LanguageCode }> = ({ poi, index, language }) => {
  const t = TRANSLATIONS[language];
  const highQualityImage = getHighQualityImage(poi.image || '', 'landmark,attraction');
  const mapUrl = createMapUrl(poi.name, poi.address);
  
  return (
    <div
      className="poi-widget widget-sophisticated widget-green-theme"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="widget-image-container">
        <img 
          src={highQualityImage} 
          alt={poi.name}
          className="widget-image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = `https://source.unsplash.com/800x600/?landmark,${poi.name},tourism`;
          }}
        />
        {poi.type && (
          <div className="type-badge">{poi.type}</div>
        )}
      </div>
      
      <div className="widget-content">
        <h3 className="widget-title">{poi.name}</h3>
        
        {poi.rating && (
          <div className="rating-section">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`star ${i < Math.floor(poi.rating || 0) ? 'filled' : ''}`}
                />
              ))}
            </div>
            <span className="review-count">({poi.reviews || 0})</span>
          </div>
        )}
        
        {poi.price && (
          <div className="price-info">{poi.price}</div>
        )}
        
        {poi.description && (
          <p className="description">{poi.description}</p>
        )}
        
        <div className="widget-actions">
          {poi.website && (
            <a
              href={poi.website}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button primary green-gradient"
            >
              {t.visitWebsite}
            </a>
          )}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button secondary"
            title={poi.name}
          >
            <MapPin className="button-icon" />
          </a>
        </div>
      </div>
    </div>
  );
};

const RestaurantWidget: FC<{ restaurant: RestaurantData; index: number; language: LanguageCode }> = ({ restaurant, index, language }) => {
  const t = TRANSLATIONS[language];
  const highQualityImage = getHighQualityImage(restaurant.image || '', `restaurant,food,${restaurant.cuisine || 'dining'}`);
  const mapUrl = createMapUrl(restaurant.name, restaurant.address);
  
  return (
    <div
      className="restaurant-widget widget-sophisticated widget-orange-theme"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="widget-image-container">
        <img 
          src={highQualityImage} 
          alt={restaurant.name}
          className="widget-image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = `https://source.unsplash.com/800x600/?restaurant,food,${restaurant.cuisine || 'dining'}`;
          }}
        />
        {restaurant.cuisine && (
          <div className="cuisine-badge">{restaurant.cuisine}</div>
        )}
      </div>
      
      <div className="widget-content">
        <h3 className="widget-title">{restaurant.name}</h3>
        
        <div className="rating-price-row">
          {restaurant.rating && (
            <div className="rating-section">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`star ${i < Math.floor(restaurant.rating || 0) ? 'filled' : ''}`}
                  />
                ))}
              </div>
              <span className="review-count">({restaurant.reviews || 0})</span>
            </div>
          )}
          {restaurant.priceLevel && (
            <span className="price-level">{restaurant.priceLevel}</span>
          )}
        </div>
        
        {restaurant.address && (
          <div className="location-info">
            <MapPin className="location-icon" />
            <span>{restaurant.address}</span>
          </div>
        )}
        
        <div className="widget-actions">
          {restaurant.website && (
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button primary orange-gradient"
            >
              {t.visitWebsite}
            </a>
          )}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button secondary"
            title={restaurant.name}
          >
            <MapPin className="button-icon" />
          </a>
        </div>
      </div>
    </div>
  );
};

const WeatherWidget: FC<{ weather: WeatherData; index: number }> = ({ weather, index }) => {
  const getWeatherIcon = (icon: string) => {
    switch(icon) {
      case 'sunny':
      case 'clear':
        return '☀️';
      case 'partly-cloudy':
        return '⛅';
      case 'cloudy':
        return '☁️';
      case 'rain':
        return '🌧️';
      case 'thunderstorm':
        return '⛈️';
      case 'snow':
        return '❄️';
      case 'fog':
        return '🌫️';
      default:
        return '🌤️';
    }
  };
  
  return (
    <div className="weather-widget widget-sophisticated" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="weather-header">
        <h3 className="location-name">{weather.location}</h3>
        <div className="weather-icon-large">{getWeatherIcon(weather.current.icon)}</div>
      </div>
      
      <div className="weather-current">
        <div className="temperature">{weather.current.temp}°</div>
        <div className="condition">{weather.current.condition}</div>
      </div>
      
      <div className="weather-details">
        <div className="detail">
          <Droplets className="detail-icon" />
          <span>{weather.current.humidity}%</span>
        </div>
        <div className="detail">
          <Wind className="detail-icon" />
          <span>{weather.current.windSpeed} km/h</span>
        </div>
      </div>
      
      <div className="weather-forecast">
        {weather.forecast.slice(0, 7).map((day: any, idx: number) => (
          <div key={idx} className="forecast-day">
            <div className="day-name">{day.day}</div>
            <div className="day-icon">{getWeatherIcon(day.icon)}</div>
            <div className="day-high">{day.high}°</div>
            <div className="day-low">{day.low}°</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Sidebar Component
interface Conversation {
  id: string;
  title: string;
  messages: Array<{ role: string; content: string }>;
  createdAt: number;
  updatedAt?: number;
}

const Sidebar: FC<{
  conversations: Conversation[];
  activeId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  language: LanguageCode;
}> = ({ conversations, activeId, onNewChat, onSelectChat, onDeleteChat, language }) => {
  const t = TRANSLATIONS[language];
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredConversations = conversations.filter((conv: Conversation) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div className="sidebar-desktop">
      <div className="p-4 border-b border-gray-800/50">
        <button
          onClick={onNewChat}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 
            text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t.newChat}
        </button>
      </div>
      
      <div className="p-4 border-b border-gray-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchChats}
            className="w-full pl-10 pr-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg
              text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{t.chats}</h3>
        <div className="space-y-2">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`group chat-item ${activeId === conv.id ? 'chat-item-active' : ''}`}
              onClick={() => onSelectChat(conv.id)}
            >
              <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-200 truncate">{conv.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-800/50">
        <a
          href="/my-travels"
          className="w-full py-2 px-4 rounded-lg bg-gray-800/50 border border-gray-700/50
            text-gray-300 font-medium hover:bg-gray-700/50 hover:text-white hover:border-gray-600/50
            transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Map className="w-4 h-4" />
          {t.myTravels}
        </a>
      </div>
    </div>
  );
};

// Chat Input Component - Reusable
export const ChatInput: FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}> = ({ value, onChange, onSend, placeholder, disabled, loading }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-focus on keypress
  useEffect(() => {
    const handleGlobalKeypress = (e: KeyboardEvent) => {
      if (e.target === document.body && !e.ctrlKey && !e.altKey && !e.metaKey) {
        inputRef.current?.focus();
      }
    };
    
    document.addEventListener('keypress', handleGlobalKeypress);
    return () => document.removeEventListener('keypress', handleGlobalKeypress);
  }, []);
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  
  return (
    <div className="chat-input-wrapper-enhanced">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        className="chat-input-enhanced"
        rows={1}
        disabled={disabled || loading}
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled || loading}
        className="send-button-enhanced"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

// Main Component
const TravelChatUI: FC = () => {
  const { conversations, activeId, loading, send, newConversation, selectConversation, deleteConversation } = useChatStore();
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
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

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      send(prompt, language);
    }, 100);
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
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        try {
          const data = JSON.parse(match[1]);
          widgets.push({ type: type as Widget['type'], data });
          textContent = textContent.replace(match[0], '');
        } catch (error) {
          console.error(`Error parsing ${type} widget:`, error);
        }
      });
    });

    return { textContent: textContent.trim(), widgets };
  };

  return (
    <div className="travel-chat-container">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onNewChat={() => newConversation(language)}
        onSelectChat={selectConversation}
        onDeleteChat={deleteConversation}
        language={language}
      />
      
      <div className="chat-main">
        <div className="chat-header">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">TravelBot AI</h1>
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{language.toUpperCase()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  {(['en', 'fr', 'zh', 'ar', 'es'] as LanguageCode[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLanguageDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {lang.toUpperCase()} - {
                        lang === 'en' ? 'English' :
                        lang === 'fr' ? 'Français' :
                        lang === 'zh' ? '中文' :
                        lang === 'ar' ? 'العربية' :
                        'Español'
                      }
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div 
              className="relative"
              onMouseEnter={handleAccountMouseEnter}
              onMouseLeave={handleAccountMouseLeave}
            >
              <a
                href="/my-account"
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>{t.myAccount}</span>
              </a>
              
              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <a
                    href="/my-account"
                    className="block px-4 py-2 hover:bg-gray-700 transition-colors rounded-t-lg"
                  >
                    Profile Settings
                  </a>
                  <a
                    href="/my-travels"
                    className="block px-4 py-2 hover:bg-gray-700 transition-colors"
                  >
                    Travel History
                  </a>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors rounded-b-lg text-red-400"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state-premium">
              <div className="welcome-animation">
                <div className="welcome-orb"></div>
                <div className="welcome-particles">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="particle" style={{ animationDelay: `${i * 200}ms` }}></div>
                  ))}
                </div>
              </div>
              <div className="welcome-content-enhanced">
                <h1 className="welcome-title-premium">{t.welcomeTitle}</h1>
                <p className="welcome-subtitle-premium">{t.welcomeSubtitle}</p>
              </div>
              <ExamplePrompts onSelectPrompt={handleSelectPrompt} language={language} />
            </div>
          ) : (
            <>
              {messages.map((message, idx) => {
                const { textContent, widgets } = parseMessage(message.content);
                
                return (
                  <div key={idx} className="message-section">
                    {textContent && (
                      <div className={`message-wrapper ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                        <div className={`message ${message.role === 'user' ? 'message-user-content' : 'message-assistant-content'}`}>
                          <div className="message-text">{textContent}</div>
                        </div>
                      </div>
                    )}
                    
                    {widgets.length > 0 && (
                      <div className="widgets-section">
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
                          <div className="poi-grid">
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
                          <div className="restaurant-grid">
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
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="message-wrapper message-assistant">
                  <div className="message message-assistant-content">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className="chat-input-container">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            placeholder={t.placeholder}
            disabled={isLoading}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default TravelChatUI;