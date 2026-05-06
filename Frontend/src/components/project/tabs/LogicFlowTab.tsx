import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LogicFlowTab() {
  return (
    <Tabs defaultValue="business-logic" className="space-y-4">
      <TabsList className="bg-secondary/50 h-auto w-full max-w-full justify-start gap-1 overflow-x-auto overscroll-x-contain p-1 flex-nowrap [-webkit-overflow-scrolling:touch] sm:w-fit sm:justify-center">
        <TabsTrigger value="business-logic" className="shrink-0 px-2.5 text-xs sm:px-3 sm:text-sm">Business logic</TabsTrigger>
        <TabsTrigger value="flow-charts" className="shrink-0 px-2.5 text-xs sm:px-3 sm:text-sm">Flow charts</TabsTrigger>
      </TabsList>
      <TabsContent value="business-logic" className="min-h-[200px]" />
      <TabsContent value="flow-charts" className="min-h-[200px]" />
    </Tabs>
  );
}
