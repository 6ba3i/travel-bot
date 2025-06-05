import { useState, useEffect, useRef, FC } from 'react';
import { SendHorizontal, Loader2, Plus, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/useChat';    // ← corrected hook path
import ResultCard, { FlightResult, PoiResult, Result } from './ResultCard';

// Sample travel prompts for initial screen
const SAMPLE_PROMPTS = [
  'Find flights from JFK to LAX on May 15th',
  'What are the best hotels in Tokyo?',
  'Suggest a 3-day itinerary for Barcelona',
  "What's the weather like in Bali next week?"
];

// Typing effect component
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
        setDisplayText((t) => t + text[indexRef.current]);
        indexRef.current += 1;
      }, speed);
      return () => clearTimeout(timer);
    }
    onComplete?.();
  }, [text, speed, onComplete]);

  return <div>{displayText}</div>;
};


export default function TravelChatUI() {
  const { conversations, activeId, send, newConversation, selectConversation, deleteConversation } = useChatStore();
  const active = conversations.find(c => c.id === activeId)!;
  const messages = active.messages;
  const isFirstMessage = messages.length === 0;
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send user input
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsTyping(true);
    await send(input);
    setInput('');
    setIsTyping(false);
  };

  // Prefill input with sample prompt
  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  // Parse assistant messages for structured results
  const processMessage = (msg: { role: string; content: string }): { content: string; results?: Result[] } => {
    if (msg.role !== 'assistant') return { content: msg.content };

    // ----- JSON block -----
    const jsonMatch = msg.content.match(/```json\n([\s\S]+?)\n```/i);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const results: Result[] = [];
        if (Array.isArray(data.flights)) {
          for (const f of data.flights) {
            results.push({
              kind: 'flight',
              price: f.price,
              airline: f.airline,
              departureTime: f.departureTime,
              arrivalTime: f.arrivalTime,
              duration: f.duration || 'N/A',
              stops: f.stops ?? 0,
              bookingLink: f.bookingLink,
              returnInfo: f.returnInfo
            });
          }
        }
        if (Array.isArray(data.pois)) {
          for (const p of data.pois) {
            results.push({
              kind: 'poi',
              name: p.name,
              link: p.link,
              category: p.category
            });
          }
        }
        if (results.length) {
          const content = msg.content.replace(jsonMatch[0], '').trim();
          return { content, results };
        }
      } catch (e) {
        console.error('JSON parse error', e);
      }
    }

    // ----- Flights -----
    const flightLines = msg.content
      .split(/\n/)
      .filter((l) => /^\d+\./.test(l) && /Airline/i.test(l));
    if (flightLines.length) {
      const flights: FlightResult[] = [];
      for (const line of flightLines) {
        const m = line.match(/Airline\s+([^,]+),\s*Departure:\s*([^,]+),\s*Arrival:\s*([^,]+),\s*Stops:\s*([^,]+),\s*Price:\s*\$(\d+(?:\.\d+)?)/i);
        if (!m) continue;
        flights.push({
          kind: 'flight',
          airline: m[1].trim(),
          departureTime: m[2].trim(),
          arrivalTime: m[3].trim(),
          duration: 'N/A',
          stops: m[4].toLowerCase().includes('nonstop') ? 0 : parseInt(m[4], 10),
          price: parseFloat(m[5]),
          bookingLink: ''
        });
      }
      if (flights.length) {
        return { content: 'Certainly! Here are a few flights I found:', results: flights };
      }
    }

    // ----- Points of interest -----
    const poiMatches = [...msg.content.matchAll(/\d+\.\s+\[([^\]]+)\]\(([^)]+)\)(?:\s*-\s*([^\n]+))?/g)];
    if (poiMatches.length) {
      const pois: PoiResult[] = poiMatches.map((m) => ({
        kind: 'poi',
        name: m[1],
        link: m[2],
        category: m[3]?.trim()
      }));
      return { content: 'Certainly! Here are some attractions:', results: pois };
    }

    return { content: msg.content };
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <aside className="w-56 border-r border-gray-700 bg-gray-800 text-white p-4 flex flex-col">
        <button
          onClick={newConversation}
          className="flex items-center mb-4 p-2 rounded bg-indigo-600 hover:bg-indigo-700"
        >
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
                onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
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
              <h2 className="text-lg font-medium text-white mb-4">
                How can I help with your travel plans today?
              </h2>
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
          <>
            {messages.map((msg, i) => {
              const { content, results } = processMessage(msg);
              return (
                <div
                  key={i}
                  className={`mb-2 flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[75%] p-4 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    {i === messages.length - 1 && msg.role === 'assistant' && isTyping ? (
                      <TypeWriter text={content} onComplete={() => setIsTyping(false)} />
                    ) : (
                      <div>{content}</div>
                    )}
                    {results?.map((r, idx) => (
                      <ResultCard key={idx} result={r} />
                    ))}
                  </div>
                </div>
              );
            })}

            {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex mb-2">
                <div className="bg-gray-800 text-white p-4 rounded-xl flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>TravelBot is typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message TravelBot..."
          className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className={`p-3 rounded-r-lg transition-colors ${
            input.trim() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700'
          }`}
        >
          <SendHorizontal className="h-5 w-5 text-white" />
        </button>
      </form>
    </div>
  </div>
  );
}
