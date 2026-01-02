# Smart Parking Capacity Enforcement System - Backend Export

This document contains the complete backend code for running with Express and Prisma.

## Quick Start

```bash
mkdir parking-backend && cd parking-backend
npm init -y
npm install express prisma @prisma/client cors
npm install -D typescript @types/express @types/node ts-node nodemon
npx prisma init
```

## Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model ParkingLot {
  id                 String         @id @default(cuid())
  name               String
  contractor         String
  allowedCapacity    Int
  gracePeriodMinutes Int            @default(15)
  penaltyRatePerHour Float          @default(50)
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt
  
  countEvents        CountEvent[]
  violations         Violation[]
  contractRules      ContractRule[]
}

model ContractRule {
  id                 String    @id @default(cuid())
  lotId              String
  lot                ParkingLot @relation(fields: [lotId], references: [id])
  version            String
  allowedCapacity    Int
  gracePeriodMinutes Int
  penaltyRatePerHour Float
  effectiveFrom      DateTime
  effectiveTo        DateTime?
  createdAt          DateTime  @default(now())
  
  @@index([lotId, effectiveFrom])
}

model CountEvent {
  id           String     @id @default(cuid())
  lotId        String
  lot          ParkingLot @relation(fields: [lotId], references: [id])
  timestamp    DateTime   @default(now())
  vehicleCount Int
  source       String     @default("sensor") // sensor, manual, simulation
  
  @@index([lotId, timestamp])
}

model Violation {
  id              String     @id @default(cuid())
  lotId           String
  lot             ParkingLot @relation(fields: [lotId], references: [id])
  startedAt       DateTime
  endedAt         DateTime?
  maxExcess       Int
  allowedCapacity Int
  peakCount       Int
  durationMinutes Int        @default(0)
  penaltyAmount   Float      @default(0)
  ruleVersion     String
  status          String     @default("active") // active, resolved
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  evidence        Evidence[]
  
  @@index([lotId, status])
  @@index([startedAt])
}

model Evidence {
  id           String    @id @default(cuid())
  violationId  String
  violation    Violation @relation(fields: [violationId], references: [id])
  capturedAt   DateTime
  vehicleCount Int
  imageUrl     String
  sha256Hash   String
  cameraId     String
  lotSection   String
  createdAt    DateTime  @default(now())
  
  @@index([violationId])
}
```

## Express Server (`src/app.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { RuleEngine } from './services/ruleEngine';
import { Simulator } from './services/simulator';

const app = express();
const prisma = new PrismaClient();
const ruleEngine = new RuleEngine(prisma);
const simulator = new Simulator(prisma, ruleEngine);

app.use(cors());
app.use(express.json());

// Get all parking lots with current status
app.get('/api/lots', async (req, res) => {
  const lots = await prisma.parkingLot.findMany({
    include: {
      countEvents: { orderBy: { timestamp: 'desc' }, take: 1 },
      violations: { where: { status: 'active' } }
    }
  });
  
  const lotsWithStatus = lots.map(lot => {
    const currentCount = lot.countEvents[0]?.vehicleCount || 0;
    const activeViolation = lot.violations[0];
    const utilization = (currentCount / lot.allowedCapacity) * 100;
    
    let status = 'compliant';
    if (activeViolation) {
      const graceExpired = new Date(activeViolation.startedAt.getTime() + lot.gracePeriodMinutes * 60000) < new Date();
      status = graceExpired ? 'violating' : 'grace_period';
    } else if (currentCount > lot.allowedCapacity) {
      status = 'grace_period';
    }
    
    return { ...lot, currentCount, utilization, status, activeViolation };
  });
  
  res.json(lotsWithStatus);
});

// Ingest count event
app.post('/api/events/count', async (req, res) => {
  const { lotId, vehicleCount, source = 'sensor' } = req.body;
  
  const event = await prisma.countEvent.create({
    data: { lotId, vehicleCount, source }
  });
  
  await ruleEngine.processCountEvent(lotId, vehicleCount);
  res.json(event);
});

// Get violations
app.get('/api/violations', async (req, res) => {
  const { status, lotId } = req.query;
  const violations = await prisma.violation.findMany({
    where: {
      ...(status && { status: status as string }),
      ...(lotId && { lotId: lotId as string })
    },
    include: { lot: true, evidence: true },
    orderBy: { startedAt: 'desc' }
  });
  res.json(violations);
});

