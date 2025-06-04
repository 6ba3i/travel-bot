import { create } from 'zustand';
import { chat } from '../lib/api';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

export const useChatStore = create<{
  messages: Msg[];
  loading: boolean;
  send: (content: string) => Promise<void>;
}>(set => ({
  messages: [],
  loading: false,
  send: async content => {
    // Debug logs
    console.log('Sending message:', content);
    
    // Set loading to true when sending
    set({ loading: true });
    
    // 1 — push the user message
    const userMsg: Msg = { role: 'user', content };
    set(s => ({ messages: [...s.messages, userMsg] }));

    try {
      // 2 — call the proxy → Mistral
      console.log('Calling API with messages:', [...useChatStore.getState().messages, userMsg]);
      const data = await chat([...useChatStore.getState().messages, userMsg]);
      console.log('API response:', data);

      // Check if we have a valid response with choices
      if (!data || !data.choices || !data.choices[0]) {
        console.error('Invalid response format from API:', data);
        throw new Error('Invalid response from chat API');
      }

      // 3 — pull the assistant's text from .content
      const assistantContent = data.choices[0].message?.content;
      console.log('Assistant content:', assistantContent);
      
      if (typeof assistantContent !== 'string') {
        console.error('Invalid or missing content in response:', data.choices[0]);
        throw new Error('Missing content in assistant response');
      }
      
      // Check if the response starts with "I'm a travel-only assistant" and remove it if so
      let cleanedContent = assistantContent;
      if (cleanedContent.startsWith("I'm a travel-only assistant")) {
        const contentParts = cleanedContent.split(".");
        if (contentParts.length > 1) {
          // Remove the first sentence
          cleanedContent = contentParts.slice(1).join(".").trim();
        }
      }

      const assistant: Msg = {
        role: 'assistant',
        content: cleanedContent
      };

      // 4 — push the assistant reply
      set(s => ({ messages: [...s.messages, assistant], loading: false }));
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add an error message to the chat
      const errorMsg: Msg = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      };
      set(s => ({ messages: [...s.messages, errorMsg], loading: false }));
    }
  }
}));