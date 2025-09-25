'use server';

/**
 * @fileOverview A weekly summary report generator.
 *
 * - generateWeeklySummary - A function that generates a summary of meals, expenses, and item purchases.
 * - GenerateWeeklySummaryInput - The input type for the generateWeeklySummary function.
 * - GenerateWeeklySummaryOutput - The return type for the generateWeeklySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWeeklySummaryInputSchema = z.object({
  meals: z.string().describe('A summary of the meals logged this week.'),
  expenses: z.string().describe('A summary of the expenses logged this week.'),
  items: z.string().describe('A summary of the items purchased this week.'),
});
export type GenerateWeeklySummaryInput = z.infer<typeof GenerateWeeklySummaryInputSchema>;

const GenerateWeeklySummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the meals, expenses, and items purchased this week.'),
});
export type GenerateWeeklySummaryOutput = z.infer<typeof GenerateWeeklySummaryOutputSchema>;

export async function generateWeeklySummary(input: GenerateWeeklySummaryInput): Promise<GenerateWeeklySummaryOutput> {
  return generateWeeklySummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWeeklySummaryPrompt',
  input: {schema: GenerateWeeklySummaryInputSchema},
  output: {schema: GenerateWeeklySummaryOutputSchema},
  prompt: `You are a personal finance and nutrition assistant. You will receive summaries of meals, expenses, and items purchased during the week.

You will generate a concise summary report that provides insights into the user's eating habits and spending patterns. The summary should include key observations and potential areas for improvement.

Meals: {{{meals}}}
Expenses: {{{expenses}}}
Items Purchased: {{{items}}}

Summary:`,
});

const generateWeeklySummaryFlow = ai.defineFlow(
  {
    name: 'generateWeeklySummaryFlow',
    inputSchema: GenerateWeeklySummaryInputSchema,
    outputSchema: GenerateWeeklySummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
