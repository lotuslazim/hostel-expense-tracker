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


export const DailyLogSchema = z.object({
  date: z.string(),
  meals: z.number(),
  expenses: z.object({
    food: z.number(),
    electricity: z.number(),
    gas: z.number(),
  }),
});
export type DailyLog = z.infer<typeof DailyLogSchema>;

export const MemberDailyDataSchema = z.object({
    dailyData: z.array(DailyLogSchema),
});
export type MemberDailyData = z.infer<typeof MemberDailyDataSchema>;
