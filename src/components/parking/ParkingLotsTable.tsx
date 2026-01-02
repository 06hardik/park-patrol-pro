import { ParkingLotWithStatus } from '@/types/parking';
import { StatusBadge } from './StatusBadge';
import { Sparkline } from './Sparkline';
import { UtilizationBar } from './UtilizationBar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

interface ParkingLotsTableProps {
  lots: ParkingLotWithStatus[];
  onLotClick?: (lotId: string) => void;
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

export function ParkingLotsTable({ lots, onLotClick, className }: ParkingLotsTableProps) {
  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Lot Name</TableHead>
            <TableHead className="font-semibold">Contractor</TableHead>
            <TableHead className="font-semibold text-center">Capacity</TableHead>
            <TableHead className="font-semibold text-center">Current</TableHead>
            <TableHead className="font-semibold w-[180px]">Utilization</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold text-center">Trend (24h)</TableHead>
            <TableHead className="font-semibold text-right">Violation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lots.map((lot) => (
            <TableRow
              key={lot.id}
              className={cn(
                'cursor-pointer transition-colors',
                lot.status === 'violating' && 'bg-status-violating/5 hover:bg-status-violating/10',
                lot.status === 'grace_period' && 'bg-status-grace/5 hover:bg-status-grace/10'
              )}
              onClick={() => onLotClick?.(lot.id)}
            >
              <TableCell className="font-medium">{lot.name}</TableCell>
              <TableCell className="text-muted-foreground">{lot.contractor}</TableCell>
              <TableCell className="text-center font-mono">{lot.allowedCapacity}</TableCell>
              <TableCell className={cn(
                'text-center font-mono font-medium',
                lot.currentCount > lot.allowedCapacity && 'text-status-violating'
              )}>
                {lot.currentCount}
                {lot.currentCount > lot.allowedCapacity && (
                  <span className="text-xs ml-1 text-status-violating">
                    (+{lot.currentCount - lot.allowedCapacity})
                  </span>
                )}
              </TableCell>
              <TableCell>
                <UtilizationBar 
                  utilization={lot.utilization} 
                  status={lot.status} 
                />
              </TableCell>
              <TableCell className="text-center">
                <StatusBadge 
                  status={lot.status} 
                  showPulse={lot.status === 'violating'}
                  size="sm"
                />
              </TableCell>
              <TableCell className="text-center">
                <Sparkline 
                  data={lot.countHistory} 
                  threshold={lot.allowedCapacity}
                  width={100}
                  height={28}
                />
              </TableCell>
              <TableCell className="text-right">
                {lot.activeViolation ? (
                  <div className="flex items-center justify-end gap-2 text-sm">
                    {lot.activeViolation.isInGracePeriod ? (
                      <>
                        <Clock className="h-4 w-4 text-status-grace" />
                        <span className="font-mono text-status-grace">
                          Grace: {formatDuration(
                            Math.max(0, Math.ceil(
                              (lot.activeViolation.graceExpiresAt.getTime() - Date.now()) / 60000
                            ))
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-status-violating" />
                        <span className="font-mono text-status-violating">
                          {formatDuration(lot.activeViolation.durationMinutes)}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}