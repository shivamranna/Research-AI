"use client";

import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { discoverWebsites } from "@/ai/flows/website-discovery";
import { extractContent } from "@/ai/flows/content-extraction";
import { generateReport, type GenerateReportOutput } from "@/ai/flows/ai-report-generator";
import { useToast } from "@/hooks/use-toast";

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent
} from "@/components/ui/sidebar";
import { ReportDisplay } from "@/components/report-display";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, Trash2, History, CheckCircle2, Globe, FileText, Bot } from "lucide-react";
import { Logo } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";

type ProgressStep = 'idle' | 'discovering' | 'extracting' | 'generating' | 'done' | 'error';

export function MainPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<GenerateReportOutput | null>(null);
  const [currentQuery, setCurrentQuery] = useState("");
  const [savedQueries, setSavedQueries] = useLocalStorage<string[]>("marketmind-queries", []);
  const [isClient, setIsClient] = useState(false);

  // New state for step-by-step progress
  const [progress, setProgress] = useState<ProgressStep>('idle');
  const [discoveredWebsites, setDiscoveredWebsites] = useState<string[]>([]);
  const [totalWebsites, setTotalWebsites] = useState(0);
  const [extractedCount, setExtractedCount] = useState(0);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleQuerySubmit = async (submittedQuery: string) => {
    if (!submittedQuery.trim() || isLoading) return;

    setIsLoading(true);
    setReport(null);
    setCurrentQuery(submittedQuery);
    setDiscoveredWebsites([]);
    setExtractedCount(0);
    setTotalWebsites(0);
    
    try {
      // Step 1: Discover websites
      setProgress('discovering');
      const websiteDiscoveryResult = await discoverWebsites({ query: submittedQuery });
      const websites = websiteDiscoveryResult.websites;

      if (!websites || websites.length === 0) {
        throw new Error('Could not discover any relevant websites. Try a different query.');
      }
      
      const websitesToCrawl = websites.slice(0, 5);
      setDiscoveredWebsites(websitesToCrawl);
      setTotalWebsites(websitesToCrawl.length);

      // Step 2: Extract content from all websites in parallel
      setProgress('extracting');
      let allContent = '';
      const contentPromises = websitesToCrawl.map(url =>
        extractContent({ url }).then(result => {
          setExtractedCount(prev => prev + 1);
          return result;
        }).catch(err => {
          console.warn(`Failed to extract content from ${url}:`, err.message);
          setExtractedCount(prev => prev + 1); // Still increment for progress bar
          return { extractedContent: '' };
        })
      );
      
      const extractedContents = await Promise.all(contentPromises);
      allContent = extractedContents
        .map(c => c.extractedContent)
        .filter(Boolean)
        .join('\n\n---\n\n');

      if (!allContent.trim()) {
        toast({
          variant: "destructive",
          title: "Content Extraction Failed",
          description: "Could not extract meaningful content from the discovered websites. They may be blocking automated access. Please try a different query.",
        });
        setProgress('error');
        setIsLoading(false);
        return;
      }

      // Step 3: Generate the report
      setProgress('generating');
      const newReport = await generateReport({
        extractedContent: allContent,
        query: submittedQuery,
      });

      setReport(newReport);
      setProgress('done');
      if (!savedQueries.includes(submittedQuery)) {
        setSavedQueries(prev => [submittedQuery, ...prev].slice(0, 50));
      }
    } catch (error: any) {
      console.error('Error in market research flow:', error);
      setProgress('error');
      toast({
        variant: "destructive",
        title: "Report Generation Failed",
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteQuery = (queryToDelete: string) => {
    setSavedQueries(savedQueries.filter(q => q !== queryToDelete));
  };
  
  const handleClearHistory = () => {
    setSavedQueries([]);
    toast({ title: "Query history cleared." });
  };

  const renderLoadingContent = () => {
    const steps = [
      { id: 'discovering', icon: Globe, text: 'Discovering relevant websites...', status: progress === 'discovering' ? 'active' : (discoveredWebsites.length > 0 ? 'complete' : 'pending') },
      { id: 'extracting', icon: FileText, text: `Extracting content (${extractedCount}/${totalWebsites})...`, status: progress === 'extracting' ? 'active' : (extractedCount === totalWebsites && totalWebsites > 0 ? 'complete' : 'pending') },
      { id: 'generating', icon: Bot, text: 'Generating your report...', status: progress === 'generating' ? 'active' : (report ? 'complete' : 'pending') },
    ];

    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center animate-fade-in">
        <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-headline">Generating Your Report</h2>
            <p className="text-muted-foreground max-w-md">
            MarketMind AI is analyzing the web to craft your report.
            </p>
        </div>
        
        <Card className="w-full max-w-lg p-6">
            <ul className="space-y-4">
            {steps.map((step, index) => (
                <motion.li 
                    key={step.id} 
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                    {step.status === 'active' && <Loader2 className="h-5 w-5 animate-spin" />}
                    {step.status === 'complete' && <CheckCircle2 className="h-5 w-5" />}
                    {step.status === 'pending' && <step.icon className="h-5 w-5" />}
                </div>
                <span className="flex-1 text-left text-muted-foreground">{step.text}</span>
                </motion.li>
            ))}
            </ul>
        </Card>
        
        <AnimatePresence>
          {progress === 'extracting' && discoveredWebsites.length > 0 && (
            <motion.div 
              className="w-full max-w-lg text-left"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="font-semibold mb-2">Sources:</h3>
              <Card className="max-h-40 overflow-hidden">
                <ScrollArea className="h-40">
                  <div className="p-4 space-y-2">
                  {discoveredWebsites.map((site, index) => (
                    <div key={index} className="text-sm text-muted-foreground truncate">{site}</div>
                  ))}
                  </div>
                </ScrollArea>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return renderLoadingContent();
    }

    if (report) {
      return <ReportDisplay report={report} query={currentQuery} />;
    }

    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto animate-fade-in">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-3">
              <Wand2 className="h-6 w-6 text-primary" />
              <span>Start Your Market Research</span>
            </CardTitle>
            <CardDescription>
              Enter a topic below to generate a comprehensive market research report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleQuerySubmit(query); }} className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'The future of electric vertical takeoff and landing (eVTOL) aircraft in urban mobility'"
                rows={4}
                className="text-base"
                disabled={isLoading}
              />
              <Button type="submit" className="w-full" size="lg" disabled={!query.trim() || isLoading}>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">MarketMind AI</h1>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0">
          <div className="flex h-full flex-col p-2 pt-0">
             <h3 className="px-2 pt-2 pb-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground group-data-[collapsible=icon]:hidden">
              History
            </h3>
            <ScrollArea className="flex-1">
              {isClient && savedQueries.length > 0 ? (
                <ul className="space-y-1">
                  {savedQueries.map((q, index) => (
                    <li key={index} className="group relative">
                      <Button
                        variant="ghost"
                        className="w-full h-auto justify-start p-2 text-left text-sm"
                        onClick={() => { setQuery(q); handleQuerySubmit(q); }}
                        disabled={isLoading}
                        title={q}
                      >
                         <History className="h-4 w-4 mr-2 shrink-0" />
                         <span className="truncate group-data-[collapsible=icon]:hidden">{q}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 group-data-[collapsible=icon]:hidden"
                        onClick={() => handleDeleteQuery(q)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                isClient && <div className="p-4 text-center text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No saved queries.
                </div>
              )}
            </ScrollArea>
          </div>
        </SidebarContent>

        <SidebarFooter>
          {isClient && savedQueries.length > 0 && (
            <Button variant="outline" size="sm" className="w-full justify-center" onClick={handleClearHistory} disabled={isLoading}>
              <Trash2 className="h-4 w-4" />
              <span className="ml-2 group-data-[collapsible=icon]:hidden">Clear History</span>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
            {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
