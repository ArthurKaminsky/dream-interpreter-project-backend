import OpenAI from 'openai';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function interpretDream(dreamText: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a dream interpreter. Analyze the dream and provide a meaningful interpretation focusing on psychological and symbolic meanings"
        },
        {
          role: "user",
          content: dreamText
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    return completion.choices[0].message.content || 'No interpretation available';
  } catch (error) {
    logger.error('Error interpreting dream:', error);
    throw new Error('Failed to interpret dream');
  }
} 