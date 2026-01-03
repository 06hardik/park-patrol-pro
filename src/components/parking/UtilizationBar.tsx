import { cn } from '@/lib/utils';
import { ComplianceStatus } from '@/types/parking';

interface UtilizationBarProps {
  utilization: number;
  status: ComplianceStatus;
  showLabel?: boolean;
  className?: string;
}

export function UtilizationBar({ utilization, status, showLabel = true, className }: UtilizationBarProps) {
  const clampedUtilization = Math.min(utilization, 150);
  const percentage = Math.min(clampedUtilization, 100);
  const overflow = Math.max(0, clampedUtilization - 100);
  
  const getBarColor = () => {
    switch (status) {
      case 'compliant':
        return 'bg-status-compliant';
      case 'violating':
        return 'bg-status-violating';
    }
  };
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1 h-2 bg-muted rounded-full overflow-hidden">
        {/* Main bar */}
        <div
          className={cn('absolute left-0 top-0 h-full rounded-full transition-all duration-300', getBarColor())}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Overflow indicator */}
        {overflow > 0 && (
          <div
            className="absolute top-0 h-full bg-status-violating/30 border-l-2 border-status-violating"
            style={{ left: '100%', width: `${overflow * 0.5}%` }}
          />
        )}
        
        {/* 100% threshold marker */}
        <div className="absolute right-0 top-0 h-full w-0.5 bg-foreground/20" />
      </div>
      
      {showLabel && (
        <span className={cn(
          'text-sm font-mono font-medium min-w-[48px] text-right',
          utilization > 100 ? 'text-status-violating' : 'text-foreground'
        )}>
          {utilization.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
