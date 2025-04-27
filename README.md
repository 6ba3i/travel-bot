# ✈️ Travel-Bot — AI-Powered Itinerary Planner

A conversational web app that turns **any travel question** into a clickable, hour-by-hour plan.  
Built to **learn React from scratch**, practise modern tooling, and explore LLM+API orchestration.

---

## 1. What It Does 🌍

| Ask the bot… | It will… | Powered by |
|--------------|----------|------------|
| *“Best cafés with Wi-Fi in Kyoto?”* | Return a ranked list (distance, opening hours, Google Maps links) | OpenTripMap |
| *“Plan 3 days in Lisbon under €400”* | Build a budget-aware itinerary split by day & neighbourhood | Mistral + custom planner |
| *“Where should I go in May for hiking + street food?”* | Suggest destinations, climate notes & sample costs | Weather & price datasets |

---

## 2. Stack at a Glance 🛠️

| Layer | Tech |
|-------|------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind |
| **State** | Zustand |
| **Auth** | Firebase Auth (Email/Password + Google) |
| **AI** | Mistral Small (`/v1/chat/completions`) |
| **Data APIs** | OpenTripMap (POIs) · Navitia (transit) · OpenWeather |
| **Server proxy** | Node 18 + Express (Edge-ready) |
| **Persistence (roadmap)** | Supabase (Postgres + pgvector) |

---

## 3. Current Features ✅

- **Auth flow** — glass-morphism login/sign-up, password reset, Google OAuth  
- **Dynamic background** — parallax grid following cursor (pure CSS)  
- **Chat UI** — streaming responses, markdown render, mobile-first layout  
- **LLM plumbing** — proxy injects system prompt & executes tool calls  
- **Project structure** — clean `src/` folders (`components/`, `pages/`, `store/`, `types/`)

---

## 4. Roadmap 🗺️

| Milestone | Status |
|-----------|--------|
| Live POI search via `searchPlaces` tool | 🔜 |
| Greedy itinerary packing algorithm | 🔜 |
| Trip persistence + “Resume last trip” | 🔜 |
| PWA install + offline cache | 🔜 |
| Stripe checkout for premium exports | 💡 idea |

---

## 5. Local Setup ⚡

```bash
# 1. Clone
git clone https://github.com/your-handle/travel-bot && cd travel-bot

# 2. Install deps
npm install

# 3. Fill .env  (see .env.example)
cp .env.example .env
# → add Firebase + Mistral + OpenTripMap keys

# 4. Run dev servers (Vite + Express proxy)
npm run dev
