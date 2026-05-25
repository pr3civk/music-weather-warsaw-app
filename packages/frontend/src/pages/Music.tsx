import { Suspense, useState } from 'react';
import { TrackTable } from '@/components/TrackTable';
import { TrackTableSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const RANGES = [
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '7d', hours: 24 * 7 },
  { label: '30d', hours: 24 * 30 },
] as const;

export function Music() {
  const [hours, setHours] = useState<number>(48);
  const [query, setQuery] = useState('');
  const [minPop, setMinPop] = useState<number>(0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Music</h1>
        <p className="text-sm text-muted-foreground">Top tracks aggregated from the selected time range.</p>
      </header>

      <div className="flex flex-wrap items-end gap-4 p-4 rounded-md border border-border bg-card">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Range</Label>
          <div className="inline-flex rounded-md border border-border p-0.5">
            {RANGES.map((r) => (
              <Button
                key={r.label}
                size="sm"
                variant="ghost"
                className={cn('h-7 px-3 text-xs font-medium', hours === r.hours && 'bg-muted text-foreground')}
                onClick={() => setHours(r.hours)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label htmlFor="filter-search" className="text-xs uppercase tracking-wider text-muted-foreground">
            Search artist / track
          </Label>
          <Input
            id="filter-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Weeknd, Sweater..."
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-pop" className="text-xs uppercase tracking-wider text-muted-foreground">
            Min popularity
          </Label>
          <Input
            id="filter-pop"
            type="number"
            min={0}
            max={100}
            value={minPop}
            onChange={(e) => setMinPop(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="h-9 w-24"
          />
        </div>

        {(query || minPop > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setMinPop(0);
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <Suspense key={hours} fallback={<TrackTableSkeleton />}>
        <TrackTable hours={hours} query={query} minPopularity={minPop} />
      </Suspense>
    </div>
  );
}
