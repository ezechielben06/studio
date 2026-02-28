'use server';
/**
 * @fileOverview This file implements a robust Genkit flow for AI chat with detailed error reporting.
 *
 * - chatWithAI - Main function to interact with the LLM.
 * - UserChatMessage - Input schema (message + optional model).
 * - AIChatResponse - Output schema.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserChatMessageSchema = z
  .object({
    message: z.string().describe('Le message de l\'utilisateur.'),
    model: z.string().optional().describe('L\'ID du modèle à utiliser.'),
  })
  .describe('Schéma d\'entrée pour le chat IA.');
export type UserChatMessage = z.infer<typeof UserChatMessageSchema>;

const AIChatResponseSchema = z
  .object({
    response: z.string().describe('La réponse de l\'IA.'),
  })
  .describe('Schéma de sortie pour le chat IA.');
export type AIChatResponse = z.infer<typeof AIChatResponseSchema>;

/**
 * Appelle le flux de chat IA avec une gestion d'erreur robuste.
 */
export async function chatWithAI(input: UserChatMessage): Promise<AIChatResponse> {
  try {
    return await chatWithAIFlow(input);
  } catch (error: any) {
    // Extraction d'un message d'erreur lisible pour l'utilisateur final
    let userFriendlyMessage = "Une erreur est survenue lors de la communication avec l'IA.";
    
    if (error.message?.includes('API_KEY_INVALID')) {
      userFriendlyMessage = "La clé API Google AI est invalide. Vérifiez vos paramètres Netlify.";
    } else if (error.message?.includes('quota')) {
      userFriendlyMessage = "Le quota gratuit de l'API est épuisé. Réessayez dans quelques minutes.";
    } else if (error.message?.includes('missing')) {
      userFriendlyMessage = error.message;
    }

    console.error('Erreur Libre Chat Flow:', error);
    throw new Error(userFriendlyMessage);
  }
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: UserChatMessageSchema},
  output: {schema: AIChatResponseSchema},
  prompt: `Tu es Libre Chat, un assistant IA intelligent, précis et chaleureux. 
Engage une conversation naturelle et aide l'utilisateur de manière constructive.

Utilisateur: {{{message}}}`,
});

const chatWithAIFlow = ai.defineFlow(
  {
    name: 'chatWithAIFlow',
    inputSchema: UserChatMessageSchema,
    outputSchema: AIChatResponseSchema,
  },
  async input => {
    // Vérification de sécurité pour les variables d'environnement
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY);
    
    if (!hasApiKey) {
      throw new Error("Configuration incomplète : La variable d'environnement GOOGLE_GENAI_API_KEY est manquante sur Netlify.");
    }

    // Utilisation du modèle demandé ou fallback sur gemini-2.0-flash pour la rapidité
    const selectedModel = input.model || 'googleai/gemini-2.0-flash';

    const {output} = await chatPrompt(input, {
      model: selectedModel as any,
    });
    
    if (!output || !output.response) {
      throw new Error("L'IA n'a pas pu générer de texte. Essayez de reformuler votre message.");
    }
    
    return output;
  }
);
