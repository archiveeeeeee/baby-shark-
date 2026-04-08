from pathlib import Path
root = Path('/mnt/data/meeko-clone')

def write(path, content):
    p = root / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8')

write('package.json', '''{
  "name": "nido-suite",
  "private": true,
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev:web": "npm --workspace apps/web run dev",
    "dev:api": "npm --workspace apps/api run dev",
    "build": "npm --workspace apps/web run build && npm --workspace apps/api run build",
    "start:web": "npm --workspace apps/web run start",
    "start:api": "npm --workspace apps/api run start"
  }
}
''')

write('.env.example', '''# Web
NEXT_PUBLIC_APP_NAME=Nido Suite
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# API
PORT=4000
NODE_ENV=development
JWT_SECRET=change_me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nido_suite
''')

write('README.md', '''# Nido Suite

Nido Suite is a commercial-grade childcare SaaS starter inspired by the market structure of products like Meeko, but delivered with a new identity, clean architecture, and a deployable monorepo foundation.

## What is included

- **Marketing website**
- **Back-office / structure admin portal**
- **Team portal (PWA-ready UI)**
- **Family portal (PWA-ready UI)**
- **Platform superadmin portal**
- **Express API** with typed routes and realistic domain modules
- **Prisma schema** for a production database foundation
- **Seed-ready mock domain data**
- **Deployment files** and starter scripts

## Tech stack

- Web: Next.js 15 + TypeScript + App Router
- API: Express + TypeScript
- Database model: Prisma + PostgreSQL
- Styling: CSS modules + design tokens

## Workspace layout

```\n.
├── apps
│   ├── api
│   └── web
├── .env.example
├── docker-compose.yml
└── README.md
```

## Quick start

1. Copy `.env.example` to `.env` in the repository root.
2. Install dependencies:
   - `npm install`
3. Run the API:
   - `npm run dev:api`
4. Run the web app:
   - `npm run dev:web`
5. Open `http://localhost:3000`

## Portals

- Marketing: `/`
- Login hub: `/login`
- Superadmin: `/superadmin`
- Structure back-office: `/admin`
- Team app: `/team`
- Family app: `/family`

## Product positioning

This starter replicates the **product logic and portal structure** of a modern childcare SaaS:

- pre-enrolment and contracts
- occupancy and staffing planning
- child daily reporting
- billing and payments
- parent communication
- HR and attendance
- multi-tenant platform administration

## Reality check

This is a **serious MVP foundation**, not a legally finished enterprise clone. Before commercial launch, you still need:

- real authentication provider and password reset emails
- production database migrations and backups
- media storage and CDN
- PDF/DOCX generation engine
- legal review (GDPR, billing, e-sign, country-specific childcare compliance)
- automated tests and monitoring
- payment provider and bank integrations

That is the difference between a strong deployable product base and a fully hardened company.
''')

write('docker-compose.yml', '''version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: nido_suite
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
''')

write('apps/api/package.json', '''{
  "name": "@nido/api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
''')

write('apps/api/tsconfig.json', '''{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"]
}
''')

