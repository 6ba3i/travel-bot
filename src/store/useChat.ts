import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt?: number;
}

interface ChatStore {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  
  // Actions
  send: (message: string, language?: string) => Promise<void>;
  newConversation: (language?: string) => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      loading: false,
      
      send: async (message: string, language: string = 'en') => {
        const { activeId, conversations } = get();
        
        if (!activeId) {
          console.error('No active conversation');
          return;
        }
        
        // Add user message
        const userMessage: Message = {
          role: 'user',
          content: message,
          timestamp: Date.now()
        };
        
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === activeId
              ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: Date.now() }
              : conv
          ),
          loading: true
        }));
        
        try {
          // Call the API
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message,
              language,
              conversationId: activeId,
              history: conversations.find(c => c.id === activeId)?.messages || []
            }),
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Add assistant message
          const assistantMessage: Message = {
            role: 'assistant',
            content: data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.',
            timestamp: Date.now()
          };
          
          set(state => ({
            conversations: state.conversations.map(conv =>
              conv.id === activeId
                ? { 
                    ...conv, 
                    messages: [...conv.messages, assistantMessage],
                    updatedAt: Date.now(),
                    // Update title if it's the first exchange
                    title: conv.messages.length === 1 ? message.slice(0, 50) : conv.title
                  }
                : conv
            ),
            loading: false
          }));
          
        } catch (error) {
          console.error('Error sending message:', error);
          
          // Add error message
          const errorMessage: Message = {
            role: 'assistant',
            content: 'Sorry, there was an error processing your request. Please try again.',
            timestamp: Date.now()
          };
          
          set(state => ({
            conversations: state.conversations.map(conv =>
              conv.id === activeId
                ? { ...conv, messages: [...conv.messages, errorMessage], updatedAt: Date.now() }
                : conv
            ),
            loading: false
          }));
        }
      },
      
      newConversation: (language: string = 'en') => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConv: Conversation = {
          id,
          title: language === 'fr' ? 'Nouvelle conversation' : 
                 language === 'zh' ? '新对话' : 
                 language === 'ar' ? 'محادثة جديدة' :
                 language === 'es' ? 'Nueva conversación' :
                 'New conversation',
          messages: [],
          createdAt: Date.now()
        };
        
        set(state => ({
          conversations: [newConv, ...state.conversations],
          activeId: id
        }));
      },
      
      selectConversation: (id: string) => {
        set({ activeId: id });
      },
      
      deleteConversation: (id: string) => {
        set(state => {
          const filtered = state.conversations.filter(c => c.id !== id);
          const newActiveId = state.activeId === id 
            ? (filtered[0]?.id || null)
            : state.activeId;
          
          return {
            conversations: filtered,
            activeId: newActiveId
          };
        });
      },
      
      updateConversationTitle: (id: string, title: string) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === id ? { ...conv, title } : conv
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