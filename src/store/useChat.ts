// src/store/useChat.ts - Enhanced with language support and better response handling
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
  language?: string;
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  currentLanguage: string;
  send: (content: string, language?: string) => Promise<void>;
  newConversation: (language?: string) => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  setLanguage: (language: string) => void;
  translateConversation: (targetLanguage: string) => Promise<void>;
}

// Enhanced API call with retry logic and better error handling
async function callChatAPI(messages: Message[], language: string = 'en'): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 API attempt ${attempt}/${maxRetries} with language: ${language}`);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          language 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.content) {
        throw new Error('No content in response');
      }

      console.log('✅ API call successful');
      return data.content;

    } catch (error) {
      console.error(`❌ API attempt ${attempt} failed:`, error);
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('All API attempts failed');
}

// Translation helper
async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, targetLanguage }),
    });

    if (!response.ok) {
      console.warn('Translation failed, returning original text');
      return text;
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      loading: false,
      currentLanguage: 'en',

      setLanguage: (language: string) => {
        set({ currentLanguage: language });
      },

      send: async (content: string, language?: string) => {
        const state = get();
        const activeLanguage = language || state.currentLanguage;
        
        if (state.loading) {
          console.warn('⚠️ Already processing a request, ignoring new send');
          return;
        }

        set({ loading: true });

        try {
          let conv = state.conversations.find(c => c.id === state.activeId);
          
          // Create new conversation if none exists
          if (!conv) {
            const id = Date.now().toString();
            conv = { 
              id, 
              title: 'New Chat', 
              messages: [],
              language: activeLanguage,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            set(state => ({
              conversations: [...state.conversations, conv],
              activeId: id
            }));
          }

          // Add user message
          const userMessage: Message = { 
            role: 'user', 
            content,
            timestamp: Date.now()
          };
          conv.messages.push(userMessage);
          conv.updatedAt = Date.now();

          // Update conversation language if specified
          if (language && conv.language !== language) {
            conv.language = language;
          }

          set({ conversations: [...state.conversations] });

          console.log('🤖 Sending request to TravelBot API...');
          
          // Wait for complete JSON response before proceeding
          const assistantContent = await callChatAPI(conv.messages, activeLanguage);

          // Add assistant response
          const assistantMessage: Message = {
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now()
          };
          conv.messages.push(assistantMessage);
          conv.updatedAt = Date.now();

          // Update conversation title with first user message
          if (conv.title === 'New Chat' && conv.messages.length >= 2) {
            conv.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
          }

          set({ conversations: [...state.conversations], loading: false });

        } catch (error) {
          console.error('❌ Send error:', error);
          
          // Add error message to conversation
          const conv = state.conversations.find(c => c.id === state.activeId);
          if (conv) {
            const errorMessage: Message = {
              role: 'assistant',
              content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
              timestamp: Date.now()
            };
            conv.messages.push(errorMessage);
            conv.updatedAt = Date.now();
          }

          set({ conversations: [...state.conversations], loading: false });
        }
      },

      newConversation: (language?: string) => {
        const id = Date.now().toString();
        const activeLanguage = language || get().currentLanguage;
        
        const newConv: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          language: activeLanguage,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        set(state => ({
          conversations: [...state.conversations, newConv],
          activeId: id
        }));
      },

      selectConversation: (id: string) => {
        const conv = get().conversations.find(c => c.id === id);
        if (conv) {
          set({ 
            activeId: id,
            currentLanguage: conv.language || 'en'
          });
        }
      },

      deleteConversation: (id: string) => {
        set(state => {
          const remaining = state.conversations.filter(c => c.id !== id);
          let activeId = state.activeId;
          
          // If deleting active conversation, switch to another or create new one
          if (activeId === id) {
            if (remaining.length === 0) {
              const newId = Date.now().toString();
              const newConv: Conversation = {
                id: newId,
                title: 'New Chat',
                messages: [],
                language: state.currentLanguage,
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
              return {
                conversations: [newConv],
                activeId: newId
              };
            }
            // Switch to most recently updated conversation
            const mostRecent = remaining.sort((a, b) => b.updatedAt - a.updatedAt)[0];
            activeId = mostRecent.id;
          }
          
          return { 
            conversations: remaining, 
            activeId,
            currentLanguage: remaining.find(c => c.id === activeId)?.language || state.currentLanguage
          };
        });
      },

      translateConversation: async (targetLanguage: string) => {
        const state = get();
        const conv = state.conversations.find(c => c.id === state.activeId);
        
        if (!conv || state.loading) return;

        set({ loading: true });

        try {
          // Translate all assistant messages
          const translatedMessages = await Promise.all(
            conv.messages.map(async (message) => {
              if (message.role === 'assistant') {
                const translatedContent = await translateText(message.content, targetLanguage);
                return { ...message, content: translatedContent };
              }
              return message;
            })
          );

          // Update conversation
          conv.messages = translatedMessages;
          conv.language = targetLanguage;
          conv.updatedAt = Date.now();

          set({ 
            conversations: [...state.conversations],
            currentLanguage: targetLanguage,
            loading: false
          });

        } catch (error) {
          console.error('Translation error:', error);
          set({ loading: false });
        }
      }
    }),
    {
      name: 'travel-chat-enhanced',
      version: 2, // Increment version for migration
      migrate: (persistedState: any, version: number) => {
        // Migration logic for existing data
        if (version < 2) {
          // Add new fields to existing conversations
          if (persistedState.conversations) {
            persistedState.conversations = persistedState.conversations.map((conv: any) => ({
              ...conv,
              language: conv.language || 'en',
              createdAt: conv.createdAt || Date.now(),
              updatedAt: conv.updatedAt || Date.now(),
              messages: conv.messages.map((msg: any) => ({
                ...msg,
                timestamp: msg.timestamp || Date.now()
              }))
            }));
          }
          persistedState.currentLanguage = persistedState.currentLanguage || 'en';
        }
        return persistedState;
      }
    }
  )
);