write('apps/api/prisma/schema.prisma', '''generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SUPERADMIN
  STRUCTURE_ADMIN
  MANAGER
  STAFF
  FAMILY
}

enum EnrollmentStatus {
  NEW
  REVIEW
  WAITLIST
  ACCEPTED
  REJECTED
  CONVERTED
}

enum ContractStatus {
  DRAFT
  ACTIVE
  ENDED
  CANCELLED
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  OVERDUE
  CANCELLED
}

model Tenant {
  id             String      @id @default(cuid())
  slug           String      @unique
  name           String
  email          String?
  phone          String?
  city           String?
  country        String?     @default("BE")
  timezone       String      @default("Europe/Brussels")
  plan           String      @default("growth")
  status         String      @default("active")
  logoUrl        String?
  maxChildren    Int         @default(40)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  users          User[]
  children       Child[]
  families       Family[]
  enrollments    Enrollment[]
  contracts      Contract[]
  invoices       Invoice[]
  staffMembers   StaffMember[]
}

model User {
  id           String      @id @default(cuid())
  tenantId     String?
  tenant       Tenant?     @relation(fields: [tenantId], references: [id])
  firstName    String
  lastName     String
  email        String      @unique
  role         UserRole
  passwordHash String
  createdAt    DateTime    @default(now())
}

model Family {
  id            String      @id @default(cuid())
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id])
  primaryName   String
  primaryEmail  String      @unique
  phone         String?
  billingIban   String?
  children      Child[]
  createdAt     DateTime    @default(now())
}

model Child {
  id            String      @id @default(cuid())
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id])
  familyId      String
  family        Family      @relation(fields: [familyId], references: [id])
  firstName     String
  lastName      String
  birthDate     DateTime
  groupName     String?
  allergies     String?
  contracts     Contract[]
  createdAt     DateTime    @default(now())
}

model Enrollment {
  id              String           @id @default(cuid())
  tenantId        String
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  childFirstName  String
  childLastName   String
  desiredStart    DateTime
  scheduleLabel   String
  notes           String?
  status          EnrollmentStatus @default(NEW)
  createdAt       DateTime         @default(now())
}

model Contract {
  id              String         @id @default(cuid())
  tenantId        String
  tenant          Tenant         @relation(fields: [tenantId], references: [id])
  childId         String
  child           Child          @relation(fields: [childId], references: [id])
  startDate       DateTime
  endDate         DateTime?
  weeklyHours     Int
  monthlyRate     Float
  status          ContractStatus @default(DRAFT)
  createdAt       DateTime       @default(now())
}

model Invoice {
  id             String        @id @default(cuid())
  tenantId       String
  tenant         Tenant        @relation(fields: [tenantId], references: [id])
  familyId       String
  number         String        @unique
  amount         Float
  issueDate      DateTime
  dueDate        DateTime
  status         InvoiceStatus @default(DRAFT)
  createdAt      DateTime      @default(now())
}

model StaffMember {
  id             String      @id @default(cuid())
  tenantId       String
  tenant         Tenant      @relation(fields: [tenantId], references: [id])
  firstName      String
  lastName       String
  roleLabel      String
  contractHours  Int
  visibleInTeam  Boolean     @default(true)
  createdAt      DateTime    @default(now())
}
''')

write('apps/api/src/config.ts', '''import dotenv from "dotenv";

dotenv.config({ path: process.cwd() + "/../../.env" });

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "change_me",
};
''')

write('apps/api/src/types.ts', '''export type PortalRole = "superadmin" | "admin" | "team" | "family";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  city: string;
  children: number;
  occupancy: number;
  monthlyRevenue: number;
  plan: string;
  status: "active" | "trial" | "paused";
}

export interface Enrollment {
  id: string;
  childName: string;
  desiredStart: string;
  schedule: string;
  status: "new" | "review" | "waitlist" | "accepted";
  familyName: string;
}

export interface ChildDayLog {
  id: string;
  childName: string;
  group: string;
  arrival: string;
  meals: string[];
  naps: string[];
  activities: string[];
  health: string[];
}

export interface Invoice {
  id: string;
  familyName: string;
  number: string;
  amount: number;
  dueDate: string;
  status: "draft" | "issued" | "paid" | "overdue";
}

export interface StaffMember {
  id: string;
  fullName: string;
  role: string;
  weeklyHours: number;
  status: "present" | "off" | "planned";
}
''')

write('apps/api/src/data/mock-db.ts', '''import { ChildDayLog, Enrollment, Invoice, StaffMember, Tenant } from "../types.js";

export const tenants: Tenant[] = [
  {
    id: "t_1",
    slug: "petits-pas",
    name: "Les Petits Pas",
    city: "Bruxelles",
    children: 42,
    occupancy: 91,
    monthlyRevenue: 18640,
    plan: "Growth",
    status: "active",
  },
  {
    id: "t_2",
    slug: "matin-calme",
    name: "Le Matin Calme",
    city: "Namur",
    children: 28,
    occupancy: 84,
    monthlyRevenue: 12100,
    plan: "Scale",
    status: "trial",
  }
];

export const enrollments: Enrollment[] = [
  { id: "e_1", childName: "Lina Dupont", familyName: "Dupont", desiredStart: "2026-09-01", schedule: "4 jours / semaine", status: "new" },
  { id: "e_2", childName: "Adam Legrand", familyName: "Legrand", desiredStart: "2026-08-15", schedule: "Temps plein", status: "review" },
  { id: "e_3", childName: "Noah Simon", familyName: "Simon", desiredStart: "2026-10-01", schedule: "3 jours / semaine", status: "accepted" },
];

export const logs: ChildDayLog[] = [
  {
    id: "l_1",
    childName: "Lina Dupont",
    group: "Bébés",
    arrival: "08:11",
    meals: ["Biberon 120 ml - 09:00", "Purée légumes - 11:40"],
    naps: ["09:35 → 10:20", "13:05 → 14:32"],
    activities: ["Eveil musical", "Parcours sensoriel"],
    health: ["Température normale", "Aucun traitement"],
  },
  {
    id: "l_2",
    childName: "Mila Bernard",
    group: "Moyens",
    arrival: "08:47",
    meals: ["Collation fruits - 10:00", "Repas complet - 11:55"],
    naps: ["13:10 → 14:05"],
    activities: ["Peinture propre", "Lecture"],
    health: ["Change OK - 10:10", "RAS"],
  },
];

export const invoices: Invoice[] = [
  { id: "i_1", familyName: "Dupont", number: "INV-2026-041", amount: 812.4, dueDate: "2026-04-10", status: "issued" },
  { id: "i_2", familyName: "Legrand", number: "INV-2026-042", amount: 965.0, dueDate: "2026-04-05", status: "overdue" },
  { id: "i_3", familyName: "Simon", number: "INV-2026-043", amount: 702.9, dueDate: "2026-04-14", status: "draft" },
];

export const staff: StaffMember[] = [
  { id: "s_1", fullName: "Claire Martin", role: "Référente section bébés", weeklyHours: 38, status: "present" },
  { id: "s_2", fullName: "Nora Lambert", role: "Auxiliaire", weeklyHours: 32, status: "planned" },
  { id: "s_3", fullName: "Thomas Rey", role: "Direction", weeklyHours: 39, status: "present" },
];
''')

