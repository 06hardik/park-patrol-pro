import { 
  ParkingLotWithStatus, 
  Violation, 
  ChronicOffender, 
  AggregateStats, 
  ViolationHeatmapData,
  SimulationState,
  SimulationScenario,
  CountHistoryPoint
} from '@/types/parking';
import { 
  getLotsWithStatus, 
  violations, 
  chronicOffenders, 
  aggregateStats, 
  heatmapData,
  parkingLots
} from '@/data/seedData';

// Simulation state
let simulationState: SimulationState = {
  isRunning: false,
  scenario: null,
  startedAt: null,
  eventsGenerated: 0,
};

// Mutable copy of lots for simulation
let simulatedLots = [...parkingLots];
let simulatedViolations = [...violations];

// Reset to seed data
const resetData = () => {
  simulatedLots = [...parkingLots];
  simulatedViolations = [...violations];
};

// API Service Layer
export const parkingService = {
  // Get all parking lots with current status
  async getLots(): Promise<ParkingLotWithStatus[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (simulationState.isRunning) {
      return simulatedLots.map(lot => {
        const utilization = (lot.currentCount / lot.allowedCapacity) * 100;
        const activeViolation = simulatedViolations.find(v => v.lotId === lot.id && v.status === 'active');
        
        // No grace period - immediately violating if over capacity
        let status: ParkingLotWithStatus['status'] = 'compliant';
        if (activeViolation || lot.currentCount > lot.allowedCapacity) {
          status = 'violating';
        }
        
        // Generate count history
        const countHistory: CountHistoryPoint[] = [];
        for (let i = 24; i >= 0; i--) {
          const variance = Math.random() * 0.2 - 0.1;
          const baseCount = status === 'violating' ? lot.allowedCapacity * 1.1 : lot.allowedCapacity * 0.7;
          countHistory.push({
            timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
            count: Math.max(0, Math.round(baseCount * (1 + variance))),
          });
        }
        
        return {
          ...lot,
          utilization,
          status,
          activeViolation: activeViolation ? {
            id: activeViolation.id,
            lotId: lot.id,
            startedAt: activeViolation.startedAt,
            maxExcess: activeViolation.maxExcess,
            currentExcess: Math.max(0, lot.currentCount - lot.allowedCapacity),
            durationMinutes: Math.floor((Date.now() - activeViolation.startedAt.getTime()) / 60000),
          } : undefined,
          countHistory,
        };
      });
    }
    
    return getLotsWithStatus();
  },

  // Get all violations
  async getViolations(filter?: { status?: 'active' | 'resolved'; lotId?: string }): Promise<Violation[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let result = simulationState.isRunning ? simulatedViolations : violations;
    
    if (filter?.status) {
      result = result.filter(v => v.status === filter.status);
    }
    if (filter?.lotId) {
      result = result.filter(v => v.lotId === filter.lotId);
    }
    
    return result.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  },

  // Get single violation by ID
  async getViolation(id: string): Promise<Violation | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const allViolations = simulationState.isRunning ? simulatedViolations : violations;
    return allViolations.find(v => v.id === id) || null;
  },

  // Get chronic offenders
  async getChronicOffenders(): Promise<ChronicOffender[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return chronicOffenders.sort((a, b) => b.totalViolationHours - a.totalViolationHours);
  },

  // Get aggregate stats
  async getAggregateStats(): Promise<AggregateStats> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (simulationState.isRunning) {
      const activeCount = simulatedViolations.filter(v => v.status === 'active').length;
      const lotsData = simulatedLots.map(lot => {
        const activeViolation = simulatedViolations.find(v => v.lotId === lot.id && v.status === 'active');
        // No grace period check
        return (activeViolation || lot.currentCount > lot.allowedCapacity) ? 'violating' : 'compliant';
      });
      
      return {
        ...aggregateStats,
        activeViolations: activeCount,
        lotsInCompliance: lotsData.filter(s => s === 'compliant').length,
        lotsViolating: lotsData.filter(s => s === 'violating').length,
      };
    }
    
    return aggregateStats;
  },

  // Get heatmap data
  async getHeatmapData(): Promise<ViolationHeatmapData[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return heatmapData;
  },

  // Get simulation state
  getSimulationState(): SimulationState {
    return { ...simulationState };
  },

  // Start simulation - Only Rush Hour scenario
  async startSimulation(scenario: SimulationScenario): Promise<SimulationState> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    resetData();
    
    simulationState = {
      isRunning: true,
      scenario,
      startedAt: new Date(),
      eventsGenerated: 0,
    };
    
    // Rush Hour: Push multiple lots over capacity immediately
    simulatedLots = simulatedLots.map(lot => ({
      ...lot,
      currentCount: Math.round(lot.allowedCapacity * (0.95 + Math.random() * 0.25)),
    }));
    
    return { ...simulationState };
  },

  // Stop simulation
  async stopSimulation(): Promise<SimulationState> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    simulationState = {
      isRunning: false,
      scenario: null,
      startedAt: null,
      eventsGenerated: 0,
    };
    
    resetData();
    
    return { ...simulationState };
  },

  // Simulate a tick (for polling updates during simulation)
  async simulateTick(): Promise<void> {
    if (!simulationState.isRunning) return;
    
    simulationState.eventsGenerated++;
    
    // Rush hour: bias toward increase to push lots over capacity
    simulatedLots = simulatedLots.map(lot => {
      const delta = Math.round(Math.random() * 12 - 4); // Bias toward increase
      const newCount = Math.max(0, lot.currentCount + delta);
      
      // Create violation immediately if over capacity (no grace period)
      if (newCount > lot.allowedCapacity) {
        const existingViolation = simulatedViolations.find(
          v => v.lotId === lot.id && v.status === 'active'
        );
        
        if (!existingViolation) {
          simulatedViolations.push({
            id: `sim-viol-${Date.now()}-${lot.id}`,
            lotId: lot.id,
            lotName: lot.name,
            contractor: lot.contractor,
            startedAt: new Date(),
            endedAt: null,
            maxExcess: newCount - lot.allowedCapacity,
            allowedCapacity: lot.allowedCapacity,
            peakCount: newCount,
            durationMinutes: 0,
            penaltyAmount: 0,
            ruleVersion: 'v3.0-sim',
            status: 'active',
            evidence: [],
          });
        } else {
          // Update max excess if higher
          const excess = newCount - lot.allowedCapacity;
          if (excess > existingViolation.maxExcess) {
            existingViolation.maxExcess = excess;
            existingViolation.peakCount = newCount;
          }
        }
      } else {
        // Resolve violation if back under capacity
        const existingViolation = simulatedViolations.find(
          v => v.lotId === lot.id && v.status === 'active'
        );
        if (existingViolation) {
          existingViolation.status = 'resolved';
          existingViolation.endedAt = new Date();
          existingViolation.durationMinutes = Math.floor(
            (Date.now() - existingViolation.startedAt.getTime()) / 60000
          );
          existingViolation.penaltyAmount = Math.round(
            existingViolation.maxExcess * (existingViolation.durationMinutes / 60) * lot.penaltyRatePerHour
          );
        }
      }
      
      return {
        ...lot,
        currentCount: newCount,
        updatedAt: new Date(),
      };
    });
  },
};
