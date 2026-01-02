import { ChronicOffender } from '@/types/parking';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface OffendersTableProps {
  offenders: ChronicOffender[];
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  return `${hours.toFixed(1)}h`;
}

export function OffendersTable({ offenders, className }: OffendersTableProps) {
  if (offenders.length === 0) {
    return (
      <div className={cn('rounded-lg border bg-card p-8 text-center', className)}>
        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No chronic offenders</p>
      </div>
    );
  }

  // Calculate max values for relative bar widths
  const maxHours = Math.max(...offenders.map(o => o.totalViolationHours));
  const maxPenalties = Math.max(...offenders.map(o => o.totalPenalties));

  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold w-12">#</TableHead>
            <TableHead className="font-semibold">Contractor</TableHead>
            <TableHead className="font-semibold">Lots</TableHead>
            <TableHead className="font-semibold text-center">Violations</TableHead>
            <TableHead className="font-semibold">Total Hours</TableHead>
            <TableHead className="font-semibold">Total Penalties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offenders.map((offender, index) => (
            <TableRow key={offender.contractor}>
              <TableCell className="font-mono font-medium">
                {index + 1}
                {index === 0 && (
                  <AlertTriangle className="h-4 w-4 inline ml-1 text-status-violating" />
                )}
              </TableCell>
              <TableCell className="font-medium">{offender.contractor}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {offender.lots.join(', ')}
              </TableCell>
              <TableCell className="text-center font-mono font-medium">
                {offender.totalViolations}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-status-violating rounded-full transition-all"
                      style={{ width: `${(offender.totalViolationHours / maxHours) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm min-w-[48px] text-right">
                    {formatHours(offender.totalViolationHours)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chart-1 rounded-full transition-all"
                      style={{ width: `${(offender.totalPenalties / maxPenalties) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm min-w-[64px] text-right font-medium">
                    {formatCurrency(offender.totalPenalties)}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}