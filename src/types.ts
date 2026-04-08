export type VisibilityLevel = "parent" | "internal" | "management" | "medical";
export type PresenceStatus = "present" | "expected" | "absent_planned" | "absent_unplanned" | "late" | "departed";
export type Role = "superadmin" | "admin" | "manager" | "team" | "parent";

export interface Structure {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  country: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  websiteTitle: string;
  groups: Group[];
}

export interface Group {
  id: string;
  name: string;
  colorClass: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  structureId: string;
  visibleInTeamApp?: boolean;
  title?: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  childIds: string[];
  payer: boolean;
  documents: DocumentRecord[];
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  groupId: string;
  parentIds: string[];
  authorizedPickup: string[];
  medicalNotes: string;
  allergies: string[];
  photo: string;
  activeContractId?: string;
}

export interface PreRegistration {
  id: string;
  childName: string;
  parentName: string;
  email: string;
  phone: string;
  requestedStartDate: string;
  requestedRhythm: string;
  source: "website" | "backoffice";
  status: "new" | "qualified" | "accepted" | "rejected";
  notes: string;
  tags: string[];
}

export interface Contract {
  id: string;
  childId: string;
  payerParentId: string;
  startDate: string;
  endDate?: string;
  scheduleLabel: string;
  status: "draft" | "ready_for_signature" | "active" | "ended";
  pricingLabel: string;
  signatureStatus: "not_started" | "pending" | "signed";
}

export interface Invoice {
  id: string;
  parentId: string;
  contractId?: string;
  label: string;
  month: string;
  amount: number;
  status: "proforma" | "final" | "paid" | "partial" | "overdue";
  paidAmount: number;
  number?: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  category: "contract" | "medical" | "parent" | "internal" | "invoice";
  linkedTo: { type: "child" | "parent" | "contract" | "structure"; id: string };
  uploadedAt: string;
}

export interface Transmission {
  id: string;
  childId: string;
  createdAt: string;
  category: "presence" | "meal" | "nap" | "change" | "health" | "activity" | "photo" | "note";
  title: string;
  details: string;
  visibility: VisibilityLevel;
  authorId: string;
}

export interface FamilyRequest {
  id: string;
  parentId: string;
  childId: string;
  type: "absence" | "delay" | "reservation" | "document";
  date: string;
  details: string;
  status: "submitted" | "approved" | "rejected";
}

export interface Device {
  id: string;
  label: string;
  type: "reception" | "section" | "mobile";
  code: string;
  visibleModules: string[];
  lastSeen: string;
}

export interface TeamShift {
  id: string;
  userId: string;
  day: string;
  start: string;
  end: string;
  status: "planned" | "present" | "absence";
}

export interface MessageThread {
  id: string;
  title: string;
  audience: "internal" | "parent";
  participantIds: string[];
  lastMessage: string;
  updatedAt: string;
}

export interface AppState {
  structure: Structure;
  currentUserId: string;
  users: UserAccount[];
  parents: Parent[];
  children: Child[];
  preregistrations: PreRegistration[];
  contracts: Contract[];
  invoices: Invoice[];
  transmissions: Transmission[];
  requests: FamilyRequest[];
  documents: DocumentRecord[];
  devices: Device[];
  teamShifts: TeamShift[];
  messages: MessageThread[];
}
