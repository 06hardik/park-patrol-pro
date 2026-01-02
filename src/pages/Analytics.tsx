import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { OffendersTable } from '@/components/parking/OffendersTable';
import { ViolationHeatmap } from '@/components/parking/ViolationHeatmap';
import { StatsCard } from '@/components/parking/StatsCard';
import { ViolationsTable } from '@/components/parking/ViolationsTable';
import { PollingIndicator } from '@/components/parking/PollingIndicator';
import { usePolling } from '@/hooks/usePolling';
import { parkingService } from '@/services/parkingService';
import { 
  ChronicOffender, 
  ViolationHeatmapData, 
  AggregateStats,
  Violation 
} from '@/types/parking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  BarChart3,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Analytics() {
  const navigate = useNavigate();

  const { data: offenders, isLoading: offendersLoading } = usePolling<ChronicOffender[]>({
    fetcher: parkingService.getChronicOffenders,
    interval: 30000,
  });

  const { data: heatmapData, isLoading: heatmapLoading } = usePolling<ViolationHeatmapData[]>({
    fetcher: parkingService.getHeatmapData,
    interval: 30000,
  });

  const { data: stats, isLoading: statsLoading, lastUpdated } = usePolling<AggregateStats>({
    fetcher: parkingService.getAggregateStats,
    interval: 10000,
  });

  const { data: violations } = usePolling<Violation[]>({
    fetcher: () => parkingService.getViolations({ status: 'resolved' }),
    interval: 30000,
  });

  // Prepare chart data
  const contractorChartData = offenders?.slice(0, 5).map(o => ({
    name: o.contractor.split(' ')[0],
    violations: o.totalViolations,
    hours: o.totalViolationHours,
    penalties: o.totalPenalties,
  })) || [];

  const pieData = offenders?.slice(0, 5).map(o => ({
    name: o.contractor,
    value: o.totalPenalties,
  })) || [];

  return (
    <DashboardLayout>
      <Header 
        title="Analytics" 
        subtitle="Violation patterns and contractor performance"
        actions={
          <PollingIndicator 
            lastUpdated={lastUpdated} 
            isLoading={statsLoading}
            interval={10000}
          />
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="data-grid">
          {statsLoading || !stats ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Violations Today"
                value={stats.violationsToday}
                icon={AlertTriangle}
                variant={stats.violationsToday > 0 ? 'warning' : 'default'}
              />
              <StatsCard
                title="This Week"
                value={stats.violationsThisWeek}
                icon={Calendar}
              />
              <StatsCard
                title="This Month"
                value={stats.violationsThisMonth}
                icon={TrendingUp}
              />
              <StatsCard
                title="Total Penalties"
                value={`$${stats.totalPenaltiesAssessed.toLocaleString()}`}
                icon={DollarSign}
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Contractor Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Violations by Contractor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {offendersLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={contractorChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey="violations" 
                      fill="hsl(var(--chart-1))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Penalty Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Penalty Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {offendersLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Penalties']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate max-w-[100px]">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Violation Frequency by Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {heatmapLoading || !heatmapData ? (
              <Skeleton className="h-64" />
            ) : (
              <ViolationHeatmap data={heatmapData} />
            )}
          </CardContent>
        </Card>

        {/* Chronic Offenders */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Chronic Offenders
          </h2>
          {offendersLoading || !offenders ? (
            <Skeleton className="h-64" />
          ) : (
            <OffendersTable offenders={offenders} />
          )}
        </div>

        {/* Recent Resolved Violations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Resolved Violations</h2>
          {!violations ? (
            <Skeleton className="h-64" />
          ) : (
            <ViolationsTable 
              violations={violations.slice(0, 5)} 
              onViolationClick={(id) => navigate(`/violations/${id}`)}
              compact
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}