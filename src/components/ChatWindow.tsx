import { useChatStore } from '../store/useChat';

export default function ChatWindow() {
  const messages = useChatStore(s => s.messages);
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((m, i) => (
        <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
          <span className="inline-block bg-gray-200 rounded-xl px-3 py-2 max-w-prose">
            {m.content}
          </span>
        </div>
      ))}
    </div>
  );
}
