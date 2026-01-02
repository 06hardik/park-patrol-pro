import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface PollingIndicatorProps {
  lastUpdated: Date | null;
  isLoading?: boolean;
  interval?: number;
  className?: string;
}

export function PollingIndicator({ 
  lastUpdated, 
  isLoading = false, 
  interval = 5000,
  className 
}: PollingIndicatorProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 text-xs text-muted-foreground',
      className
    )}>
      <RefreshCw className={cn(
        'h-3 w-3',
        isLoading && 'animate-spin'
      )} />
      <span>
        {isLoading ? (
          'Updating...'
        ) : lastUpdated ? (
          `Updated ${format(lastUpdated, 'HH:mm:ss')}`
        ) : (
          'Waiting for data...'
        )}
      </span>
      <span className="text-muted-foreground/60">
        (every {interval / 1000}s)
      </span>
    </div>
  );
}