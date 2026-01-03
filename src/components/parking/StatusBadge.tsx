import { cn } from '@/lib/utils';
import { ComplianceStatus } from '@/types/parking';

interface StatusBadgeProps {
  status: ComplianceStatus;
  showPulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<ComplianceStatus, { label: string; className: string }> = {
  compliant: {
    label: 'Compliant',
    className: 'bg-status-compliant text-status-compliant-foreground',
  },
  violating: {
    label: 'Violating',
    className: 'bg-status-violating text-status-violating-foreground',
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function StatusBadge({ status, showPulse = false, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        sizeConfig[size],
        config.className,
        className
      )}
    >
      {showPulse && status === 'violating' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {config.label}
    </span>
  );
}
