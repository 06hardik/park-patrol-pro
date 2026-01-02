import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/parking/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { parkingService } from '@/services/parkingService';
import { Violation, Evidence } from '@/types/parking';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Clock, 
  Camera, 
  Hash, 
  MapPin, 
  DollarSign,
  TrendingUp,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyHash = async () => {
    await navigator.clipboard.writeText(evidence.sha256Hash);
    setCopied(true);
    toast({ title: 'Hash copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted relative">
        <img 
          src={evidence.imageUrl} 
          alt={`Evidence captured at ${format(evidence.capturedAt, 'HH:mm:ss')}`}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Camera className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono">
          {evidence.vehicleCount} vehicles
        </div>
      </div>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {format(evidence.capturedAt, 'MMM d, yyyy HH:mm:ss')}
          </span>
          <span className="text-xs text-muted-foreground">
            {evidence.metadata.cameraId}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          Section {evidence.metadata.lotSection}
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-muted p-1.5 rounded font-mono truncate">
            {evidence.sha256Hash.substring(0, 24)}...
          </code>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={copyHash}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ViolationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [violation, setViolation] = useState<Violation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchViolation = async () => {
      setIsLoading(true);
      const data = await parkingService.getViolation(id);
      setViolation(data);
      setIsLoading(false);
    };

    fetchViolation();
    
    // Poll for active violations
    const interval = setInterval(fetchViolation, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <Header title="Violation Details" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!violation) {
    return (
      <DashboardLayout>
        <Header title="Violation Not Found" />
        <div className="p-6 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">The violation you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/violations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Violations
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isActive = violation.status === 'active';
  const currentDuration = isActive 
    ? Math.floor((Date.now() - violation.startedAt.getTime()) / 60000)
    : violation.durationMinutes;

  return (
    <DashboardLayout>
      <Header 
        title={violation.lotName}
        subtitle={violation.contractor}
        actions={
          <Button variant="outline" onClick={() => navigate('/violations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Status Banner */}
        <div className={cn(
          'rounded-lg p-4 flex items-center justify-between',
          isActive ? 'bg-status-violating/10 border border-status-violating/30' : 'bg-muted'
        )}>
          <div className="flex items-center gap-3">
            <StatusBadge 
              status={isActive ? 'violating' : 'compliant'} 
              showPulse={isActive}
              size="lg"
            />
            <span className="text-sm">
              {isActive ? 'This violation is currently active' : 'This violation has been resolved'}
            </span>
          </div>
          <span className="font-mono text-sm">
            ID: {violation.id}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
                
                <div className="relative">
                  <div className="absolute left-[-22px] w-3 h-3 rounded-full bg-status-violating" />
                  <div>
                    <p className="text-sm font-medium">Violation Started</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {format(violation.startedAt, 'MMM d, yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-[-22px] w-3 h-3 rounded-full bg-chart-4 animate-pulse-ring" />
                  <div>
                    <p className="text-sm font-medium">Peak Excess</p>
                    <p className="text-sm text-muted-foreground">
                      {violation.peakCount} vehicles (+{violation.maxExcess} over capacity)
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className={cn(
                    'absolute left-[-22px] w-3 h-3 rounded-full',
                    isActive ? 'bg-muted-foreground animate-pulse' : 'bg-status-compliant'
                  )} />
                  <div>
                    <p className="text-sm font-medium">
                      {isActive ? 'Ongoing' : 'Violation Ended'}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {isActive 
                        ? `Duration: ${formatDuration(currentDuration)}`
                        : violation.endedAt && format(violation.endedAt, 'MMM d, yyyy HH:mm:ss')
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Duration</span>
                  <span className="font-mono font-medium">
                    {formatDuration(currentDuration)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Penalty Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Penalty Calculation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Allowed Capacity</span>
                  <span className="font-mono">{violation.allowedCapacity} vehicles</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Peak Count</span>
                  <span className="font-mono text-status-violating">
                    {violation.peakCount} vehicles
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Maximum Excess</span>
                  <span className="font-mono font-medium">
                    +{violation.maxExcess} vehicles
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-mono">{formatDuration(currentDuration)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Penalty</span>
                  <span className="text-2xl font-bold font-mono">
                    {isActive ? (
                      <span className="text-muted-foreground text-base">Calculating...</span>
                    ) : (
                      formatCurrency(violation.penaltyAmount)
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Formula: Max Excess × (Duration in hours) × Hourly Rate
                </p>
              </div>

              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Rule Version:</span>
                  <code className="font-mono">{violation.ruleVersion}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evidence Gallery */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Evidence ({violation.evidence.length} items)
            </h2>
          </div>
          
          {violation.evidence.length === 0 ? (
            <Card className="p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No evidence captured yet</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {violation.evidence.map((ev) => (
                <EvidenceCard key={ev.id} evidence={ev} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}