import { useState } from 'react';
import { useChatStore } from '../store/useChat';

export default function InputBar() {
  const [value, setValue] = useState('');
  const send = useChatStore(s => s.send);

  const fire = () => {
    if (!value.trim()) return;
    send(value);
    setValue('');
  };

  return (
    <div className="border-t p-4 flex">
      <textarea
        className="flex-1 border rounded p-2 resize-none"
        rows={1}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            fire();
          }
        }}
      />
      <button className="ml-2 px-4 bg-blue-600 text-white rounded" onClick={fire}>
        Send
      </button>
    </div>
  );
}
