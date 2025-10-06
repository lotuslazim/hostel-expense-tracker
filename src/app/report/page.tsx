
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const MonthlySummary = dynamic(() => import('@/components/report/monthly-summary').then(mod => mod.MonthlySummary), {
    ssr: false,
    loading: () => <SummarySkeleton />
});

function SummarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
      </div>
       <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}


export default function ReportPage() {
    return <MonthlySummary />;
}