write('apps/api/src/modules/health.ts', '''import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "nido-api",
    checkedAt: new Date().toISOString(),
    storage: {
      mode: "mock-ready / prisma-ready"
    }
  });
});
''')

write('apps/api/src/modules/auth.ts', '''import { Router } from "express";
import { z } from "zod";

export const authRouter = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  portal: z.enum(["superadmin", "admin", "team", "family"]),
});

authRouter.post("/login", (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  return res.json({
    ok: true,
    token: "demo-token",
    user: {
      id: "u_demo",
      firstName: parsed.data.portal === "family" ? "Camille" : "Alex",
      lastName: "Demo",
      email: parsed.data.email,
      portal: parsed.data.portal,
    }
  });
});
''')

write('apps/api/src/modules/platform.ts', '''import { Router } from "express";
import { tenants } from "../data/mock-db.js";

export const platformRouter = Router();

platformRouter.get("/overview", (_req, res) => {
  const active = tenants.filter((tenant) => tenant.status === "active").length;
  const trial = tenants.filter((tenant) => tenant.status === "trial").length;
  const revenue = tenants.reduce((acc, tenant) => acc + tenant.monthlyRevenue, 0);

  res.json({
    ok: true,
    metrics: {
      tenants: tenants.length,
      active,
      trial,
      mrr: revenue,
      occupancyAverage: Math.round(tenants.reduce((acc, tenant) => acc + tenant.occupancy, 0) / tenants.length),
    },
    tenants,
  });
});
''')

write('apps/api/src/modules/admin.ts', '''import { Router } from "express";
import { enrollments, invoices, staff, tenants } from "../data/mock-db.js";

export const adminRouter = Router();

adminRouter.get("/dashboard", (_req, res) => {
  const tenant = tenants[0];

  res.json({
    ok: true,
    tenant,
    kpis: {
      activeChildren: tenant.children,
      occupancy: tenant.occupancy,
      pendingEnrollments: enrollments.filter((item) => item.status === "new" || item.status === "review").length,
      overdueInvoices: invoices.filter((item) => item.status === "overdue").length,
      presentStaff: staff.filter((item) => item.status === "present").length,
    },
    enrollments,
    invoices,
    staff,
  });
});
''')

write('apps/api/src/modules/team.ts', '''import { Router } from "express";
import { logs, staff } from "../data/mock-db.js";

export const teamRouter = Router();

teamRouter.get("/today", (_req, res) => {
  res.json({
    ok: true,
    date: new Date().toISOString().slice(0, 10),
    presentChildren: logs.length + 7,
    teamStatus: staff,
    logs,
    quickActions: [
      "Pointer une arrivée",
      "Ajouter un repas",
      "Déclarer une sieste",
      "Envoyer une transmission parent",
      "Prendre une photo sécurisée"
    ]
  });
});
''')

