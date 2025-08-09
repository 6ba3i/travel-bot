# ✈️ TravelBot — AI-Powered Travel Assistant

A personal project showcasing a multilingual conversational web app that transforms **any travel question** into actionable travel plans with real-time data and interactive widgets.  
Built as a learning journey exploring React, Google's Gemini AI, and comprehensive global travel APIs.

---

## 🌟 What's New in v2.0

### 🌍 **Global Multilingual Support**
- **Complete UI Translation**: Interface adapts to English, French, and Chinese
- **Global Airport Codes**: Recognizes city names in multiple languages (Casablanca/كازابلانكا/卡萨布兰卡 → CMN)
- **Worldwide Location Support**: Automatic coordinate lookup for any destination (Bali, Santorini, Maldives, etc.)

### 🎨 **Enhanced Visual Experience**
- **Interactive Widgets**: Beautiful flight, hotel, and weather widgets instead of plain text
- **3-Column Hotel Grid**: Professional layout with images and map integration
- **Weather Widgets**: 7-day forecasts with icons and current conditions
- **Mobile Responsive**: Optimized for all screen sizes

### 🔗 **Direct Booking Integration**
- **Airline Websites**: Direct links to Royal Air Maroc, Emirates, Air France, etc.
- **Real-time Prices**: Live data from Google Flights and Hotels via SerpApi
- **Hotel Images**: Automatic image fetching for visual hotel selection

### 💬 **Chat Experience**
- **Conversation History**: Persistent chat sidebar with conversation management
- **Language Detection**: Automatically responds in user's detected language
- **Enhanced Stability**: Improved error handling and API reliability

---

## 🚀 What It Does

| Ask TravelBot… | It will… | Powered by |
|--------------|----------|------------|
| *"Flights from Casablanca to Barcelona August 18"* | Show interactive flight widgets with real prices & airline booking | Google Flights (SerpApi) |
| *"Hotels in Bali under $150"* | Display 3-column grid with images, ratings, and map links | Google Hotels (SerpApi) |
| *"Weather in كازابلانكا next week"* | Beautiful 7-day forecast widget with icons and conditions | OpenWeather + Auto-geocoding |
| *"Plan 3 days in Tokyo"* | Curated itinerary with POIs, transport, and local insights | Google Local + Gemini AI |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, TypeScript, Tailwind CSS | Modern responsive UI |
| **State Management** | Zustand with persistence | Chat history & user preferences |
| **AI Engine** | Google Gemini 1.5 Flash | Natural language processing & tool orchestration |
| **Travel APIs** | SerpApi (Google Flights, Hotels, Local) | Real-time travel data |
| **Weather** | OpenWeather + Auto-geocoding | Global weather forecasts |
| **Backend** | Node.js + Express | API proxy & request handling |
| **Styling** | Tailwind + Custom CSS | Glass-morphism & animations |

---

## ✨ Key Features

### 🎯 **Smart Search & Booking**
- **Global Airport Recognition**: Handles "New York" → JFK, "طوكيو" → NRT, "巴黎" → CDG
- **Direct Airline Booking**: Skip Google Flights, go straight to airline websites
- **Real-time Pricing**: Live data from major booking platforms
- **Visual Hotel Selection**: Images, ratings, and map integration

### 🌐 **Multilingual Intelligence**
- **Auto-detection**: Responds in user's language (English/French/Chinese)
- **Complete Translation**: Every UI element adapts to selected language
- **Global City Support**: Recognizes international city names and spellings
- **Cultural Adaptation**: Currency, date formats, and local preferences

### 📱 **Modern UX**
- **Interactive Widgets**: Rich visual components for flights, hotels, weather
- **Conversation History**: Persistent chat sidebar with search
- **Mobile Optimized**: Responsive design with touch interactions
- **Glass Morphism**: Modern aesthetic with backdrop blur effects

### 🔧 **Enterprise-Ready**
- **Error Handling**: Comprehensive retry logic and graceful failures
- **API Stability**: Connection pooling and timeout management
- **Performance**: Optimized bundling and lazy loading
- **Accessibility**: ARIA labels and keyboard navigation

---

## 🚀 Quick Start

```bash
# 1. Clone & Install
git clone https://github.com/6ba3i/travel-bot
cd travel-bot
npm install

# 2. Environment Setup
cp .env.example .env
# Add your API keys:
# - GEMINI_API_KEY=your_gemini_key
# - SERPAPI_KEY=your_serpapi_key

# 3. Start Development
npm run dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

### 🔑 **Required API Keys**
- **Google Gemini API**: Get from [Google AI Studio](https://aistudio.google.com/)
- **SerpApi Key**: Get from [SerpApi](https://serpapi.com/) (100 free searches/month)

---

## 📋 API Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/chat` | POST | Main chat interface | AI response with widgets |
| `/api/translate` | POST | Text translation | Translated content |
| `/api/health` | GET | Server status | Health check |



---

## 🌍 Supported Locations

TravelBot recognizes city names in multiple languages and scripts:

| City | English | Arabic | Chinese | Airport |
|------|---------|--------|---------|---------|
| Casablanca | Casablanca | الدار البيضاء | 卡萨布兰卡 | CMN |
| Barcelona | Barcelona | برشلونة | 巴塞罗那 | BCN |
| Tokyo | Tokyo | طوكيو | 东京 | NRT |
| Paris | Paris | باريس | 巴黎 | CDG |
| Dubai | Dubai | دبي | 迪拜 | DXB |

*+ 100+ more cities with automatic coordinate lookup*

---

## 🔧 Development

### Project Structure
```
travel-bot/
├── src/
│   ├── components/         # React components
│   ├── store/             # Zustand state management
│   ├── lib/               # API integrations
│   └── types/             # TypeScript definitions
├── server.mjs             # Express API server
└── vite.config.ts         # Build configuration
```

### Environment Variables
```bash
# Required
GEMINI_API_KEY=your_gemini_key
SERPAPI_KEY=your_serpapi_key

# Optional
PORT=3001
NODE_ENV=development
```

### Build Commands
```bash
npm run dev        # Development with HMR
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint checks
```

---

## 📈 Performance

- **Bundle Size**: ~2.1MB (gzipped)
- **API Response**: ~500ms average
- **Widget Rendering**: <100ms
- **Memory Usage**: ~50MB baseline

---

## 🔮 Roadmap

| Feature | Status | ETA |
|---------|--------|-----|
| **PDF Itinerary Export** | 🔄 In Progress | Q1 2025 |
| **Voice Input** | 📋 Planned | Q2 2025 |
| **Offline Mode** | 💭 Concept | Q3 2025 |
| **Group Trip Planning** | 💭 Concept | Q4 2025 |

---

## 🤝 Contributing

This is a personal project built for learning and experimentation. While I appreciate your interest, this project is currently not open for external contributions as it serves as my portfolio piece and learning journey.

---

## 🙏 Acknowledgments

- **Google Gemini** for advanced AI capabilities
- **SerpApi** for real-time travel data
- **OpenWeather** for global weather information
- **Tailwind CSS** for styling framework
- **React** ecosystem for frontend foundation

---

<div align="center">

**🌟 Personal Travel Assistant Project**

Built as a learning journey exploring modern web development, AI integration, and travel APIs

*A showcase of React, TypeScript, AI orchestration, and real-time data integration*

</div>