import { useState } from 'react';
import { CheckSquare, Cloud, Globe, ListChecks, Loader2, Plug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { webChecklist, apiChecklist, cloudChecklist, aiLlmChecklist } from '@/data/Checklistdata';
import type { ChecklistSection } from '@/data/Checklistdata';
import type { CLType } from '@/utils/projectTypes';
import { YellowAccentBlock, SectionHeading } from '@/components/project/accent-blocks';
import { cn } from '@/lib/utils';
import { findingTypeConfig } from '@/utils/severityHelpers';

const LlmChecklistIcon = findingTypeConfig.llm.Icon;

type Props = {
  clProgress: Record<string, Record<string, boolean>>;
  clSaving: Record<string, boolean>;
  checklistDetails: Record<string, { updated_by: string | null; updated_at: string | null }>;
  getUsername: (uid: string | null | undefined) => string;
  onToggleItem: (type: CLType, category: string, item: string) => Promise<void>;
};

const checklistTabs: { type: CLType; label: string; icon: React.ReactNode; data: ChecklistSection[] }[] = [
  { type: 'web', label: 'Web', icon: <Globe className="h-3.5 w-3.5 shrink-0" />, data: webChecklist },
  { type: 'api', label: 'API', icon: <Plug className="h-3.5 w-3.5 shrink-0" />, data: apiChecklist },
  { type: 'cloud', label: 'Cloud', icon: <Cloud className="h-3.5 w-3.5 shrink-0" />, data: cloudChecklist },
  { type: 'aiLlm', label: 'AI/LLM', icon: <LlmChecklistIcon className="h-3.5 w-3.5 shrink-0" />, data: aiLlmChecklist },
];

const checklistTitles: Record<CLType, { title: string; subtitle: string }> = {
  web: { title: 'Web Application Security Checklist', subtitle: 'Comprehensive web app testing checklist. Progress is saved per project.' },
  api: { title: 'API Security Checklist', subtitle: 'REST & GraphQL API security testing checklist. Progress is saved per project.' },
  cloud: { title: 'Cloud Security Checklist', subtitle: 'AWS, Azure & GCP security misconfiguration checklist. Progress is saved per project.' },
  aiLlm: { title: 'AI/LLM Security Checklist', subtitle: 'LLM-specific vulnerabilities: prompt injection, excessive agency, data exposure and more.' },
};

export default function ChecklistTab({ clProgress, clSaving, checklistDetails, getUsername, onToggleItem }: Props) {
  const [activeChecklistTab, setActiveChecklistTab] = useState<CLType>('web');

  const tabProgress = (type: CLType, data: ChecklistSection[]) => {
    const prog = clProgress[type] || {};
    const total = data.reduce((s, sec) => s + sec.items.length, 0);
    const done = data.reduce((s, sec) => s + sec.items.filter(i => prog[`${sec.category}::${i}`]).length, 0);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  };

  const renderChecklistContent = (type: CLType, data: ChecklistSection[]) => {
    const prog = clProgress[type] || {};
    const totalAll = data.reduce((s, sec) => s + sec.items.length, 0);
    const doneAll = data.reduce((s, sec) => s + sec.items.filter(i => prog[`${sec.category}::${i}`]).length, 0);
    const pctAll = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

    return (
      <div className="space-y-5">
        <div>
          <SectionHeading icon={ListChecks}>Overall progress</SectionHeading>
          <YellowAccentBlock>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm font-medium text-foreground/90">Completion</span>
              <span className="text-sm font-bold text-primary tabular-nums">
                {pctAll}% <span className="text-muted-foreground font-medium">({doneAll}/{totalAll})</span>
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden bg-secondary/40 border border-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${pctAll}%` }}
              />
            </div>
          </YellowAccentBlock>
        </div>

        <Accordion type="multiple" className="space-y-2">
          {data.map(section => {
            const done = section.items.filter(i => prog[`${section.category}::${i}`]).length;
            const pct = Math.round((done / section.items.length) * 100);
            return (
              <AccordionItem
                key={section.category}
                value={section.category}
                className="rounded-lg border border-border bg-secondary/15 overflow-hidden data-[state=open]:border-primary/30 data-[state=open]:bg-secondary/25"
              >
                <AccordionTrigger className="hover:no-underline px-3 py-3 sm:px-4">
                  <div className="flex w-full flex-col gap-2 pr-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-left">
                      <span className="truncate font-medium text-foreground">{section.category}</span>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <div className="h-2 min-w-[5rem] flex-1 rounded-full overflow-hidden border border-border bg-secondary/60 sm:w-24 sm:flex-none">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-11 text-right text-xs tabular-nums text-muted-foreground">
                        {done}/{section.items.length}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3 pt-0">
                  <div className="space-y-1 rounded-md border border-border/50 bg-muted/20 p-2">
                    {section.items.map(item => {
                      const key = `${section.category}::${item}`;
                      const isChecked = prog[key] || false;
                      const isSaving = clSaving[`${type}::${key}`] || false;
                      const details = checklistDetails[`${type}::${key}`];
                      const updatedByName = details?.updated_by ? getUsername(details.updated_by) : null;
                      const updatedAt = details?.updated_at ? new Date(details.updated_at).toLocaleDateString() : null;
                      return (
                        <label
                          key={item}
                          className={cn(
                            'flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border border-transparent',
                            'hover:bg-primary/5 hover:border-border/60',
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <Checkbox checked={isChecked} onCheckedChange={() => onToggleItem(type, section.category, item)} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className={cn(
                                'text-sm leading-relaxed',
                                isChecked ? 'text-muted-foreground line-through' : 'text-foreground',
                              )}
                            >
                              {item}
                            </span>
                            {isChecked && updatedByName && (
                              <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                <CheckSquare className="h-3 w-3 text-primary/80 shrink-0" />
                                <span>
                                  Checked by {updatedByName}
                                  {updatedAt && ` on ${updatedAt}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-md">
            <CheckSquare className="h-5 w-5" />
          </div> */}
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg leading-tight">{checklistTitles[activeChecklistTab].title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {checklistTitles[activeChecklistTab].subtitle}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeChecklistTab} onValueChange={v => setActiveChecklistTab(v as CLType)} className="w-full">
          <TabsList className="bg-secondary/50 h-auto w-full max-w-full justify-start gap-1 overflow-x-auto overscroll-x-contain p-1 flex-nowrap [-webkit-overflow-scrolling:touch] sm:w-fit sm:flex-wrap">
            {checklistTabs.map(({ type, label, icon, data }) => {
              const { pct } = tabProgress(type, data);
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="group shrink-0 gap-1.5 px-2.5 text-xs data-[state=active]:text-primary sm:px-3 sm:text-sm"
                >
                  {icon}
                  {label}
                  {pct > 0 && (
                    <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums bg-muted text-muted-foreground group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary">
                      {pct}%
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {checklistTabs.map(({ type, data }) => (
            <TabsContent key={type} value={type} className="mt-6 outline-none focus-visible:ring-0">
              {renderChecklistContent(type, data)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
