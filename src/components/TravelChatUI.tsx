import { useState, useEffect, useRef, FC } from 'react';
import { SendHorizontal, Loader2, Plus, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/useChat';

const SAMPLE_PROMPTS = [
  'Find flights from JFK to LAX on May 15th',
  'What are the best hotels in Tokyo?',
  'Suggest a 3-day itinerary for Barcelona',
  "What's the weather like in Bali next week?",
];

interface TypeWriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}
const TypeWriter: FC<TypeWriterProps> = ({ text, speed = 10, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (indexRef.current < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(t => t + text[indexRef.current]);
        indexRef.current += 1;
      }, speed);
      return () => clearTimeout(timer);
    }
    onComplete?.();
  }, [text, speed, onComplete]);

  return <div>{displayText}</div>;
};

interface Flight {
  airline: string;
  departure: string;
  arrival: string;
  date: string;
  price: string | number;
  bookingLink?: string;
}

interface Hotel {
  name: string;
  location: string;
  rating?: number;
  price?: string | number;
  link?: string;
}

interface Restaurant {
  name: string;
  location: string;
  rating?: number;
  price?: string | number;
  link?: string;
}

type Card =
  | { type: 'flight'; data: Flight }
  | { type: 'hotel'; data: Hotel }
  | { type: 'restaurant'; data: Restaurant };

function FlightCard({ data, hotelLocation }: { data: Flight; hotelLocation?: string }) {
  const book = () => data.bookingLink && window.open(data.bookingLink, '_blank');
  const directions = () => {
    if (!hotelLocation) return;
    const url = `https://opentripmap.com/en/directions?start=${encodeURIComponent(
      data.departure,
    )}&end=${encodeURIComponent(hotelLocation)}`;
    window.open(url, '_blank');
  };
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between font-medium mb-1">
        <span>{data.airline}</span>
        <span>{data.price}</span>
      </div>
      <div className="text-sm text-gray-600 mb-2">
        {data.departure} → {data.arrival} on {data.date}
      </div>
      <div className="space-x-3 text-sm">
        {data.bookingLink && (
          <button onClick={book} className="text-blue-600 hover:underline">
            Book
          </button>
        )}
        {hotelLocation && (
          <button onClick={directions} className="text-blue-600 hover:underline">
            Directions
          </button>
        )}
      </div>
    </div>
  );
}

function HotelCard({ data }: { data: Hotel }) {
  const open = () => data.link && window.open(data.link, '_blank');
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between">
        <div>
          <div className="font-medium">{data.name}</div>
          <div className="text-sm text-gray-600">{data.location}</div>
        </div>
        <div className="text-right">
          {data.rating !== undefined && <div className="text-yellow-500">{data.rating}★</div>}
          {data.price && <div className="font-semibold">{data.price}</div>}
        </div>
      </div>
      {data.link && (
        <button onClick={open} className="mt-2 text-sm text-blue-600 hover:underline">
          View
        </button>
      )}
    </div>
  );
}

function RestaurantCard({ data }: { data: Restaurant }) {
  const open = () => data.link && window.open(data.link, '_blank');
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between">
        <div>
          <div className="font-medium">{data.name}</div>
          <div className="text-sm text-gray-600">{data.location}</div>
        </div>
        <div className="text-right">
          {data.rating !== undefined && <div className="text-yellow-500">{data.rating}★</div>}
          {data.price && <div className="font-semibold">{data.price}</div>}
        </div>
      </div>
      {data.link && (
        <button onClick={open} className="mt-2 text-sm text-blue-600 hover:underline">
          View
        </button>
      )}
    </div>
  );
}

export default function TravelChatUI() {
  const { conversations, activeId, send, newConversation, selectConversation, deleteConversation } =
    useChatStore();
  const active = conversations.find(c => c.id === activeId)!;
  const messages = active.messages;
  const isFirstMessage = messages.length === 0;
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsTyping(true);
    await send(input);
    setInput('');
    setIsTyping(false);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const processMessage = (msg: { role: string; content: string }): { content: string; cards?: Card[] } => {
    if (msg.role !== 'assistant') return { content: msg.content };
    const match = msg.content.match(/```json\n([\s\S]+?)\n```/i);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const cards: Card[] = [];
        if (Array.isArray(data.flights)) {
          data.flights.forEach((f: any) =>
            cards.push({
              type: 'flight',
              data: {
                airline: f.airline,
                departure: f.departure,
                arrival: f.arrival,
                date: f.date,
                price: f.price,
                bookingLink: f.bookingLink,
              },
            }),
          );
        }
        if (Array.isArray(data.hotels)) {
          data.hotels.forEach((h: any) =>
            cards.push({
              type: 'hotel',
              data: {
                name: h.name,
                location: h.location,
                rating: h.rating,
                price: h.price,
                link: h.link,
              },
            }),
          );
        }
        if (Array.isArray(data.restaurants)) {
          data.restaurants.forEach((r: any) =>
            cards.push({
              type: 'restaurant',
              data: {
                name: r.name,
                location: r.location,
                rating: r.rating,
                price: r.price,
                link: r.link,
              },
            }),
          );
        }
        const pre = msg.content.slice(0, match.index).trim();
        return { content: pre, cards };
      } catch (e) {
        console.error('JSON parse error', e);
      }
    }
    return { content: msg.content };
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <aside className="w-56 border-r border-gray-700 bg-gray-800 text-white p-4 flex flex-col">
        <button onClick={newConversation} className="flex items-center mb-4 p-2 rounded bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> New chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map(c => (
            <div key={c.id} className="flex items-center">
              <button
                onClick={() => selectConversation(c.id)}
                className={`flex-1 text-left p-2 rounded ${c.id === activeId ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              >
                {c.title || 'New chat'}
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  deleteConversation(c.id);
                }}
                className="ml-1 p-1 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </aside>
      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-4">
          {isFirstMessage ? (
            <div className="h-full flex flex-col items-center justify-center">
              <h1 className="text-4xl font-bold mb-8 text-white">TravelBot</h1>
              <div className="max-w-xl w-full">
                <h2 className="text-lg font-medium text-white mb-4">How can I help with your travel plans today?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SAMPLE_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePromptClick(prompt)}
                      className="text-left p-4 bg-white/10 border border-gray-700 rounded-xl hover:bg-white/20 transition-all text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {messages.map((msg, i) => {
                const { content, cards } = processMessage(msg);
                if (msg.role === 'user') {
                  return (
                    <div key={i} className="self-end max-w-[70%] bg-indigo-600 text-white rounded-lg px-4 py-2">
                      {content}
                    </div>
                  );
                }
                const hotelLoc = cards?.find(c => c.type === 'hotel')?.data.location;
                return (
                  <div key={i} className="self-start w-full text-white">
                    {i === messages.length - 1 && isTyping ? (
                      <TypeWriter text={content} onComplete={() => setIsTyping(false)} />
                    ) : (
                      <div className="whitespace-pre-wrap">{content}</div>
                    )}
                    {cards?.map((card, idx) => {
                      if (card.type === 'flight') return <FlightCard key={idx} data={card.data} hotelLocation={hotelLoc} />;
                      if (card.type === 'hotel') return <HotelCard key={idx} data={card.data} />;
                      if (card.type === 'restaurant') return <RestaurantCard key={idx} data={card.data} />;
                      return null;
                    })}
                  </div>
                );
              })}
              {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="self-start text-white flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>TravelBot is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4 flex">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message TravelBot..."
            className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={`p-3 rounded-r-lg transition-colors ${input.trim() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700'}`}
          >
            <SendHorizontal className="h-5 w-5 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
