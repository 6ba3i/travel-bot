import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chat } from '../lib/api';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Msg[];
}

interface ChatState {
  conversations: Conversation[];
  activeId: string;
  loading: boolean;
  send: (content: string) => Promise<void>;
  newConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
}

export const useChatStore = create(
  persist<ChatState>(
    (set, get) => {
      const firstId = Date.now().toString();
      return {
        conversations: [
          { id: firstId, title: 'New chat', messages: [] }
        ],
        activeId: firstId,
        loading: false,
      send: async (content: string) => {
        const state = get();
        const conv = state.conversations.find(c => c.id === state.activeId);
        if (!conv) return;

        set({ loading: true });
        conv.messages.push({ role: 'user', content });
        set({ conversations: [...state.conversations] });

        try {
          const data = await chat(conv.messages);

          if (!data || !data.choices || !data.choices[0]) {
            throw new Error('Invalid response from chat API');
          }

          let assistantContent = data.choices[0].message?.content;
          if (typeof assistantContent !== 'string') {
            throw new Error('Missing content in assistant response');
          }

          if (assistantContent.startsWith("I'm a travel-only assistant")) {
            const parts = assistantContent.split('.');
            if (parts.length > 1) {
              assistantContent = parts.slice(1).join('.').trim();
            }
          }

          conv.messages.push({ role: 'assistant', content: assistantContent });
          if (conv.title === 'New chat') {
            conv.title = content.slice(0, 20);
          }

          set({ conversations: [...state.conversations], loading: false });
        } catch (error) {
          conv.messages.push({
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your request. Please try again.'
          });
          set({ conversations: [...state.conversations], loading: false });
        }
      },
      newConversation: () => {
        const id = Date.now().toString();
        set(state => ({
          conversations: [...state.conversations, { id, title: 'New chat', messages: [] }],
          activeId: id
        }));
      },
      selectConversation: (id: string) => {
        set({ activeId: id });
      },
      deleteConversation: (id: string) => {
        set(state => {
          const remaining = state.conversations.filter(c => c.id !== id);
          let activeId = state.activeId;
          if (activeId === id) {
            if (remaining.length === 0) {
              const newId = Date.now().toString();
              return {
                conversations: [{ id: newId, title: 'New chat', messages: [] }],
                activeId: newId
              };
            }
            activeId = remaining[0].id;
          }
          return { conversations: remaining, activeId };
        });
      }
    };
    },
    { name: 'travel-chat' }
  )
);
