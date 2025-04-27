import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';          // Node 18: npm i node-fetch@3

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { messages, functions } = req.body;

  const openRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistral-small',
      messages,
      tools: functions,
      stream: false
    })
  });

  if (!openRes.ok) {
    const error = await openRes.text();
    return res.status(500).json({ error });
  }

  const data = await openRes.json();
  res.json(data);
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