write('apps/api/src/modules/family.ts', '''import { Router } from "express";

export const familyRouter = Router();

familyRouter.get("/home", (_req, res) => {
  res.json({
    ok: true,
    child: {
      firstName: "Lina",
      group: "Bébés",
      arrival: "08:11",
      meals: ["Biberon 120 ml", "Purée légumes"],
      naps: ["09:35 → 10:20", "13:05 → 14:32"],
    },
    feed: [
      {
        id: "f_1",
        time: "09:12",
        title: "Photo du matin",
        body: "Lina a commencé sa journée avec un atelier sensoriel très calme.",
      },
      {
        id: "f_2",
        time: "11:48",
        title: "Repas terminé",
        body: "Très bon appétit aujourd'hui, tout le repas a été pris.",
      }
    ],
    documents: [
      { id: "d_1", name: "Facture avril 2026.pdf", category: "Facturation" },
      { id: "d_2", name: "Projet pédagogique.pdf", category: "Documents utiles" }
    ]
  });
});
''')

write('apps/api/src/app.ts', '''import cors from "cors";
import express from "express";
import { adminRouter } from "./modules/admin.js";
import { authRouter } from "./modules/auth.js";
import { familyRouter } from "./modules/family.js";
import { healthRouter } from "./modules/health.js";
import { platformRouter } from "./modules/platform.js";
import { teamRouter } from "./modules/team.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/platform", platformRouter);
app.use("/api/admin", adminRouter);
app.use("/api/team", teamRouter);
app.use("/api/family", familyRouter);

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "nido-api" });
});
''')

write('apps/api/src/server.ts', '''import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`Nido API running on http://localhost:${config.port}`);
});
''')

write('apps/web/package.json', '''{
  "name": "@nido/web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.7.2"
  }
}
''')

write('apps/web/tsconfig.json', '''{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
''')

write('apps/web/next-env.d.ts', '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n')
write('apps/web/next.config.ts', '''import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
''')

write('apps/web/app/globals.css', ''':root {
  --bg: #f5f7fb;
  --surface: #ffffff;
  --surface-alt: #0f172a;
  --text: #121826;
  --muted: #667085;
  --border: #e5e7eb;
  --primary: #5b6cff;
  --primary-soft: #eef1ff;
  --success: #12b76a;
  --warning: #f79009;
  --danger: #f04438;
  --radius: 22px;
  --shadow: 0 18px 50px rgba(17, 24, 39, 0.08);
}
* { box-sizing: border-box; }
html, body { padding: 0; margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; }
body { min-height: 100vh; }
.shell { max-width: 1440px; margin: 0 auto; padding: 24px; }
.page-grid { display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: start; }
.sidebar { background: linear-gradient(180deg, #0f172a 0%, #131f43 100%); color: white; min-height: calc(100vh - 48px); border-radius: 28px; padding: 24px; box-shadow: var(--shadow); position: sticky; top: 24px; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
.brand-badge { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #5b6cff 0%, #a855f7 100%); display: grid; place-items: center; font-weight: 800; }
.sidebar nav { display: flex; flex-direction: column; gap: 8px; }
.sidebar a { padding: 12px 14px; border-radius: 14px; color: rgba(255,255,255,0.84); }
.sidebar a:hover, .sidebar a.active { background: rgba(255,255,255,0.08); color: white; }
.main { display: flex; flex-direction: column; gap: 20px; }
.hero { background: linear-gradient(135deg, #0f172a 0%, #1f3a8a 100%); color: white; padding: 28px; border-radius: 28px; box-shadow: var(--shadow); }
.hero-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: center; }
.card { background: var(--surface); border-radius: 24px; padding: 22px; box-shadow: var(--shadow); border: 1px solid rgba(15, 23, 42, 0.04); }
.card h3, .card h2 { margin-top: 0; }
.muted { color: var(--muted); }
.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.kpi { background: var(--surface); border-radius: 22px; padding: 18px; box-shadow: var(--shadow); }
.kpi .value { font-size: 2rem; font-weight: 800; margin: 8px 0; }
.grid-2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.list { display: flex; flex-direction: column; gap: 12px; }
.list-item { display: flex; justify-content: space-between; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.list-item:last-child { border-bottom: none; }
.badge { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 8px 12px; font-size: 0.85rem; background: var(--primary-soft); color: var(--primary); font-weight: 600; }
.badge.success { background: rgba(18, 183, 106, 0.12); color: var(--success); }
.badge.warning { background: rgba(247, 144, 9, 0.14); color: var(--warning); }
.badge.danger { background: rgba(240, 68, 56, 0.14); color: var(--danger); }
.cta-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
.button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; border-radius: 14px; font-weight: 700; border: none; cursor: pointer; }
.button.primary { background: white; color: #0f172a; }
.button.secondary { background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.1); }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { text-align: left; padding: 12px 10px; border-bottom: 1px solid var(--border); }
.portal-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
.portal-card { background: white; padding: 20px; border-radius: 24px; box-shadow: var(--shadow); }
.section-title { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 16px; }
.small { font-size: 0.9rem; }
.form-card { max-width: 560px; margin: 60px auto; }
.input, .select, .textarea { width: 100%; border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; background: white; }
.form-grid { display: grid; gap: 14px; }
.topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.family-feed { display: flex; flex-direction: column; gap: 14px; }
.feed-item { background: white; padding: 18px; border-radius: 20px; box-shadow: var(--shadow); }
@media (max-width: 1100px) {
  .page-grid, .hero-grid, .grid-2, .kpi-grid, .portal-grid { grid-template-columns: 1fr; }
  .sidebar { position: static; min-height: auto; }
}
''')

