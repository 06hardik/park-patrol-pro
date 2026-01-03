import { 
  ParkingLot, 
  Violation, 
  Evidence, 
  ChronicOffender, 
  AggregateStats,
  ViolationHeatmapData,
  CountHistoryPoint,
  ParkingLotWithStatus,
  SimulationScenarioConfig
} from '@/types/parking';

// Helper to create dates relative to now
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

// Generate SHA256-like hash
const generateHash = () => {
  const chars = '0123456789abcdef';
  return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('');
};

// Generate count history for sparklines
const generateCountHistory = (capacity: number, isViolating: boolean): CountHistoryPoint[] => {
  const points: CountHistoryPoint[] = [];
  const baseCount = isViolating ? capacity * 1.1 : capacity * 0.7;
  
  for (let i = 24; i >= 0; i--) {
    const variance = Math.random() * 0.3 - 0.15;
    const count = Math.max(0, Math.round(baseCount * (1 + variance)));
    points.push({
      timestamp: hoursAgo(i),
      count: Math.min(count, Math.round(capacity * 1.3)),
    });
  }
  return points;
};

// 5 MCD Delhi Parking Lots with coordinates
export const parkingLots: ParkingLot[] = [
  {
    id: 'lot-001',
    name: 'MCD Parking — Asaf Ali Road',
    contractor: 'MCD',
    allowedCapacity: 120,
    currentCount: 95,
    penaltyRatePerHour: 500,
    latitude: 28.6406,
    longitude: 77.2401,
    createdAt: daysAgo(365),
    updatedAt: new Date(),
  },
  {
    id: 'lot-002',
    name: 'MCD Car Parking — Qulab Colony',
    contractor: 'MCD',
    allowedCapacity: 80,
    currentCount: 92,
    penaltyRatePerHour: 400,
    latitude: 28.6512,
    longitude: 77.2180,
    createdAt: daysAgo(300),
    updatedAt: new Date(),
  },
  {
    id: 'lot-003',
    name: 'MCD Scooter Parking — Qutub Road Market',
    contractor: 'MCD',
    allowedCapacity: 200,
    currentCount: 180,
    penaltyRatePerHour: 300,
    latitude: 28.6429,
    longitude: 77.2150,
    createdAt: daysAgo(400),
    updatedAt: new Date(),
  },
  {
    id: 'lot-004',
    name: 'MCD Parking — Padam Singh Road',
    contractor: 'MCD',
    allowedCapacity: 150,
    currentCount: 165,
    penaltyRatePerHour: 450,
    latitude: 28.6519,
    longitude: 77.1905,
    createdAt: daysAgo(200),
    updatedAt: new Date(),
  },
  {
    id: 'lot-005',
    name: 'MCD Authorized Lot Parking — SBI Edayazham',
    contractor: 'MCD',
    allowedCapacity: 100,
    currentCount: 78,
    penaltyRatePerHour: 350,
    latitude: 28.6127,
    longitude: 77.2273,
    createdAt: daysAgo(500),
    updatedAt: new Date(),
  },
];

// Generate evidence for a violation
const generateEvidence = (violationId: string, startTime: Date, count: number, lotName: string): Evidence[] => {
  const evidence: Evidence[] = [];
  const sections = ['A', 'B', 'C', 'D'];
  
  for (let i = 0; i < count; i++) {
    const capturedAt = new Date(startTime.getTime() + i * 15 * 60 * 1000);
    evidence.push({
      id: `ev-${violationId}-${i}`,
      violationId,
      capturedAt,
      vehicleCount: Math.floor(Math.random() * 50) + 100,
      imageUrl: `/placeholder.svg`,
      sha256Hash: generateHash(),
      metadata: {
        cameraId: `CAM-${lotName.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10)}`,
        lotSection: sections[Math.floor(Math.random() * sections.length)],
      },
    });
  }
  return evidence;
};

