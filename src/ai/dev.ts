import { config } from 'dotenv';
config();

import '@/ai/flows/content-extraction.ts';
import '@/ai/flows/ai-report-generator.ts';
import '@/ai/flows/website-discovery.ts';