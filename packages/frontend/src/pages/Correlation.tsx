import { Suspense } from 'react';
import { CorrelationHeatmap } from '@/components/CorrelationHeatmap';
import { CorrelationHeatmapSkeleton } from '@/components/skeletons';

export function Correlation() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Correlation</h1>
        <p className="text-sm text-muted-foreground">
          Pearson r between 4 weather metrics × 4 music metrics across all collected hours.
        </p>
      </header>

      <Suspense fallback={<CorrelationHeatmapSkeleton />}>
        <CorrelationHeatmap />
      </Suspense>
    </div>
  );
}