write('apps/web/lib/mock.ts', '''export const company = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Nido Suite",
  tag: "La suite SaaS premium pour crèches et structures petite enfance",
};

export const superadminMetrics = [
  { label: "Tenants actifs", value: "18" },
  { label: "MRR estimé", value: "24 820 €" },
  { label: "Essais en cours", value: "6" },
  { label: "Occupation moyenne", value: "87 %" },
];

export const adminMetrics = [
  { label: "Enfants actifs", value: "42" },
  { label: "Pré-inscriptions à traiter", value: "7" },
  { label: "Factures en retard", value: "2" },
  { label: "Présences équipe", value: "11/13" },
];

export const teamActions = [
  "Pointer une arrivée",
  "Ajouter un repas",
  "Ajouter une sieste",
  "Journal de santé",
  "Envoyer transmission",
  "Photo sécurisée",
];

export const familyFeed = [
  { time: "09:12", title: "Atelier sensoriel", body: "Lina a participé avec beaucoup de curiosité à un atelier sensoriel calme ce matin." },
  { time: "11:48", title: "Repas terminé", body: "Très bon appétit aujourd’hui, tout le repas a été pris sereinement." },
  { time: "14:35", title: "Réveil en douceur", body: "Après une belle sieste, Lina s’est réveillée de bonne humeur." },
];

export const tenants = [
  { name: "Les Petits Pas", city: "Bruxelles", status: "active", children: 42, revenue: "18 640 €" },
  { name: "Le Matin Calme", city: "Namur", status: "trial", children: 28, revenue: "12 100 €" },
  { name: "Les Explorateurs", city: "Liège", status: "active", children: 35, revenue: "15 960 €" },
];
''')

write('apps/web/components/Sidebar.tsx', '''import Link from "next/link";

type NavItem = { href: string; label: string; active?: boolean };

export function Sidebar({ title, subtitle, nav }: { title: string; subtitle: string; nav: NavItem[] }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-badge">N</div>
        <div>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div className="small" style={{ color: "rgba(255,255,255,0.66)" }}>{subtitle}</div>
        </div>
      </div>
      <nav>
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className={item.active ? "active" : ""}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
''')

write('apps/web/components/KpiGrid.tsx', '''export function KpiGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="kpi-grid">
      {items.map((item) => (
        <div className="kpi" key={item.label}>
          <div className="muted small">{item.label}</div>
          <div className="value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
''')

write('apps/web/components/Hero.tsx', '''export function Hero({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return (
    <section className="hero">
      <div className="hero-grid">
        <div>
          <div className="badge">{eyebrow}</div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: 12 }}>{title}</h1>
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "1.05rem", maxWidth: 680 }}>{description}</p>
          {actions ? <div className="cta-row">{actions}</div> : null}
        </div>
        <div className="card" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="small" style={{ color: "rgba(255,255,255,0.75)" }}>Positionnement</div>
          <h3 style={{ marginBottom: 10 }}>Un produit réellement commercialisable</h3>
          <p style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.7 }}>
            Portails séparés, modèle multi-tenant, objets métier childcare, design premium, base d’API claire et structure évolutive.
          </p>
        </div>
      </div>
    </section>
  );
}
''')

write('apps/web/app/layout.tsx', '''import "./globals.css";
import type { Metadata } from "next";
import { company } from "@/lib/mock";

export const metadata: Metadata = {
  title: company.name,
  description: company.tag,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
''')

