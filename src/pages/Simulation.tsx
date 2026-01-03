import { useState, useCallback, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { SimulationControl } from '@/components/parking/SimulationControl';
import { ParkingLotsTable } from '@/components/parking/ParkingLotsTable';
import { ViolationsTable } from '@/components/parking/ViolationsTable';
import { PollingIndicator } from '@/components/parking/PollingIndicator';
import { CongestionHeatmap } from '@/components/parking/CongestionHeatmap';
import { usePolling } from '@/hooks/usePolling';
import { parkingService } from '@/services/parkingService';
import { SimulationState, SimulationScenario, ParkingLotWithStatus, Violation } from '@/types/parking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Car } from 'lucide-react';

export default function Simulation() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [simState, setSimState] = useState<SimulationState>(
    parkingService.getSimulationState()
  );
  const [isLoading, setIsLoading] = useState(false);

  const { 
    data: lots, 
    isLoading: lotsLoading, 
    lastUpdated,
    refetch: refetchLots
  } = usePolling<ParkingLotWithStatus[]>({
    fetcher: parkingService.getLots,
    interval: 3000,
    enabled: simState.isRunning,
  });

  const { 
    data: violations, 
    refetch: refetchViolations 
  } = usePolling<Violation[]>({
    fetcher: () => parkingService.getViolations({ status: 'active' }),
    interval: 3000,
    enabled: simState.isRunning,
  });

  // Simulate tick during simulation
  useEffect(() => {
    if (simState.isRunning) {
      const interval = setInterval(() => {
        parkingService.simulateTick();
        setSimState(parkingService.getSimulationState());
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [simState.isRunning]);

  const handleStart = useCallback(async (scenario: SimulationScenario) => {
    setIsLoading(true);
    try {
      const newState = await parkingService.startSimulation(scenario);
      setSimState(newState);
      toast({
        title: 'Simulation Started',
        description: 'Running Rush Hour scenario - high traffic patterns',
      });
      refetchLots();
      refetchViolations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start simulation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, refetchLots, refetchViolations]);

  const handleStop = useCallback(async () => {
    setIsLoading(true);
    try {
      const newState = await parkingService.stopSimulation();
      setSimState(newState);
      toast({
        title: 'Simulation Stopped',
        description: 'Data reset to seed values',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop simulation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const activeLots = lots?.filter(l => l.status === 'violating').length || 0;

  return (
    <DashboardLayout>
      <Header 
        title="Simulation" 
        subtitle="Test Rush Hour scenario and observe system behavior"
        actions={
          simState.isRunning && (
            <PollingIndicator 
              lastUpdated={lastUpdated} 
              isLoading={lotsLoading}
              interval={3000}
            />
          )
        }
      />
      
      <div className="p-6 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Simulation Control */}
          <SimulationControl
            state={simState}
            onStart={handleStart}
            onStop={handleStop}
            isLoading={isLoading}
          />

          {/* Live Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!simState.isRunning ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Start Rush Hour simulation to see live statistics</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Car className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold font-mono">{lots?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Lots</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-status-violating/10">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-status-violating" />
                    <p className="text-2xl font-bold font-mono text-status-violating">
                      {activeLots}
                    </p>
                    <p className="text-sm text-muted-foreground">Violating</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold font-mono">{simState.eventsGenerated}</p>
                    <p className="text-sm text-muted-foreground">Events</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Congestion Heatmap */}
        {simState.isRunning && lots && (
          <CongestionHeatmap lots={lots} />
        )}

        {/* Live Lots Table */}
        {simState.isRunning && (
          <>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Live Parking Lot Status</h2>
              {lotsLoading || !lots ? (
                <Skeleton className="h-64" />
              ) : (
                <ParkingLotsTable 
                  lots={lots}
                  onLotClick={(lotId) => {
                    const lot = lots.find(l => l.id === lotId);
                    if (lot?.activeViolation) {
                      navigate(`/violations/${lot.activeViolation.id}`);
                    }
                  }}
                />
              )}
            </div>

            {/* Active Violations */}
            {violations && violations.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-status-violating" />
                  Active Violations ({violations.length})
                </h2>
                <ViolationsTable 
                  violations={violations}
                  onViolationClick={(id) => navigate(`/violations/${id}`)}
                  compact
                />
              </div>
            )}
          </>
        )}

        {/* Instructions when not running */}
        {!simState.isRunning && (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Simulation</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start the Rush Hour scenario from the control panel to simulate heavy parking lot activity. 
                Watch as vehicle counts change and violations are detected in real-time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
