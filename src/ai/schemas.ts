import {z} from 'genkit';

const MemberDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  meals: z.number(),
  expenses: z.object({
    food: z.number(),
    electricity: z.number(),
    gas: z.number(),
  }),
});

export const MonthlyGroupDataSchema = z.object({
  month: z.string(),
  members: z.array(MemberDataSchema),
});

export type MonthlyGroupData = z.infer<typeof MonthlyGroupDataSchema>;
