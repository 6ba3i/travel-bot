import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from './store/useChat';
import ChatWindow from './components/ChatWindow';

export default function App() {
  const [input, setInput] = useState('');
  const sendMessage = useChatStore(s => s.send);
  const loading = useChatStore(s => s.loading);
  const messages = useChatStore(s => s.messages);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when new messages come in
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await sendMessage(input);
    setInput('');
    
    // Focus the input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-semibold">Travel Assistant</h1>
        <p className="text-sm text-blue-100">Find flights, hotels, and travel information</p>
      </div>
      
      {/* Chat container */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 pb-20"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-xl font-medium mb-2">Welcome to Travel Assistant!</h2>
            <p className="text-center max-w-md">
              Ask me about flights, hotels, travel destinations, or itinerary planning.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              <SuggestionButton 
                text="Find me a flight from JFK to LAX" 
                onClick={() => sendMessage("Find me a flight from JFK to LAX next week")}
              />
              <SuggestionButton 
                text="Hotels in Paris"
                onClick={() => sendMessage("What are some good hotels in Paris?")}
              />
              <SuggestionButton 
                text="One-way vs round-trip flights"
                onClick={() => sendMessage("Should I book a one-way or round-trip flight to London?")}
              />
              <SuggestionButton 
                text="Best time to visit Japan"
                onClick={() => sendMessage("When is the best time to visit Japan?")}
              />
            </div>
          </div>
        ) : (
          <ChatWindow />
        )}
      </div>
      
      {/* Input area */}
      <div className="bg-white border-t p-4 fixed bottom-0 left-0 right-0">
        <form onSubmit={handleSubmit} className="flex max-w-4xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about flights, hotels, or travel destinations..."
            className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            className={`bg-blue-600 text-white px-4 rounded-r-lg font-medium ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Helper component for suggestion buttons
function SuggestionButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-300 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
    >
      {text}
    </button>
  );
}