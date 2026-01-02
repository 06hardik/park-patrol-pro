import { ViolationHeatmapData } from '@/types/parking';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface ViolationHeatmapProps {
  data: ViolationHeatmapData[];
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensityClass(count: number, max: number): string {
  if (count === 0) return 'bg-muted';
  const ratio = count / max;
  if (ratio < 0.25) return 'bg-chart-2/30';
  if (ratio < 0.5) return 'bg-status-grace/50';
  if (ratio < 0.75) return 'bg-status-violating/50';
  return 'bg-status-violating';
}

export function ViolationHeatmap({ data, className }: ViolationHeatmapProps) {
  const { grid, maxCount } = useMemo(() => {
    const grid: Record<string, number> = {};
    let maxCount = 0;
    
    data.forEach(d => {
      const key = `${d.dayOfWeek}-${d.hour}`;
      grid[key] = d.count;
      if (d.count > maxCount) maxCount = d.count;
    });
    
    return { grid, maxCount };
  }, [data]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Hour labels */}
      <div className="flex pl-12">
        {HOURS.filter((_, i) => i % 3 === 0).map(hour => (
          <div 
            key={hour} 
            className="flex-1 text-xs text-muted-foreground text-center"
          >
            {hour.toString().padStart(2, '0')}:00
          </div>
        ))}
      </div>
      
      {/* Heatmap grid */}
      <div className="space-y-1">
        {DAYS.map((day, dayIndex) => (
          <div key={day} className="flex items-center gap-2">
            <span className="w-10 text-xs text-muted-foreground text-right">
              {day}
            </span>
            <div className="flex-1 flex gap-0.5">
              {HOURS.map(hour => {
                const count = grid[`${dayIndex}-${hour}`] || 0;
                return (
                  <div
                    key={hour}
                    className={cn(
                      'flex-1 h-6 rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-foreground/20',
                      getIntensityClass(count, maxCount)
                    )}
                    title={`${day} ${hour}:00 - ${count} violation${count !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 pt-2">
        <span className="text-xs text-muted-foreground">Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-sm bg-muted" />
          <div className="w-4 h-4 rounded-sm bg-chart-2/30" />
          <div className="w-4 h-4 rounded-sm bg-status-grace/50" />
          <div className="w-4 h-4 rounded-sm bg-status-violating/50" />
          <div className="w-4 h-4 rounded-sm bg-status-violating" />
        </div>
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </div>
  );
}