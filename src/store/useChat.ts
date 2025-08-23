// src/store/useChat.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  language: string;
}

interface ChatStore {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  send: (message: string, language: string) => Promise<void>;
  newConversation: (language: string) => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAll: () => void;
  updateConversationTitle: (id: string, title: string) => void;
}

const API_URL = ''; // Empty string means use relative URLs

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      loading: false,
      error: null,

      send: async (message: string, language: string) => {
        console.log('📤 Sending message:', message);
        const { activeId, conversations } = get();
        
        // Create new conversation if none exists
        if (!activeId) {
          console.log('Creating new conversation...');
          get().newConversation(language);
          // Wait a tick for state to update
          setTimeout(() => get().send(message, language), 100);
          return;
        }

        // Add user message immediately
        const userMessage: Message = {
          role: 'user',
          content: message,
          timestamp: Date.now()
        };

        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === activeId
              ? { 
                  ...conv, 
                  messages: [...conv.messages, userMessage],
                  updatedAt: Date.now()
                }
              : conv
          ),
          loading: true,
          error: null
        }));

        try {
          const apiEndpoint = '/api/chat';
          console.log('🌐 Calling API:', apiEndpoint);
          
          const requestBody = {
            message,
            language,
            conversationId: activeId
          };
          
          console.log('📦 Request body:', requestBody);
          
          // Send to API
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          console.log('📥 Response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`API Error (${response.status}): ${errorText}`);
          }

          const data = await response.json();
          console.log('✅ API Response data:', data);
          
          if (!data.response) {
            console.error('⚠️ No response field in data:', data);
          }
          
          // Add assistant message
          const assistantMessage: Message = {
            role: 'assistant',
            content: data.response || data.message || 'No response received',
            timestamp: Date.now()
          };

          set(state => ({
            conversations: state.conversations.map(conv => {
              if (conv.id === activeId) {
                const updatedConv = {
                  ...conv,
                  messages: [...conv.messages, assistantMessage],
                  updatedAt: Date.now()
                };
                
                // Update title if it's the first exchange
                if (conv.messages.length === 1 && conv.title === 'New Chat') {
                  updatedConv.title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
                }
                
                return updatedConv;
              }
              return conv;
            }),
            loading: false
          }));
        } catch (error) {
          console.error('❌ Error in send function:', error);
          
          // Add error message to chat
          const errorMessage: Message = {
            role: 'assistant',
            content: `⚠️ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check:\n1. Is the backend server running on port 3001?\n2. Are your API keys configured in .env?\n3. Check the console for more details.`,
            timestamp: Date.now()
          };

          set(state => ({
            conversations: state.conversations.map(conv =>
              conv.id === activeId
                ? { 
                    ...conv, 
                    messages: [...conv.messages, errorMessage],
                    updatedAt: Date.now()
                  }
                : conv
            ),
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to send message'
          }));
        }
      },

      newConversation: (language: string) => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConv: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          language
        };

        console.log('🆕 Created new conversation:', id);

        set(state => ({
          conversations: [newConv, ...state.conversations],
          activeId: id
        }));
      },

      selectConversation: (id: string) => {
        console.log('📂 Selected conversation:', id);
        set({ activeId: id });
      },

      deleteConversation: (id: string) => {
        set(state => {
          const filtered = state.conversations.filter(c => c.id !== id);
          const newActiveId = state.activeId === id 
            ? (filtered[0]?.id || null)
            : state.activeId;
          
          console.log('🗑️ Deleted conversation:', id);
          
          return {
            conversations: filtered,
            activeId: newActiveId
          };
        });
      },

      clearAll: () => {
        console.log('🧹 Clearing all conversations');
        set({
          conversations: [],
          activeId: null,
          loading: false,
          error: null
        });
      },

      updateConversationTitle: (id: string, title: string) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === id
              ? { ...conv, title, updatedAt: Date.now() }
              : conv
          )
        }));
      }
    }),
    {
      name: 'travel-chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        activeId: state.activeId
      })
    }
  )
);