// Get violation by ID
app.get('/api/violations/:id', async (req, res) => {
  const violation = await prisma.violation.findUnique({
    where: { id: req.params.id },
    include: { lot: true, evidence: { orderBy: { capturedAt: 'asc' } } }
  });
  res.json(violation);
});

// Start simulation
app.post('/api/simulate/start', async (req, res) => {
  const { scenario } = req.body;
  await simulator.start(scenario);
  res.json({ running: true, scenario });
});

// Stop simulation
app.post('/api/simulate/stop', async (req, res) => {
  simulator.stop();
  res.json({ running: false });
});

// Analytics endpoints
app.get('/api/analytics/chronic-offenders', async (req, res) => {
  const offenders = await prisma.violation.groupBy({
    by: ['lotId'],
    _count: { id: true },
    _sum: { durationMinutes: true, penaltyAmount: true }
  });
  res.json(offenders);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## Rule Engine (`src/services/ruleEngine.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export class RuleEngine {
  private activeViolations = new Map<string, { startedAt: Date; maxExcess: number }>();
  
  constructor(private prisma: PrismaClient) {}
  
  async processCountEvent(lotId: string, vehicleCount: number) {
    const lot = await this.prisma.parkingLot.findUnique({ where: { id: lotId } });
    if (!lot) return;
    
    const excess = vehicleCount - lot.allowedCapacity;
    
    if (excess > 0) {
      const existing = this.activeViolations.get(lotId);
      
      if (!existing) {
        // Start new violation tracking
        this.activeViolations.set(lotId, { startedAt: new Date(), maxExcess: excess });
        
        // Create violation record after grace period
        setTimeout(async () => {
          const current = this.activeViolations.get(lotId);
          if (current) {
            await this.prisma.violation.create({
              data: {
                lotId,
                startedAt: current.startedAt,
                maxExcess: current.maxExcess,
                allowedCapacity: lot.allowedCapacity,
                peakCount: lot.allowedCapacity + current.maxExcess,
                ruleVersion: 'v1.0',
                status: 'active'
              }
            });
          }
        }, lot.gracePeriodMinutes * 60000);
      } else if (excess > existing.maxExcess) {
        existing.maxExcess = excess;
      }
    } else {
      // Resolve violation if exists
      const existing = this.activeViolations.get(lotId);
      if (existing) {
        const duration = Math.floor((Date.now() - existing.startedAt.getTime()) / 60000);
        const penalty = existing.maxExcess * (duration / 60) * lot.penaltyRatePerHour;
        
        await this.prisma.violation.updateMany({
          where: { lotId, status: 'active' },
          data: { endedAt: new Date(), durationMinutes: duration, penaltyAmount: penalty, status: 'resolved' }
        });
        
        this.activeViolations.delete(lotId);
      }
    }
  }
  
  generateEvidenceHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
```

## Seed Data (`prisma/seed.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const lots = [
    { name: 'Downtown Plaza', contractor: 'CityPark Inc.', allowedCapacity: 100 },
    { name: 'Airport Terminal P1', contractor: 'AeroParking LLC', allowedCapacity: 500 },
    { name: 'Shopping Mall West', contractor: 'RetailPark Co.', allowedCapacity: 300 },
    { name: 'Hospital Visitor', contractor: 'HealthSpace', allowedCapacity: 150 },
    { name: 'University Main', contractor: 'EduPark Services', allowedCapacity: 400 },
    { name: 'Sports Arena', contractor: 'EventParking Pro', allowedCapacity: 800 },
    { name: 'Office Tower A', contractor: 'CorpPark Solutions', allowedCapacity: 200 },
    { name: 'Train Station', contractor: 'TransitPark', allowedCapacity: 250 },
  ];
  
  for (const lot of lots) {
    await prisma.parkingLot.create({ data: lot });
  }
  
  console.log('Seed data created!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

## Running the Backend

1. Set `DATABASE_URL` in `.env`
2. Run `npx prisma migrate dev`
3. Run `npx prisma db seed`
4. Run `npx ts-node src/app.ts`

The API will be available at `http://localhost:3001`.
