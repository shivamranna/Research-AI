'use server';

/**
 * @fileOverview Extracts relevant content from a given URL.
 *
 * - extractContent - A function that handles the content extraction process.
 * - ContentExtractionInput - The input type for the extractContent function.
 * - ContentExtractionOutput - The return type for the extractContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContentExtractionInputSchema = z.object({
  url: z.string().url().describe('The URL to extract content from.'),
});
export type ContentExtractionInput = z.infer<typeof ContentExtractionInputSchema>;

const ContentExtractionOutputSchema = z.object({
  extractedContent: z.string().describe('The extracted content from the URL.'),
});
export type ContentExtractionOutput = z.infer<typeof ContentExtractionOutputSchema>;

const RawContentExtractionInputSchema = z.object({
  rawContent: z.string().describe('The raw HTML content of a webpage.'),
});

export async function extractContent(input: ContentExtractionInput): Promise<ContentExtractionOutput> {
  return contentExtractionFlow(input);
}

const urlExtractionPrompt = ai.definePrompt({
  name: 'urlExtractionPrompt',
  input: {schema: ContentExtractionInputSchema},
  output: {schema: ContentExtractionOutputSchema},
  prompt: `You are an expert web content extractor.

  Extract the relevant content from the following URL:

  URL: {{{url}}}
  Context: The user is doing market research, so extract content most relevant to that.`,
});

const rawContentExtractionPrompt = ai.definePrompt({
  name: 'rawContentExtractionPrompt',
  input: {schema: RawContentExtractionInputSchema},
  output: {schema: ContentExtractionOutputSchema},
  prompt: `You are an expert web content cleaner. From the following raw HTML, extract the meaningful text content.
  
  Remove all navigation, ads, footers, and other boilerplate. Focus on the main article or body content.

  Raw Content:
  {{{rawContent}}}
  `,
});

const contentExtractionFlow = ai.defineFlow(
  {
    name: 'contentExtractionFlow',
    inputSchema: ContentExtractionInputSchema,
    outputSchema: ContentExtractionOutputSchema,
  },
  async input => {
    // 1. Try direct AI extraction from URL
    try {
      const {output} = await urlExtractionPrompt(input);
      if (output && output.extractedContent.trim().length > 50) { // Check for meaningful content
        return output;
      }
    } catch (e) {
      console.warn(`AI content extraction from URL failed for ${input.url}, falling back to raw text extraction.`, e)
    }
    
    // 2. Fallback: Fetch raw HTML and use another AI to clean it.
    try {
      const response = await fetch(input.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      const rawHtml = await response.text();
      
      const { output } = await rawContentExtractionPrompt({ rawContent: rawHtml.substring(0, 20000) }); // Limit size
      
      if (output && output.extractedContent) {
        return output;
      }
      // If AI cleaning fails, return empty.
      return { extractedContent: "" };

    } catch(e) {
       console.error(`Raw text extraction and cleaning also failed for ${input.url}`, e);
       // Return empty if all methods fail.
       return { extractedContent: "" };
    }
  }
);
