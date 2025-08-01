import type { GenerateReportOutput } from "@/ai/flows/ai-report-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, LineChart, Target, Zap } from "lucide-react";
import { Separator } from "./ui/separator";

interface ReportDisplayProps {
  report: GenerateReportOutput;
  query: string;
}

const sectionConfig = {
  executiveSummary: {
    title: "Executive Summary",
    icon: BookOpen,
  },
  marketContext: {
    title: "Market Context",
    icon: Target,
  },
  currentTrends: {
    title: "Current Market Trends",
    icon: Zap,
  },
  futureOutlook: {
    title: "Future Outlook",
    icon: LineChart,
  },
};

export function ReportDisplay({ report, query }: ReportDisplayProps) {
  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Market Research Report</h1>
        <p className="text-muted-foreground max-w-3xl">
          An AI-generated analysis based on your query: <span className="text-foreground">"{query}"</span>
        </p>
      </div>
      <Separator />
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {(Object.keys(sectionConfig) as Array<keyof GenerateReportOutput>).map((key) => {
          const config = sectionConfig[key];
          const value = report[key];
          const Icon = config.icon;
          return (
            <Card key={key} className="flex flex-col border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 font-headline text-xl">
                  <Icon className="h-6 w-6 text-primary" />
                  <span>{config.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 text-muted-foreground whitespace-pre-wrap font-body leading-relaxed">
                {value}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
