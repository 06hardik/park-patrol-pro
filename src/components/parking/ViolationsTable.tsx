import { Violation } from '@/types/parking';
import { StatusBadge } from './StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChevronRight, FileText } from 'lucide-react';

interface ViolationsTableProps {
  violations: Violation[];
  onViolationClick?: (violationId: string) => void;
  compact?: boolean;
  className?: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ViolationsTable({ 
  violations, 
  onViolationClick, 
  compact = false,
  className 
}: ViolationsTableProps) {
  if (violations.length === 0) {
    return (
      <div className={cn('rounded-lg border bg-card p-8 text-center', className)}>
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No violations found</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Lot</TableHead>
            {!compact && <TableHead className="font-semibold">Contractor</TableHead>}
            <TableHead className="font-semibold">Started</TableHead>
            <TableHead className="font-semibold text-center">Duration</TableHead>
            <TableHead className="font-semibold text-center">Max Excess</TableHead>
            <TableHead className="font-semibold text-right">Penalty</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            {!compact && <TableHead className="font-semibold text-center">Evidence</TableHead>}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {violations.map((violation) => (
            <TableRow
              key={violation.id}
              className={cn(
                'cursor-pointer transition-colors',
                violation.status === 'active' && 'bg-status-violating/5 hover:bg-status-violating/10'
              )}
              onClick={() => onViolationClick?.(violation.id)}
            >
              <TableCell className="font-medium">{violation.lotName}</TableCell>
              {!compact && (
                <TableCell className="text-muted-foreground">{violation.contractor}</TableCell>
              )}
              <TableCell className="font-mono text-sm">
                {format(violation.startedAt, 'MMM d, HH:mm')}
              </TableCell>
              <TableCell className="text-center font-mono">
                {violation.status === 'active' ? (
                  <span className="text-status-violating">
                    {formatDuration(
                      Math.floor((Date.now() - violation.startedAt.getTime()) / 60000)
                    )}
                  </span>
                ) : (
                  formatDuration(violation.durationMinutes)
                )}
              </TableCell>
              <TableCell className="text-center">
                <span className="font-mono font-medium text-status-violating">
                  +{violation.maxExcess}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({violation.peakCount}/{violation.allowedCapacity})
                </span>
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                {violation.status === 'active' ? (
                  <span className="text-muted-foreground">Calculating...</span>
                ) : (
                  formatCurrency(violation.penaltyAmount)
                )}
              </TableCell>
              <TableCell className="text-center">
                <StatusBadge 
                  status={violation.status === 'active' ? 'violating' : 'compliant'} 
                  size="sm"
                />
              </TableCell>
              {!compact && (
                <TableCell className="text-center">
                  <span className="text-sm text-muted-foreground">
                    {violation.evidence.length} items
                  </span>
                </TableCell>
              )}
              <TableCell>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}