write('apps/web/app/page.tsx', '''import Link from "next/link";
import { Hero } from "@/components/Hero";
import { company } from "@/lib/mock";

const features = [
  {
    title: "Back-office structure",
    body: "Pré-inscriptions, contrats, familles, facturation, RH, statistiques, documents et site vitrine depuis une seule interface.",
  },
  {
    title: "App équipe",
    body: "Présences, repas, siestes, soins, activités, transmissions, photos sécurisées et tâches terrain sur tablette ou mobile.",
  },
  {
    title: "Portail famille",
    body: "Journal de journée, messagerie, documents, factures et informations utiles dans une interface parent claire.",
  },
  {
    title: "Superadmin plateforme",
    body: "Pilotage multi-tenant, suivi d’abonnements, monitoring métier, onboarding et configuration des structures.",
  },
];

export default function HomePage() {
  return (
    <div className="shell">
      <Hero
        eyebrow="SaaS petite enfance"
        title={`${company.name} — la suite premium pour gérer, opérer et faire grandir une crèche.`}
        description="Un produit tout-en-un avec back-office, app équipe, app famille et cockpit plateforme. Design propre, structure sérieuse, base prête à être déployée et industrialisée."
        actions={(
          <>
            <Link href="/login" className="button primary">Accéder aux portails</Link>
            <Link href="/admin" className="button secondary">Voir le back-office</Link>
          </>
        )}
      />

      <section className="portal-grid">
        {features.map((feature) => (
          <article key={feature.title} className="portal-card">
            <h3>{feature.title}</h3>
            <p className="muted">{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="section-title">
            <div>
              <h2>Ce que ce produit couvre</h2>
              <div className="muted">Le moteur métier central d’un SaaS childcare moderne</div>
            </div>
          </div>
          <div className="grid-3">
            {[
              "Pré-inscriptions",
              "Contrats enfants",
              "Facturation",
              "Présences",
              "Transmissions",
              "RH & plannings",
              "Documents",
              "Portail parent",
              "Monitoring plateforme",
            ].map((item) => (
              <div className="card" key={item}>
                <strong>{item}</strong>
                <p className="muted small">Bloc prêt à être poussé vers une implémentation plus profonde.</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Portails rapides</h2>
          <div className="list">
            <Link href="/superadmin" className="list-item"><span>Superadmin</span><span className="badge">Plateforme</span></Link>
            <Link href="/admin" className="list-item"><span>Back-office structure</span><span className="badge">Gestion</span></Link>
            <Link href="/team" className="list-item"><span>App équipe</span><span className="badge">Terrain</span></Link>
            <Link href="/family" className="list-item"><span>Portail famille</span><span className="badge">Parents</span></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
''')

write('apps/web/app/login/page.tsx', '''import Link from "next/link";

const portals = [
  { href: "/superadmin", title: "Superadmin", body: "Pilotage plateforme, tenants, plans, onboarding, monitoring." },
  { href: "/admin", title: "Back-office structure", body: "Enfants, familles, contrats, planning, RH, facturation." },
  { href: "/team", title: "App équipe", body: "Présences, soins, repas, activités, transmissions." },
  { href: "/family", title: "Portail famille", body: "Journal de journée, factures, documents, messagerie." },
];

export default function LoginPage() {
  return (
    <div className="shell">
      <div className="card form-card">
        <h1>Choisissez un portail</h1>
        <p className="muted">La version starter ouvre directement les interfaces pour accélérer la démonstration et le développement produit.</p>
        <div className="form-grid" style={{ marginTop: 18 }}>
          {portals.map((portal) => (
            <Link key={portal.href} href={portal.href} className="card">
              <h3>{portal.title}</h3>
              <p className="muted">{portal.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
''')

# Superadmin
write('apps/web/app/superadmin/page.tsx', '''import { Hero } from "@/components/Hero";
import { KpiGrid } from "@/components/KpiGrid";
import { Sidebar } from "@/components/Sidebar";
import { superadminMetrics, tenants } from "@/lib/mock";

export default function SuperadminPage() {
  return (
    <div className="shell page-grid">
      <Sidebar
        title="Nido Platform"
        subtitle="Cockpit plateforme"
        nav={[
          { href: "/superadmin", label: "Vue d’ensemble", active: true },
          { href: "#", label: "Tenants" },
          { href: "#", label: "Abonnements" },
          { href: "#", label: "Support" },
          { href: "#", label: "Monitoring" },
        ]}
      />
      <main className="main">
        <Hero
          eyebrow="Superadmin"
          title="Une vue claire de la plateforme, sans bruit inutile."
          description="MRR, statut des structures, onboarding, essai, occupation moyenne et points de friction visibles depuis un cockpit unique."
        />
        <KpiGrid items={superadminMetrics} />
        <section className="grid-2">
          <div className="card">
            <div className="section-title">
              <div>
                <h2>Structures suivies</h2>
                <div className="muted">Vue synthétique du portefeuille</div>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Structure</th>
                  <th>Ville</th>
                  <th>Statut</th>
                  <th>Enfants</th>
                  <th>MRR</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.name}>
                    <td>{tenant.name}</td>
                    <td>{tenant.city}</td>
                    <td><span className={`badge ${tenant.status === "trial" ? "warning" : "success"}`}>{tenant.status}</span></td>
                    <td>{tenant.children}</td>
                    <td>{tenant.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2>Actions prioritaires</h2>
            <div className="list">
              <div className="list-item"><span>Finaliser l’onboarding de Le Matin Calme</span><span className="badge warning">Essai</span></div>
              <div className="list-item"><span>Contrôler la croissance du churn risque</span><span className="badge danger">2 alertes</span></div>
              <div className="list-item"><span>Relancer les demandes support non clôturées</span><span className="badge">7 tickets</span></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
''')

