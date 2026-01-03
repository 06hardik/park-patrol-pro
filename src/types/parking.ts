export type ComplianceStatus = 'compliant' | 'violating';

export interface ParkingLot {
  id: string;
  name: string;
  contractor: string;
  allowedCapacity: number;
  currentCount: number;
  penaltyRatePerHour: number;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingLotWithStatus extends ParkingLot {
  utilization: number;
  status: ComplianceStatus;
  activeViolation?: ActiveViolation;
  countHistory: CountHistoryPoint[];
}

export interface CountHistoryPoint {
  timestamp: Date;
  count: number;
}

export interface ActiveViolation {
  id: string;
  lotId: string;
  startedAt: Date;
  maxExcess: number;
  currentExcess: number;
  durationMinutes: number;
}

export interface Violation {
  id: string;
  lotId: string;
  lotName: string;
  contractor: string;
  startedAt: Date;
  endedAt: Date | null;
  maxExcess: number;
  allowedCapacity: number;
  peakCount: number;
  durationMinutes: number;
  penaltyAmount: number;
  ruleVersion: string;
  status: 'active' | 'resolved';
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  violationId: string;
  capturedAt: Date;
  vehicleCount: number;
  imageUrl: string;
  sha256Hash: string;
  metadata: {
    cameraId: string;
    lotSection: string;
  };
}

export interface ContractRule {
  id: string;
  lotId: string;
  version: string;
  allowedCapacity: number;
  penaltyRatePerHour: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export interface CountEvent {
  id: string;
  lotId: string;
  timestamp: Date;
  vehicleCount: number;
  source: 'sensor' | 'manual' | 'simulation';
}

export interface ChronicOffender {
  contractor: string;
  totalViolations: number;
  totalViolationHours: number;
  totalPenalties: number;
  lots: string[];
}

export interface AggregateStats {
  violationsToday: number;
  violationsThisWeek: number;
  violationsThisMonth: number;
  totalPenaltiesAssessed: number;
  activeViolations: number;
  lotsInCompliance: number;
  lotsViolating: number;
}

export interface ViolationHeatmapData {
  hour: number;
  dayOfWeek: number;
  count: number;
}

export interface SimulationState {
  isRunning: boolean;
  scenario: SimulationScenario | null;
  startedAt: Date | null;
  eventsGenerated: number;
}

export type SimulationScenario = 'rush_hour';

export interface SimulationScenarioConfig {
  id: SimulationScenario;
  name: string;
  description: string;
  icon: string;
}
