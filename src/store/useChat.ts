import { create } from 'zustand';
import { chat } from '../lib/api';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

export const useChatStore = create<{
  messages: Msg[];
  send: (content: string) => Promise<void>;
}>(set => ({
  messages: [],
  send: async content => {
    // 1 — push the user message
    const userMsg: Msg = { role: 'user', content };
    set(s => ({ messages: [...s.messages, userMsg] }));

    // 2 — call the proxy → Mistral
    const data = await chat([...useChatStore.getState().messages, userMsg]);

    // 3 — **pull the assistant’s text from .content**
    const assistant: Msg = {
      role: 'assistant',
      content: data.choices[0].message.content   // ← THIS line is the fix
    };

    // 4 — push the assistant reply
    set(s => ({ messages: [...s.messages, assistant] }));
  }
}));
