import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function NowWidgetSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({ title = true }: { title?: boolean }) {
  return (
    <Card>
      <CardHeader>
        {title && <Skeleton className="h-5 w-56" />}
      </CardHeader>
      <CardContent className="h-72">
        <div className="h-full flex flex-col gap-3">
          <div className="flex-1 flex items-end gap-1.5">
            {Array.from({ length: 24 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${30 + ((i * 11) % 60)}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-2.5 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartsGridSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ChartSkeleton key={i} />
      ))}
    </div>
  );
}

export function CorrelationHeatmapSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-80" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <th key={i} className="p-2">
                      <Skeleton className="h-3 w-16" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, row) => (
                  <tr key={row}>
                    <th className="p-2 text-left">
                      <Skeleton className="h-3 w-20" />
                    </th>
                    {Array.from({ length: 4 }).map((_, col) => (
                      <td key={col} className="p-1">
                        <Skeleton className="h-16 w-full rounded-md" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function TrackTableSkeleton({ rows = 12 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-80" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-[40px_2fr_1.5fr_60px_1fr_1fr_70px_1fr] gap-3 pb-2 border-b border-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-3" style={{ width: `${50 + (i % 3) * 15}%` }} />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div
              key={r}
              className="grid grid-cols-[40px_2fr_1.5fr_60px_1fr_1fr_70px_1fr] gap-3 items-center py-2.5 border-b border-border/50"
            >
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-3.5" style={{ width: `${60 + (r % 4) * 10}%` }} />
              <Skeleton className="h-3" style={{ width: `${40 + (r % 5) * 12}%` }} />
              <Skeleton className="h-5 w-10 rounded-md" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
