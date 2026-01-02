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

// 8 Parking Lots
export const parkingLots: ParkingLot[] = [
  {
    id: 'lot-001',
    name: 'Downtown Plaza',
    contractor: 'CityPark Inc.',
    allowedCapacity: 100,
    currentCount: 87,
    gracePeriodMinutes: 15,
    penaltyRatePerHour: 50,
    createdAt: daysAgo(365),
    updatedAt: new Date(),
  },
  {
    id: 'lot-002',
    name: 'Airport Terminal P1',
    contractor: 'AeroParking LLC',
    allowedCapacity: 500,
    currentCount: 523,
    gracePeriodMinutes: 10,
    penaltyRatePerHour: 100,
    createdAt: daysAgo(300),
    updatedAt: new Date(),
  },
  {
    id: 'lot-003',
    name: 'Shopping Mall West',
    contractor: 'RetailPark Co.',
    allowedCapacity: 300,
    currentCount: 312,
    gracePeriodMinutes: 20,
    penaltyRatePerHour: 75,
    createdAt: daysAgo(400),
    updatedAt: new Date(),
  },
  {
    id: 'lot-004',
    name: 'Hospital Visitor',
    contractor: 'HealthSpace',
    allowedCapacity: 150,
    currentCount: 142,
    gracePeriodMinutes: 30,
    penaltyRatePerHour: 40,
    createdAt: daysAgo(200),
    updatedAt: new Date(),
  },
  {
    id: 'lot-005',
    name: 'University Main',
    contractor: 'EduPark Services',
    allowedCapacity: 400,
    currentCount: 378,
    gracePeriodMinutes: 15,
    penaltyRatePerHour: 60,
    createdAt: daysAgo(500),
    updatedAt: new Date(),
  },
  {
    id: 'lot-006',
    name: 'Sports Arena',
    contractor: 'EventParking Pro',
    allowedCapacity: 800,
    currentCount: 245,
    gracePeriodMinutes: 10,
    penaltyRatePerHour: 150,
    createdAt: daysAgo(180),
    updatedAt: new Date(),
  },
  {
    id: 'lot-007',
    name: 'Office Tower A',
    contractor: 'CorpPark Solutions',
    allowedCapacity: 200,
    currentCount: 218,
    gracePeriodMinutes: 15,
    penaltyRatePerHour: 80,
    createdAt: daysAgo(250),
    updatedAt: new Date(),
  },
  {
    id: 'lot-008',
    name: 'Train Station',
    contractor: 'TransitPark',
    allowedCapacity: 250,
    currentCount: 198,
    gracePeriodMinutes: 20,
    penaltyRatePerHour: 65,
    createdAt: daysAgo(350),
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

// 18 Historical Violations
export const violations: Violation[] = [
  // Active violations
  {
    id: 'viol-001',
    lotId: 'lot-002',
    lotName: 'Airport Terminal P1',
    contractor: 'AeroParking LLC',
    startedAt: minutesAgo(45),
    endedAt: null,
    maxExcess: 28,
    allowedCapacity: 500,
    peakCount: 528,
    durationMinutes: 45,
    penaltyAmount: 0,
    ruleVersion: 'v2.3',
    status: 'active',
    evidence: generateEvidence('viol-001', minutesAgo(45), 3, 'Airport'),
  },
  {
    id: 'viol-002',
    lotId: 'lot-003',
    lotName: 'Shopping Mall West',
    contractor: 'RetailPark Co.',
    startedAt: minutesAgo(8),
    endedAt: null,
    maxExcess: 12,
    allowedCapacity: 300,
    peakCount: 312,
    durationMinutes: 8,
    penaltyAmount: 0,
    ruleVersion: 'v1.8',
    status: 'active',
    evidence: generateEvidence('viol-002', minutesAgo(8), 1, 'Mall'),
  },
  {
    id: 'viol-003',
    lotId: 'lot-007',
    lotName: 'Office Tower A',
    contractor: 'CorpPark Solutions',
    startedAt: minutesAgo(25),
    endedAt: null,
    maxExcess: 18,
    allowedCapacity: 200,
    peakCount: 218,
    durationMinutes: 25,
    penaltyAmount: 0,
    ruleVersion: 'v2.1',
    status: 'active',
    evidence: generateEvidence('viol-003', minutesAgo(25), 2, 'Office'),
  },
  // Resolved violations
  {
    id: 'viol-004',
    lotId: 'lot-002',
    lotName: 'Airport Terminal P1',
    contractor: 'AeroParking LLC',
    startedAt: hoursAgo(6),
    endedAt: hoursAgo(4),
    maxExcess: 45,
    allowedCapacity: 500,
    peakCount: 545,
    durationMinutes: 120,
    penaltyAmount: 450,
    ruleVersion: 'v2.3',
    status: 'resolved',
    evidence: generateEvidence('viol-004', hoursAgo(6), 8, 'Airport'),
  },
  {
    id: 'viol-005',
    lotId: 'lot-007',
    lotName: 'Office Tower A',
    contractor: 'CorpPark Solutions',
    startedAt: daysAgo(1),
    endedAt: new Date(daysAgo(1).getTime() + 90 * 60 * 1000),
    maxExcess: 32,
    allowedCapacity: 200,
    peakCount: 232,
    durationMinutes: 90,
    penaltyAmount: 384,
    ruleVersion: 'v2.1',
    status: 'resolved',
    evidence: generateEvidence('viol-005', daysAgo(1), 6, 'Office'),
  },
  {
    id: 'viol-006',
    lotId: 'lot-001',
    lotName: 'Downtown Plaza',
    contractor: 'CityPark Inc.',
    startedAt: daysAgo(2),
    endedAt: new Date(daysAgo(2).getTime() + 45 * 60 * 1000),
    maxExcess: 15,
    allowedCapacity: 100,
    peakCount: 115,
    durationMinutes: 45,
    penaltyAmount: 75,
    ruleVersion: 'v1.5',
    status: 'resolved',
    evidence: generateEvidence('viol-006', daysAgo(2), 3, 'Downtown'),
  },
  {
    id: 'viol-007',
    lotId: 'lot-002',
    lotName: 'Airport Terminal P1',
    contractor: 'AeroParking LLC',
    startedAt: daysAgo(3),
    endedAt: new Date(daysAgo(3).getTime() + 180 * 60 * 1000),
    maxExcess: 67,
    allowedCapacity: 500,
    peakCount: 567,
    durationMinutes: 180,
    penaltyAmount: 670,
    ruleVersion: 'v2.3',
    status: 'resolved',
    evidence: generateEvidence('viol-007', daysAgo(3), 12, 'Airport'),
  },
  {
    id: 'viol-008',
    lotId: 'lot-005',
    lotName: 'University Main',
    contractor: 'EduPark Services',
    startedAt: daysAgo(3),
    endedAt: new Date(daysAgo(3).getTime() + 60 * 60 * 1000),
    maxExcess: 28,
    allowedCapacity: 400,
    peakCount: 428,
    durationMinutes: 60,
    penaltyAmount: 168,
    ruleVersion: 'v1.2',
    status: 'resolved',
    evidence: generateEvidence('viol-008', daysAgo(3), 4, 'University'),
  },
  {
    id: 'viol-009',
    lotId: 'lot-007',
    lotName: 'Office Tower A',
    contractor: 'CorpPark Solutions',
    startedAt: daysAgo(4),
    endedAt: new Date(daysAgo(4).getTime() + 75 * 60 * 1000),
    maxExcess: 25,
    allowedCapacity: 200,
    peakCount: 225,
    durationMinutes: 75,
    penaltyAmount: 250,
    ruleVersion: 'v2.1',
    status: 'resolved',
    evidence: generateEvidence('viol-009', daysAgo(4), 5, 'Office'),
  },
  {
    id: 'viol-010',
    lotId: 'lot-002',
    lotName: 'Airport Terminal P1',
    contractor: 'AeroParking LLC',
    startedAt: daysAgo(5),
    endedAt: new Date(daysAgo(5).getTime() + 240 * 60 * 1000),
    maxExcess: 89,
    allowedCapacity: 500,
    peakCount: 589,
    durationMinutes: 240,
    penaltyAmount: 1780,
    ruleVersion: 'v2.3',
    status: 'resolved',
    evidence: generateEvidence('viol-010', daysAgo(5), 16, 'Airport'),
  },
  {
    id: 'viol-011',
    lotId: 'lot-003',
    lotName: 'Shopping Mall West',
    contractor: 'RetailPark Co.',
    startedAt: daysAgo(6),
    endedAt: new Date(daysAgo(6).getTime() + 55 * 60 * 1000),
    maxExcess: 22,
    allowedCapacity: 300,
    peakCount: 322,
    durationMinutes: 55,
    penaltyAmount: 137,
    ruleVersion: 'v1.8',
    status: 'resolved',
    evidence: generateEvidence('viol-011', daysAgo(6), 4, 'Mall'),
  },
  {
    id: 'viol-012',
    lotId: 'lot-007',
    lotName: 'Office Tower A',
    contractor: 'CorpPark Solutions',
    startedAt: daysAgo(7),
    endedAt: new Date(daysAgo(7).getTime() + 110 * 60 * 1000),
    maxExcess: 38,
    allowedCapacity: 200,
    peakCount: 238,
    durationMinutes: 110,
    penaltyAmount: 557,
    ruleVersion: 'v2.1',
    status: 'resolved',
    evidence: generateEvidence('viol-012', daysAgo(7), 7, 'Office'),
  },
  {
    id: 'viol-013',
    lotId: 'lot-002',
    lotName: 'Airport Terminal P1',
    contractor: 'AeroParking LLC',
    startedAt: daysAgo(10),
    endedAt: new Date(daysAgo(10).getTime() + 95 * 60 * 1000),
    maxExcess: 52,
    allowedCapacity: 500,
    peakCount: 552,
    durationMinutes: 95,
    penaltyAmount: 823,
    ruleVersion: 'v2.3',
    status: 'resolved',
    evidence: generateEvidence('viol-013', daysAgo(10), 6, 'Airport'),
  },
  {
    id: 'viol-014',
    lotId: 'lot-006',
    lotName: 'Sports Arena',
    contractor: 'EventParking Pro',
    startedAt: daysAgo(14),
    endedAt: new Date(daysAgo(14).getTime() + 180 * 60 * 1000),
    maxExcess: 120,
    allowedCapacity: 800,
    peakCount: 920,
    durationMinutes: 180,
    penaltyAmount: 1800,
    ruleVersion: 'v1.0',
    status: 'resolved',
    evidence: generateEvidence('viol-014', daysAgo(14), 12, 'Arena'),
  },
  {
    id: 'viol-015',
    lotId: 'lot-002',
    lotName: 'Airport Terminal P1',
    contractor: 'AeroParking LLC',
    startedAt: daysAgo(21),
    endedAt: new Date(daysAgo(21).getTime() + 300 * 60 * 1000),
    maxExcess: 78,
    allowedCapacity: 500,
    peakCount: 578,
    durationMinutes: 300,
    penaltyAmount: 1950,
    ruleVersion: 'v2.2',
    status: 'resolved',
    evidence: generateEvidence('viol-015', daysAgo(21), 20, 'Airport'),
  },
  {
    id: 'viol-016',
    lotId: 'lot-007',
    lotName: 'Office Tower A',
    contractor: 'CorpPark Solutions',
    startedAt: daysAgo(25),
    endedAt: new Date(daysAgo(25).getTime() + 65 * 60 * 1000),
    maxExcess: 22,
    allowedCapacity: 200,
    peakCount: 222,
    durationMinutes: 65,
    penaltyAmount: 238,
    ruleVersion: 'v2.0',
    status: 'resolved',
    evidence: generateEvidence('viol-016', daysAgo(25), 4, 'Office'),
  },
  {
    id: 'viol-017',
    lotId: 'lot-005',
    lotName: 'University Main',
    contractor: 'EduPark Services',
    startedAt: daysAgo(28),
    endedAt: new Date(daysAgo(28).getTime() + 85 * 60 * 1000),
    maxExcess: 35,
    allowedCapacity: 400,
    peakCount: 435,
    durationMinutes: 85,
    penaltyAmount: 297,
    ruleVersion: 'v1.2',
    status: 'resolved',
    evidence: generateEvidence('viol-017', daysAgo(28), 6, 'University'),
  },
  {
    id: 'viol-018',
    lotId: 'lot-002',
    lotName: 'Airport Terminal P1',
    contractor: 'AeroParking LLC',
    startedAt: daysAgo(30),
    endedAt: new Date(daysAgo(30).getTime() + 150 * 60 * 1000),
    maxExcess: 61,
    allowedCapacity: 500,
    peakCount: 561,
    durationMinutes: 150,
    penaltyAmount: 762,
    ruleVersion: 'v2.2',
    status: 'resolved',
    evidence: generateEvidence('viol-018', daysAgo(30), 10, 'Airport'),
  },
];

// Chronic offenders data
export const chronicOffenders: ChronicOffender[] = [
  {
    contractor: 'AeroParking LLC',
    totalViolations: 7,
    totalViolationHours: 18.5,
    totalPenalties: 6435,
    lots: ['Airport Terminal P1'],
  },
  {
    contractor: 'CorpPark Solutions',
    totalViolations: 5,
    totalViolationHours: 6.1,
    totalPenalties: 1429,
    lots: ['Office Tower A'],
  },
  {
    contractor: 'RetailPark Co.',
    totalViolations: 2,
    totalViolationHours: 1.05,
    totalPenalties: 137,
    lots: ['Shopping Mall West'],
  },
  {
    contractor: 'EduPark Services',
    totalViolations: 2,
    totalViolationHours: 2.4,
    totalPenalties: 465,
    lots: ['University Main'],
  },
  {
    contractor: 'EventParking Pro',
    totalViolations: 1,
    totalViolationHours: 3.0,
    totalPenalties: 1800,
    lots: ['Sports Arena'],
  },
  {
    contractor: 'CityPark Inc.',
    totalViolations: 1,
    totalViolationHours: 0.75,
    totalPenalties: 75,
    lots: ['Downtown Plaza'],
  },
];

// Aggregate stats
export const aggregateStats: AggregateStats = {
  violationsToday: 3,
  violationsThisWeek: 8,
  violationsThisMonth: 18,
  totalPenaltiesAssessed: 10341,
  activeViolations: 3,
  lotsInCompliance: 5,
  lotsInGracePeriod: 1,
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

// Scenario configs
export const scenarioConfigs: SimulationScenarioConfig[] = [
  {
    id: 'rush_hour',
    name: 'Rush Hour',
    description: 'Simulates 8-9am and 5-6pm traffic patterns with high volume',
    icon: '🚗',
  },
  {
    id: 'overnight',
    name: 'Overnight',
    description: 'Minimal activity with occasional random spikes',
    icon: '🌙',
  },
  {
    id: 'weekend',
    name: 'Weekend',
    description: 'Moderate, steady traffic throughout the day',
    icon: '☀️',
  },
  {
    id: 'stress_test',
    name: 'Stress Test',
    description: 'All lots pushed near or over capacity',
    icon: '⚡',
  },
];

// Helper function to get lot with computed status
export const getLotsWithStatus = (): ParkingLotWithStatus[] => {
  return parkingLots.map(lot => {
    const utilization = (lot.currentCount / lot.allowedCapacity) * 100;
    const activeViolation = violations.find(v => v.lotId === lot.id && v.status === 'active');
    
    let status: ParkingLotWithStatus['status'] = 'compliant';
    if (activeViolation) {
      const graceExpired = new Date(activeViolation.startedAt.getTime() + lot.gracePeriodMinutes * 60 * 1000) < new Date();
      status = graceExpired ? 'violating' : 'grace_period';
    } else if (lot.currentCount > lot.allowedCapacity) {
      status = 'grace_period';
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
        graceExpiresAt: new Date(activeViolation.startedAt.getTime() + lot.gracePeriodMinutes * 60 * 1000),
        maxExcess: activeViolation.maxExcess,
        currentExcess: lot.currentCount - lot.allowedCapacity,
        durationMinutes: activeViolation.durationMinutes,
        isInGracePeriod: status === 'grace_period',
      } : undefined,
      countHistory,
    };
  });
};