# Admin
write('apps/web/app/admin/page.tsx', '''import { Hero } from "@/components/Hero";
import { KpiGrid } from "@/components/KpiGrid";
import { Sidebar } from "@/components/Sidebar";
import { adminMetrics } from "@/lib/mock";

const enrollments = [
  { child: "Lina Dupont", family: "Dupont", start: "01/09/2026", status: "Nouveau" },
  { child: "Adam Legrand", family: "Legrand", start: "15/08/2026", status: "En revue" },
  { child: "Noah Simon", family: "Simon", start: "01/10/2026", status: "Accepté" },
];

const invoices = [
  { number: "INV-2026-041", family: "Dupont", amount: "812,40 €", status: "Émise" },
  { number: "INV-2026-042", family: "Legrand", amount: "965,00 €", status: "En retard" },
  { number: "INV-2026-043", family: "Simon", amount: "702,90 €", status: "Brouillon" },
];

export default function AdminPage() {
  return (
    <div className="shell page-grid">
      <Sidebar
        title="Les Petits Pas"
        subtitle="Back-office structure"
        nav={[
          { href: "/admin", label: "Tableau de bord", active: true },
          { href: "#", label: "Pré-inscriptions" },
          { href: "#", label: "Enfants & familles" },
          { href: "#", label: "Contrats" },
          { href: "#", label: "Facturation" },
          { href: "#", label: "RH & plannings" },
          { href: "#", label: "Documents" },
          { href: "#", label: "Paramètres" },
        ]}
      />
      <main className="main">
        <Hero
          eyebrow="Gestion structure"
          title="Pilote la crèche comme une vraie entreprise, pas comme un tableur bricolé."
          description="Pré-inscriptions, contrats, facturation, RH, planification et reporting dans un cockpit unique pensé pour une direction de structure."
        />
        <KpiGrid items={adminMetrics} />
        <section className="grid-2">
          <div className="card">
            <div className="section-title"><div><h2>Pré-inscriptions</h2><div className="muted">Pipeline actuel</div></div><span className="badge">7 dossiers</span></div>
            <div className="list">
              {enrollments.map((item) => (
                <div className="list-item" key={item.child}>
                  <div>
                    <strong>{item.child}</strong>
                    <div className="muted small">Famille {item.family} · Début souhaité {item.start}</div>
                  </div>
                  <span className="badge">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="section-title"><div><h2>Facturation</h2><div className="muted">Surveillance du mois en cours</div></div></div>
            <div className="list">
              {invoices.map((invoice) => (
                <div className="list-item" key={invoice.number}>
                  <div>
                    <strong>{invoice.number}</strong>
                    <div className="muted small">{invoice.family} · {invoice.amount}</div>
                  </div>
                  <span className={`badge ${invoice.status === "En retard" ? "danger" : invoice.status === "Brouillon" ? "warning" : "success"}`}>{invoice.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="grid-3">
          <div className="card"><h3>RH</h3><p className="muted">Planning équipe, compteurs, absences, postes, contrat et visibilité app.</p></div>
          <div className="card"><h3>Documents</h3><p className="muted">Contrats, modèles, attestations, factures, exports et signatures.</p></div>
          <div className="card"><h3>Site vitrine</h3><p className="muted">Pages publiques, présentation de la structure et formulaire de pré-inscription.</p></div>
        </section>
      </main>
    </div>
  );
}
''')

