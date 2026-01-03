import { SimulationState, SimulationScenario } from '@/types/parking';
import { scenarioConfigs } from '@/data/seedData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Square, Zap, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface SimulationControlProps {
  state: SimulationState;
  onStart: (scenario: SimulationScenario) => void;
  onStop: () => void;
  isLoading?: boolean;
  className?: string;
}

export function SimulationControl({ 
  state, 
  onStart, 
  onStop, 
  isLoading = false,
  className 
}: SimulationControlProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Simulation Control</h3>
        </div>
        
        {state.isRunning && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-compliant opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-compliant" />
            </span>
            <span className="text-sm text-status-compliant font-medium">Running</span>
          </div>
        )}
      </div>
      
      {state.isRunning ? (
        <div className="space-y-4">
          {/* Active simulation info */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Scenario</span>
              <span className="text-sm font-medium">
                {scenarioConfigs.find(s => s.id === state.scenario)?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Started</span>
              <span className="text-sm font-mono">
                {state.startedAt && format(state.startedAt, 'HH:mm:ss')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Events Generated</span>
              <span className="text-sm font-mono flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {state.eventsGenerated}
              </span>
            </div>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={onStop}
            disabled={isLoading}
            className="w-full"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Simulation
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Start Rush Hour simulation to test high traffic patterns:
          </p>
          
          <div className="space-y-2">
            {scenarioConfigs.map(config => (
              <Button
                key={config.id}
                variant="outline"
                onClick={() => onStart(config.id)}
                disabled={isLoading}
                className="w-full h-auto py-3 px-4 flex items-start gap-3 hover:bg-primary/10 hover:border-primary"
              >
                <span className="text-2xl">{config.icon}</span>
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium">{config.name}</span>
                  <span className="text-xs text-muted-foreground text-left font-normal">
                    {config.description}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