// Historical Violations for MCD lots
export const violations: Violation[] = [
  // Active violations
  {
    id: 'viol-001',
    lotId: 'lot-002',
    lotName: 'MCD Car Parking — Qulab Colony',
    contractor: 'MCD',
    startedAt: minutesAgo(45),
    endedAt: null,
    maxExcess: 12,
    allowedCapacity: 80,
    peakCount: 92,
    durationMinutes: 45,
    penaltyAmount: 0,
    ruleVersion: 'v2.3',
    status: 'active',
    evidence: generateEvidence('viol-001', minutesAgo(45), 3, 'Qulab'),
  },
  {
    id: 'viol-002',
    lotId: 'lot-004',
    lotName: 'MCD Parking — Padam Singh Road',
    contractor: 'MCD',
    startedAt: minutesAgo(20),
    endedAt: null,
    maxExcess: 15,
    allowedCapacity: 150,
    peakCount: 165,
    durationMinutes: 20,
    penaltyAmount: 0,
    ruleVersion: 'v1.8',
    status: 'active',
    evidence: generateEvidence('viol-002', minutesAgo(20), 1, 'Padam'),
  },
  // Resolved violations
  {
    id: 'viol-003',
    lotId: 'lot-001',
    lotName: 'MCD Parking — Asaf Ali Road',
    contractor: 'MCD',
    startedAt: hoursAgo(6),
    endedAt: hoursAgo(4),
    maxExcess: 18,
    allowedCapacity: 120,
    peakCount: 138,
    durationMinutes: 120,
    penaltyAmount: 1800,
    ruleVersion: 'v2.3',
    status: 'resolved',
    evidence: generateEvidence('viol-003', hoursAgo(6), 8, 'Asaf'),
  },
  {
    id: 'viol-004',
    lotId: 'lot-002',
    lotName: 'MCD Car Parking — Qulab Colony',
    contractor: 'MCD',
    startedAt: daysAgo(1),
    endedAt: new Date(daysAgo(1).getTime() + 90 * 60 * 1000),
    maxExcess: 22,
    allowedCapacity: 80,
    peakCount: 102,
    durationMinutes: 90,
    penaltyAmount: 1320,
    ruleVersion: 'v2.1',
    status: 'resolved',
    evidence: generateEvidence('viol-004', daysAgo(1), 6, 'Qulab'),
  },
  {
    id: 'viol-005',
    lotId: 'lot-003',
    lotName: 'MCD Scooter Parking — Qutub Road Market',
    contractor: 'MCD',
    startedAt: daysAgo(2),
    endedAt: new Date(daysAgo(2).getTime() + 45 * 60 * 1000),
    maxExcess: 25,
    allowedCapacity: 200,
    peakCount: 225,
    durationMinutes: 45,
    penaltyAmount: 562,
    ruleVersion: 'v1.5',
    status: 'resolved',
    evidence: generateEvidence('viol-005', daysAgo(2), 3, 'Qutub'),
  },
  {
    id: 'viol-006',
    lotId: 'lot-004',
    lotName: 'MCD Parking — Padam Singh Road',
    contractor: 'MCD',
    startedAt: daysAgo(3),
    endedAt: new Date(daysAgo(3).getTime() + 180 * 60 * 1000),
    maxExcess: 30,
    allowedCapacity: 150,
    peakCount: 180,
    durationMinutes: 180,
    penaltyAmount: 4050,
    ruleVersion: 'v2.3',
    status: 'resolved',
    evidence: generateEvidence('viol-006', daysAgo(3), 12, 'Padam'),
  },
  {
    id: 'viol-007',
    lotId: 'lot-005',
    lotName: 'MCD Authorized Lot Parking — SBI Edayazham',
    contractor: 'MCD',
    startedAt: daysAgo(5),
    endedAt: new Date(daysAgo(5).getTime() + 60 * 60 * 1000),
    maxExcess: 12,
    allowedCapacity: 100,
    peakCount: 112,
    durationMinutes: 60,
    penaltyAmount: 700,
    ruleVersion: 'v1.2',
    status: 'resolved',
    evidence: generateEvidence('viol-007', daysAgo(5), 4, 'SBI'),
  },
  {
    id: 'viol-008',
    lotId: 'lot-001',
    lotName: 'MCD Parking — Asaf Ali Road',
    contractor: 'MCD',
    startedAt: daysAgo(7),
    endedAt: new Date(daysAgo(7).getTime() + 75 * 60 * 1000),
    maxExcess: 20,
    allowedCapacity: 120,
    peakCount: 140,
    durationMinutes: 75,
    penaltyAmount: 1250,
    ruleVersion: 'v2.1',
    status: 'resolved',
    evidence: generateEvidence('viol-008', daysAgo(7), 5, 'Asaf'),
  },
];

// Chronic offenders data (all MCD)
export const chronicOffenders: ChronicOffender[] = [
  {
    contractor: 'MCD',
    totalViolations: 8,
    totalViolationHours: 10.9,
    totalPenalties: 9682,
    lots: [
      'MCD Parking — Asaf Ali Road',
      'MCD Car Parking — Qulab Colony',
      'MCD Scooter Parking — Qutub Road Market',
      'MCD Parking — Padam Singh Road',
      'MCD Authorized Lot Parking — SBI Edayazham',
    ],
  },
];

// Aggregate stats
export const aggregateStats: AggregateStats = {
  violationsToday: 2,
  violationsThisWeek: 5,
  violationsThisMonth: 8,
  totalPenaltiesAssessed: 9682,
  activeViolations: 2,
  lotsInCompliance: 3,
  lotsViolating: 2,
};

// Heatmap data
export const heatmapData: ViolationHeatmapData[] = (() => {
  const data: ViolationHeatmapData[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // More violations during business hours
      let baseCount = 0;
      if (hour >= 8 && hour <= 18) {
        baseCount = Math.floor(Math.random() * 5);
      } else if (hour >= 6 && hour <= 20) {
        baseCount = Math.floor(Math.random() * 2);
      }
      // Less on weekends
      if (day === 0 || day === 6) {
        baseCount = Math.floor(baseCount * 0.3);
      }
      data.push({ hour, dayOfWeek: day, count: baseCount });
    }
  }
  return data;
})();

// Scenario configs - Only Rush Hour
export const scenarioConfigs: SimulationScenarioConfig[] = [
  {
    id: 'rush_hour',
    name: 'Rush Hour',
    description: 'Simulates 8-9am and 5-6pm traffic patterns with high volume, pushes lots over capacity',
    icon: '🚗',
  },
];

// Helper function to get lot with computed status (no grace period)
export const getLotsWithStatus = (): ParkingLotWithStatus[] => {
  return parkingLots.map(lot => {
    const utilization = (lot.currentCount / lot.allowedCapacity) * 100;
    const activeViolation = violations.find(v => v.lotId === lot.id && v.status === 'active');
    
    // No grace period - immediately violating if over capacity
    let status: ParkingLotWithStatus['status'] = 'compliant';
    if (activeViolation || lot.currentCount > lot.allowedCapacity) {
      status = 'violating';
    }
    
    const countHistory = generateCountHistory(lot.allowedCapacity, status === 'violating');
    
    return {
      ...lot,
      utilization,
      status,
      activeViolation: activeViolation ? {
        id: activeViolation.id,
        lotId: lot.id,
        startedAt: activeViolation.startedAt,
        maxExcess: activeViolation.maxExcess,
        currentExcess: lot.currentCount - lot.allowedCapacity,
        durationMinutes: activeViolation.durationMinutes,
      } : undefined,
      countHistory,
    };
  });
};
