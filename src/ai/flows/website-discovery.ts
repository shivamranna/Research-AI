'use server';

/**
 * @fileOverview Discovers the top 20 websites related to a market research query.
 *
 * - discoverWebsites - A function that takes a market research query and returns a list of relevant websites.
 * - DiscoverWebsitesInput - The input type for the discoverWebsites function.
 * - DiscoverWebsitesOutput - The return type for the discoverWebsites function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiscoverWebsitesInputSchema = z.object({
  query: z.string().describe('The market research query.'),
});
export type DiscoverWebsitesInput = z.infer<typeof DiscoverWebsitesInputSchema>;

const DiscoverWebsitesOutputSchema = z.object({
  websites: z.array(z.string()).describe('A list of the top 20 most relevant websites.'),
});
export type DiscoverWebsitesOutput = z.infer<typeof DiscoverWebsitesOutputSchema>;

export async function discoverWebsites(input: DiscoverWebsitesInput): Promise<DiscoverWebsitesOutput> {
  return discoverWebsitesFlow(input);
}

const discoverWebsitesPrompt = ai.definePrompt({
  name: 'discoverWebsitesPrompt',
  input: {schema: DiscoverWebsitesInputSchema},
  output: {schema: DiscoverWebsitesOutputSchema},
  prompt: `You are an expert market research assistant. Your task is to identify the top 20 most relevant websites for a given market research query.

  Query: {{{query}}}

  Please provide a list of 20 websites that would be most helpful for conducting research on this topic.  The websites should be diverse and authoritative.
  Format the output as a JSON array of strings.`,
});

const discoverWebsitesFlow = ai.defineFlow(
  {
    name: 'discoverWebsitesFlow',
    inputSchema: DiscoverWebsitesInputSchema,
    outputSchema: DiscoverWebsitesOutputSchema,
  },
  async input => {
    const {output} = await discoverWebsitesPrompt(input);
    return output!;
  }
);
