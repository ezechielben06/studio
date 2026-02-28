'use server';
/**
 * @fileOverview This file implements a Genkit flow for free-form conversational AI with model selection.
 *
 * - chatWithAI - A function that allows users to send messages to the AI and receive intelligent responses.
 * - UserChatMessage - The input type for the chatWithAI function, now includes an optional model preference.
 * - AIChatResponse - The return type for the chatWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserChatMessageSchema = z
  .object({
    message: z.string().describe('The message from the user to the AI.'),
    model: z.string().optional().describe('The specific model ID to use for this interaction.'),
  })
  .describe('Input schema for the AI chat flow.');
export type UserChatMessage = z.infer<typeof UserChatMessageSchema>;

const AIChatResponseSchema = z
  .object({
    response: z.string().describe('The AI\'s intelligent response to the user\'s message.'),
  })
  .describe('Output schema for the AI chat flow.');
export type AIChatResponse = z.infer<typeof AIChatResponseSchema>;

export async function chatWithAI(input: UserChatMessage): Promise<AIChatResponse> {
  try {
    return await chatWithAIFlow(input);
  } catch (error: any) {
    console.error('Genkit Flow Error:', error);
    throw new Error(error.message || 'Une erreur de connexion est survenue avec l\'IA.');
  }
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: UserChatMessageSchema},
  output: {schema: AIChatResponseSchema},
  prompt: `You are a helpful, respectful, and honest AI assistant. You will engage in a free-form conversation with the user, providing coherent and intelligent responses. Your goal is to be a pleasant and informative conversational partner.

User: {{{message}}}`,
});

const chatWithAIFlow = ai.defineFlow(
  {
    name: 'chatWithAIFlow',
    inputSchema: UserChatMessageSchema,
    outputSchema: AIChatResponseSchema,
  },
  async input => {
    // Vérifier si la clé API est présente (côté serveur uniquement)
    if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('La clé API Google AI est manquante dans les variables d\'environnement.');
    }

    const {output} = await chatPrompt(input, {
      model: input.model as any,
    });
    
    if (!output) {
      throw new Error('L\'IA n\'a pas généré de réponse.');
    }
    
    return output;
  }
);
