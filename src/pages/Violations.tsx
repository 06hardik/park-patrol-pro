import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { ViolationsTable } from '@/components/parking/ViolationsTable';
import { PollingIndicator } from '@/components/parking/PollingIndicator';
import { usePolling } from '@/hooks/usePolling';
import { parkingService } from '@/services/parkingService';
import { Violation } from '@/types/parking';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Violations() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const { 
    data: violations, 
    isLoading, 
    lastUpdated 
  } = usePolling<Violation[]>({
    fetcher: () => parkingService.getViolations(
      filter === 'all' ? undefined : { status: filter }
    ),
    interval: 5000,
  });

  const handleViolationClick = useCallback((violationId: string) => {
    navigate(`/violations/${violationId}`);
  }, [navigate]);

  const activeCount = violations?.filter(v => v.status === 'active').length || 0;
  const resolvedCount = violations?.filter(v => v.status === 'resolved').length || 0;

  return (
    <DashboardLayout>
      <Header 
        title="Violations" 
        subtitle="Track and manage capacity violations"
        actions={
          <PollingIndicator 
            lastUpdated={lastUpdated} 
            isLoading={isLoading}
          />
        }
      />
      
      <div className="p-6 space-y-6">
        <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">
              All ({violations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:text-status-violating">
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {isLoading || !violations ? (
              <Skeleton className="h-96" />
            ) : (
              <ViolationsTable 
                violations={violations} 
                onViolationClick={handleViolationClick}
              />
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            {isLoading || !violations ? (
              <Skeleton className="h-96" />
            ) : (
              <ViolationsTable 
                violations={violations.filter(v => v.status === 'active')} 
                onViolationClick={handleViolationClick}
              />
            )}
          </TabsContent>

          <TabsContent value="resolved" className="mt-4">
            {isLoading || !violations ? (
              <Skeleton className="h-96" />
            ) : (
              <ViolationsTable 
                violations={violations.filter(v => v.status === 'resolved')} 
                onViolationClick={handleViolationClick}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}