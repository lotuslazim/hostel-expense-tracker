'use server';

/**
 * @fileOverview A monthly summary report generator.
 *
 * - generateMonthlySummary - A function that generates a summary of meals and expenses.
 * - GenerateMonthlySummaryInput - The input type for the generateMonthlySummary function.
 * - GenerateMonthlySummaryOutput - The return type for the generateMonthlySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyDataSchema = z.object({
  day: z.number().describe('The day of the month.'),
  meals: z.number().describe('The number of meals logged on this day.'),
  foodExpense: z.number().describe('The total food expense for this day.'),
  electricityBill: z.number().describe('The electricity bill payment for this day.'),
  gasBill: z.number().describe('The gas bill payment for this day.'),
});

const GenerateMonthlySummaryInputSchema = z.object({
  month: z.string().describe("The month for the summary (e.g., 'September 2025')."),
  dailyData: z.array(DailyDataSchema).describe('An array of daily logs for the month.'),
});
export type GenerateMonthlySummaryInput = z.infer<typeof GenerateMonthlySummaryInputSchema>;

const MonthlySummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the user\'s monthly activity.'),
  averageUser: z.object({
    mealCount: z.number().describe('The average number of meals logged by a typical user in a month.'),
    foodExpense: z.number().describe('The average food expense for a typical user in a month.'),
    utilityExpense: z.number().describe('The average utility (electricity + gas) expense for a typical user in a month.'),
  }),
});
export type MonthlySummaryOutput = z.infer<typeof MonthlySummaryOutputSchema>;

export async function generateMonthlySummary(input: GenerateMonthlySummaryInput): Promise<MonthlySummaryOutput> {
  return generateMonthlySummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMonthlySummaryPrompt',
  input: {schema: GenerateMonthlySummaryInputSchema},
  output: {schema: MonthlySummaryOutputSchema},
  prompt: `You are a personal finance and nutrition assistant. You will receive a month of daily data logs.

You will generate a concise summary report that provides insights into the user's eating habits and spending patterns for the month of {{{month}}}. The summary should include key observations and potential areas for improvement based on the daily data.

Also provide a comparison against a typical user.

Daily Data:
{{#each dailyData}}
Day {{day}}: {{meals}} meals, Food: ৳{{foodExpense}}, Electricity: ৳{{electricityBill}}, Gas: ৳{{gasBill}}
{{/each}}
`,
});

const generateMonthlySummaryFlow = ai.defineFlow(
  {
    name: 'generateMonthlySummaryFlow',
    inputSchema: GenerateMonthlySummaryInputSchema,
    outputSchema: MonthlySummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
