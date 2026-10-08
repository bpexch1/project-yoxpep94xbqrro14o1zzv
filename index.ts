import { generateText } from 'ai';

// Run with: bun index.ts
// Bun automatically loads .env.local. Never commit that file.
const { text } = await generateText({
  model: 'moonshotai/kimi-k3',
  prompt: 'Invent a new holiday and describe its traditions.',
});

if (!text.trim()) {
  throw new Error('AI Gateway returned no generated text.');
}

console.log(text);
