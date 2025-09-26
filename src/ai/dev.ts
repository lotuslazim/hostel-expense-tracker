import { config } from 'dotenv';
config();

import '@/ai/flows/generate-monthly-summary.ts';
import '@/ai/flows/get-monthly-group-data.ts';
import '@/ai/flows/get-member-daily-data.ts';
