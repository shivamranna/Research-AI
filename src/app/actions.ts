'use server';

import { discoverWebsites } from '@/ai/flows/website-discovery';
import { extractContent } from '@/ai/flows/content-extraction';
import { generateReport, type GenerateReportOutput } from '@/ai/flows/ai-report-generator';

class MarketMindError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketMindError';
  }
}

// Note: This function is no longer used by the frontend, 
// but is kept for reference or potential future use.
export async function runMarketResearch(
  query: string
): Promise<{ report: GenerateReportOutput | null; error: string | null }> {
  try {
    // Step 1: Discover websites
    const websiteDiscoveryResult = await discoverWebsites({ query });
    const websites = websiteDiscoveryResult.websites;

    if (!websites || websites.length === 0) {
      throw new MarketMindError('Could not discover any relevant websites. Try a different query.');
    }

    // Using a smaller subset for performance in this example app
    const websitesToCrawl = websites.slice(0, 5);

    // Step 2: Extract content from all websites in parallel
    const contentPromises = websitesToCrawl.map(url =>
      extractContent({ url }).catch(err => {
        // Log the error but don't fail the entire process
        console.warn(`Failed to extract content from ${url}:`, err.message);
        return { extractedContent: '' };
      })
    );
    const extractedContents = await Promise.all(contentPromises);

    const allContent = extractedContents
      .map(c => c.extractedContent)
      .filter(Boolean)
      .join('\n\n---\n\n');

    if (!allContent.trim()) {
      throw new MarketMindError('Could not extract any meaningful content from the discovered websites.');
    }

    // Step 3: Generate the report
    const report = await generateReport({
      extractedContent: allContent,
      query,
    });

    return { report, error: null };
  } catch (error) {
    console.error('Error in market research flow:', error);
    const errorMessage = error instanceof MarketMindError 
      ? error.message 
      : 'An unexpected error occurred while generating the report. Please try again later.';
    return { report: null, error: errorMessage };
  }
}
