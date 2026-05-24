import { Suspense } from 'react';
import { TrackTable } from '@/components/TrackTable';
import { TrackTableSkeleton } from '@/components/skeletons';

export function Music() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Music</h1>
        <p className="text-sm text-muted-foreground">Top 50 PL tracks aggregated from the last 48h.</p>
      </header>
      <Suspense fallback={<TrackTableSkeleton />}>
        <TrackTable />
      </Suspense>
    </div>
  );
}
