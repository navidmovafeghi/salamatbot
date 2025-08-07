/**
 * OpenAI Integration for Triage System
 * 
 * Provides alternative AI provider alongside Gemini
 * Uses OpenRouter proxy for cost-effective access
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TriageResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate chat completion using OpenAI/OpenRouter
 */
export async function generateTriageResponse(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<TriageResponse> {
  const {
    model = 'openai/gpt-4o',
    temperature = 0.3,
    max_tokens = 500
  } = options;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens
    });

    const response = completion.choices[0]?.message?.content || '';
    
    return {
      content: response,
      usage: completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      } : undefined
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`OpenAI API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate final triage response with more tokens for detailed content
 */
export async function generateFinalTriageResponse(
  messages: ChatMessage[],
  category: string
): Promise<TriageResponse> {
  return generateTriageResponse(messages, {
    model: 'openai/gpt-4o',
    temperature: 0.3,
    max_tokens: 800 // More tokens for detailed final responses
  });
}

/**
 * Check if OpenAI is configured and available
 */
export function isOpenAIConfigured(): boolean {
  return !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
}

export default openai;