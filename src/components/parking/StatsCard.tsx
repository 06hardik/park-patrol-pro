import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'border-border',
  success: 'border-status-compliant/30 bg-status-compliant/5',
  warning: 'border-status-grace/30 bg-status-grace/5',
  danger: 'border-status-violating/30 bg-status-violating/5',
};

const iconVariantStyles = {
  default: 'text-muted-foreground',
  success: 'text-status-compliant',
  warning: 'text-status-grace',
  danger: 'text-status-violating',
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default',
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      'rounded-lg border bg-card p-4 transition-all hover:shadow-md',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-mono tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        {Icon && (
          <div className={cn(
            'p-2 rounded-lg bg-muted/50',
            iconVariantStyles[variant]
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={cn(
            'font-medium',
            trend.isPositive ? 'text-status-compliant' : 'text-status-violating'
          )}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
}