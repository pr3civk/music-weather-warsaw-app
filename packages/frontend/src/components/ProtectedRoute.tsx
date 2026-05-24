import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid grid-cols-[240px_1fr] min-h-screen">
        <aside className="bg-sidebar border-r border-sidebar-border p-5 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <div className="space-y-1.5 pt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        </aside>
        <main className="px-8 py-7 space-y-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </main>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
