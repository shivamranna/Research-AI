'use server';

/**
 * @fileOverview A market research report generation AI agent.
 *
 * - generateReport - A function that generates a market research report.
 * - GenerateReportInput - The input type for the generateReport function.
 * - GenerateReportOutput - The return type for the generateReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReportInputSchema = z.object({
  extractedContent: z
    .string()
    .describe('The extracted content from the crawled webpages.'),
  query: z.string().describe('The market research query.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  executiveSummary: z.string().describe('The executive summary of the market research report.'),
  marketContext: z.string().describe('The context of the market.'),
  currentTrends: z.string().describe('The current market trends.'),
  futureOutlook: z.string().describe('The future outlook of the market.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: {schema: GenerateReportInputSchema},
  output: {schema: GenerateReportOutputSchema},
  prompt: `You are an expert market research analyst.

  Based on the extracted content from various webpages, generate a comprehensive market research report.
  The report should include the following sections:

  1. Executive Summary: A brief overview of the market research findings.
  2. Market Context: Background information and relevant details about the market.
  3. Current Trends: The latest trends and developments in the market.
  4. Future Outlook: Predictions and expectations for the market's future.

  Extracted Content:
  {{extractedContent}}

  Market Research Query: {{query}}

  Ensure that the report is well-structured and easy to understand. Adhere strictly to the output schema.

  Output in JSON format:
  `,
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
