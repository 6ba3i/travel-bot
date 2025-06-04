import { useState, useEffect, useRef, FC } from 'react';
import { SendHorizontal, Loader2, Plus } from 'lucide-react';
import { useChatStore } from '../store/useChat';    // ← corrected hook path

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

// Flight result card component
interface FlightCardProps {
  price: string;
  airline: string;
  bookingLink: string;
}
const FlightCard: FC<FlightCardProps> = ({ price, airline, bookingLink }) => (
  <div className="my-2 p-4 bg-white/10 border border-gray-700 rounded-xl hover:bg-white/20 transition-all">
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-xl font-bold text-white">${price}</span>
        <span className="text-sm text-gray-300">{airline}</span>
      </div>
      <a
        href={bookingLink}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
      >
        Book Now
      </a>
    </div>
  </div>
);

export default function TravelChatUI() {
  const { conversations, activeId, send, newConversation, selectConversation } = useChatStore();
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

  // Parse assistant message for flights
  const processMessage = (msg: { role: string; content: string }) => {
    if (msg.role !== 'assistant') return { content: msg.content };

    const flights: FlightCardProps[] = [];
    const regex = /\*\*\$(\d+)\*\* – ([^|]+)\| \[Book\]\((.*?)\)/g;
    let match;
    while ((match = regex.exec(msg.content))) {
      flights.push({
        price: match[1],
        airline: match[2].trim(),
        bookingLink: match[3]
      });
    }

    if (flights.length) {
      return {
        content: 'Certainly! Here are a few flights I found:',
        flights
      };
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
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`w-full text-left p-2 rounded ${c.id === activeId ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            >
              {c.title || 'New chat'}
            </button>
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
              const { content, flights } = processMessage(msg);
              return (
                <div
                  key={i}
                  className={`mb-4 flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[75%] p-4 rounded-2xl ${
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
                    {flights?.map((f, idx) => (
                      <FlightCard
                        key={idx}
                        price={f.price}
                        airline={f.airline}
                        bookingLink={f.bookingLink}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex mb-4">
                <div className="bg-gray-800 text-white p-4 rounded-2xl flex items-center">
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
