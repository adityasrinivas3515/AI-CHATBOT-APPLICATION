const SYSTEM_PROMPT = 'You are AI Buddy, a friendly and helpful chatbot assistant. Keep your answers concise, clear, and conversational. Use plain text without markdown formatting.';

const localResponses = {
  joke: [
    "Why don't programmers like nature? It has too many bugs!",
    "Why did the developer go broke? Because he used up all his cache!",
    "How many programmers does it take to change a light bulb? None — that's a hardware problem!",
    "Why do Java developers wear glasses? Because they don't C#!",
    "What's a programmer's favorite hangout place? The Foo Bar!",
  ],
  fact: [
    "Did you know? The first computer bug was an actual moth found in a relay in 1947!",
    "Fun fact: Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that's still edible!",
    "Did you know? Octopuses have three hearts and blue blood!",
    "Fun fact: A day on Venus is longer than a year on Venus!",
  ],
};

function pickLocalResponse(message) {
  if (/joke|make me laugh|something funny/i.test(message)) {
    return localResponses.joke[Math.floor(Math.random() * localResponses.joke.length)];
  }
  if (/fun fact|interesting fact|did you know/i.test(message)) {
    return localResponses.fact[Math.floor(Math.random() * localResponses.fact.length)];
  }
  if (/what(?:'s| is) the time|current time|time (?:is it|now)/i.test(message)) {
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  }
  if (/what(?:'s| is) (?:the|today's) date|what day is it|today's date|current date/i.test(message)) {
    return `Today is ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
  }
  const mathMatch = message.match(/(?:what(?:'s| is)|calculate|compute|solve)\s+(.+)|^([\d\s+\-*/().%]+)$/i);
  if (mathMatch) {
    const expr = (mathMatch[1] || mathMatch[2] || '').trim();
    const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
    if (sanitized) {
      try {
        const result = Function(`"use strict"; return (${sanitized})`)();
        if (typeof result === 'number' && isFinite(result)) return `${expr} = ${result}`;
      } catch {}
    }
  }
  return null;
}

export async function getBotResponse(userMessage, conversationHistory) {
  const local = pickLocalResponse(userMessage);
  if (local) return local;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.slice(-8),
    { role: 'user', content: userMessage },
  ];

  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: 'openai',
        seed: Math.floor(Math.random() * 1000000),
      }),
    });

    if (!res.ok) throw new Error(`API returned ${res.status}`);

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (text && text.trim()) return text.trim();
    throw new Error('Empty response');
  } catch {
    try {
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(userMessage)}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) return text.trim();
      }
    } catch {}
  }

  return "I'm having trouble connecting to my AI brain right now. Please try again in a moment!";
}