# Team
write('apps/web/app/team/page.tsx', '''import { Sidebar } from "@/components/Sidebar";
import { teamActions } from "@/lib/mock";

const logs = [
  {
    child: "Lina Dupont",
    group: "Bébés",
    arrival: "08:11",
    items: ["Biberon 120 ml", "Sieste 09:35 → 10:20", "Atelier sensoriel"],
  },
  {
    child: "Mila Bernard",
    group: "Moyens",
    arrival: "08:47",
    items: ["Collation fruits", "Peinture propre", "Change OK"],
  },
];

export default function TeamPage() {
  return (
    <div className="shell page-grid">
      <Sidebar
        title="Nido Team"
        subtitle="App équipe"
        nav={[
          { href: "/team", label: "Aujourd’hui", active: true },
          { href: "#", label: "Pointages" },
          { href: "#", label: "Transmissions" },
          { href: "#", label: "Photos" },
          { href: "#", label: "Santé" },
          { href: "#", label: "Températures" },
        ]}
      />
      <main className="main">
        <section className="hero">
          <div className="topbar">
            <div>
              <div className="badge">Terrain</div>
              <h1 style={{ marginBottom: 8 }}>Vue équipe du jour</h1>
              <div style={{ color: "rgba(255,255,255,0.78)" }}>Conçue pour tablette et mobile avec actions ultra rapides.</div>
            </div>
            <div className="badge success">11 enfants présents</div>
          </div>
          <div className="cta-row">
            {teamActions.map((action) => <button key={action} className="button secondary">{action}</button>)}
          </div>
        </section>
        <section className="grid-2">
          <div className="card">
            <div className="section-title"><div><h2>Journal section</h2><div className="muted">Saisie terrain centralisée</div></div></div>
            <div className="list">
              {logs.map((log) => (
                <div key={log.child} className="card">
                  <div className="topbar">
                    <div>
                      <strong>{log.child}</strong>
                      <div className="muted small">{log.group} · Arrivée {log.arrival}</div>
                    </div>
                    <span className="badge">Suivi du jour</span>
                  </div>
                  <ul>
                    {log.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2>Bloc de sécurité</h2>
            <div className="list">
              <div className="list-item"><span>Contrôle dortoir 13:00</span><span className="badge success">OK</span></div>
              <div className="list-item"><span>Température frigo</span><span className="badge">4°C</span></div>
              <div className="list-item"><span>Température plat</span><span className="badge warning">À recontrôler</span></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
''')

# Family
write('apps/web/app/family/page.tsx', '''import { Sidebar } from "@/components/Sidebar";
import { familyFeed } from "@/lib/mock";

export default function FamilyPage() {
  return (
    <div className="shell page-grid">
      <Sidebar
        title="Nido Family"
        subtitle="Portail parents"
        nav={[
          { href: "/family", label: "Accueil", active: true },
          { href: "#", label: "Journal" },
          { href: "#", label: "Messages" },
          { href: "#", label: "Documents" },
          { href: "#", label: "Factures" },
          { href: "#", label: "Réglages" },
        ]}
      />
      <main className="main">
        <section className="hero">
          <div className="topbar">
            <div>
              <div className="badge">Famille</div>
              <h1 style={{ marginBottom: 8 }}>Bonjour Camille, voici la journée de Lina.</h1>
              <div style={{ color: "rgba(255,255,255,0.78)" }}>Visibilité parent claire, rassurante et sans surcharge inutile.</div>
            </div>
            <div className="badge success">Présente depuis 08:11</div>
          </div>
        </section>
        <section className="grid-2">
          <div className="family-feed">
            {familyFeed.map((item) => (
              <article key={item.time} className="feed-item">
                <div className="topbar">
                  <strong>{item.title}</strong>
                  <span className="badge">{item.time}</span>
                </div>
                <p className="muted">{item.body}</p>
              </article>
            ))}
          </div>
          <div className="card">
            <h2>Accès rapides</h2>
            <div className="list">
              <div className="list-item"><span>Facture avril 2026</span><span className="badge">PDF</span></div>
              <div className="list-item"><span>Projet pédagogique</span><span className="badge">Doc</span></div>
              <div className="list-item"><span>Envoyer un message</span><span className="badge success">Ouvert</span></div>
              <div className="list-item"><span>Déclarer une absence</span><span className="badge warning">Action</span></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
''')

# Extra docs
write('SPECIFICATIONS.md', '''# Functional scope included in this starter

## Included UI portals
- Landing site
- Login hub
- Superadmin cockpit
- Structure admin cockpit
- Team app UI
- Family app UI

## Included backend modules
- health
- auth
- platform overview
- admin dashboard
- team day feed
- family home feed

## Included business foundations
- tenant model
- family model
- child model
- pre-enrolment model
- contract model
- invoice model
- staff model

## Missing before true commercial hardening
- real auth / RBAC middleware
- uploads / media pipeline
- payment provider
- e-sign provider
- document generation
- email / push notification provider
- auditing / logs / analytics
- automated tests
''')
