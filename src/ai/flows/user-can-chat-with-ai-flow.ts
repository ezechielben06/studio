'use server';
/**
 * @fileOverview This file implements a Genkit flow for free-form conversational AI.
 *
 * - chatWithAI - A function that allows users to send messages to the AI and receive intelligent responses.
 * - UserChatMessage - The input type for the chatWithAI function.
 * - AIChatResponse - The return type for the chatWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserChatMessageSchema = z
  .object({
    message: z.string().describe('The message from the user to the AI.'),
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
  return chatWithAIFlow(input);
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
    const {output} = await chatPrompt(input);
    return output!;
  }
);
