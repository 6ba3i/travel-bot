// src/store/useChatStore.ts
import { create } from 'zustand'
import { searchFlights, Flight, SearchFlightsParams } from '../lib/flightApi'

/** A chat message, optionally carrying flight data */
export type Message =
  | { role: 'user';    content: string }
  | { role: 'assistant'; content: string; flights?: Flight[] }

interface ChatState {
  messages: Message[]
  send: (input: string) => Promise<void>
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],

  send: async (input: string) => {
    // 1. push the user’s text
    set((state) => ({
      messages: [...state.messages, { role: 'user', content: input }],
    }))

    // 2. detect a “find flights” intent
    const flightRegex =
      /from\s+([A-Z]{3})\s+to\s+([A-Z]{3})\s+on\s+(\d{4}-\d{2}-\d{2})(?:\s+return\s+on\s+(\d{4}-\d{2}-\d{2}))?/i
    const match = flightRegex.exec(input)
    if (match) {
      const [, origin, destination, date, returnDate] = match
      const tripType = returnDate ? 'round_trip' : 'one_way'

      try {
        // 3. call your SerpAPI wrapper
        const params: SearchFlightsParams = {
          origin,
          destination,
          date,
          returnDate,
          tripType,
        }
        const { data: flights } = await searchFlights(params)

        // 4. push an assistant message with the flights array
        set((state) => ({
          messages: [
            ...state.messages,
            {
              role: 'assistant',
              content: `Here are the cheapest ${tripType === 'round_trip' ? 'round-trip' : 'one-way'} flights:`,
              flights,
            },
          ],
        }))
      } catch {
        set((state) => ({
          messages: [
            ...state.messages,
            { role: 'assistant', content: 'Sorry, I couldn’t fetch flights right now. Try again later.' },
          ],
        }))
      }
      return
    }

    // 5. fallback to your regular LLM call…
  },
}))
