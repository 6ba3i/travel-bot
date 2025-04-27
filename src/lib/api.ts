export async function chat(messages: any[], functions?: any) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, functions })
    });
    return await res.json();
  }
  