import { Suspense } from 'react';
import { WeatherCharts } from '@/components/WeatherCharts';
import { ChartsGridSkeleton } from '@/components/skeletons';

export function Weather() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Weather</h1>
        <p className="text-sm text-muted-foreground">Last 72 hours in Warsaw.</p>
      </header>
      <Suspense fallback={<ChartsGridSkeleton count={2} />}>
        <WeatherCharts />
      </Suspense>
    </div>
  );
}
