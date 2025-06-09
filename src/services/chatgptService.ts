import OpenAI from 'openai';
import { logger } from '../utils/logger';

// Make OpenAI client optional for testing
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    console.warn('⚠️  OPENAI_API_KEY not found - using mock responses for testing');
  }
} catch (error) {
  console.warn('⚠️  OpenAI client initialization failed - using mock responses');
}

export async function interpretDream(dreamText: string): Promise<string> {
  if (!openai) {
    // Return mock interpretation when OpenAI is not available
    return `✨ Mock interpretation for testing: Your dream about "${dreamText.substring(0, 50)}..." suggests themes of transformation and personal growth. This is a placeholder response while the OpenAI API key is not configured.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional dream interpreter. Analyze the following dream and provide meaningful insights about its potential symbolism and psychological significance.',
        },
        {
          role: 'user',
          content: dreamText,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const interpretation = response.choices[0]?.message?.content;
    if (!interpretation) {
      throw new Error('No interpretation received');
    }

    logger.info('Dream interpreted successfully');
    return interpretation;
  } catch (error) {
    logger.error('Error interpreting dream:', error);
    if (error instanceof Error) {
      throw new Error(`Dream interpretation failed: ${error.message}`);
    } else {
      throw new Error('Failed to interpret dream');
    }
  }
}

export async function interpretDreamWithChatGPT(dreamText: string): Promise<string> {
  if (!openai) {
    // Return mock interpretation when OpenAI is not available
    return `✨ Mock interpretation for testing: Your dream about "${dreamText.substring(0, 50)}..." suggests themes of transformation and personal growth. This is a placeholder response while the OpenAI API key is not configured.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Luna, an expert dream interpreter with deep knowledge of psychology, symbolism, and spiritual meanings. Provide insightful, compassionate, and meaningful interpretations of dreams. Your responses should be thoughtful, encouraging, and help the person understand potential meanings and connections to their waking life."
        },
        {
          role: "user",
          content: `Please interpret this dream: ${dreamText}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'Unable to interpret dream at this time.';
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    throw new Error('Failed to interpret dream. Please try again later.');
  }
} 