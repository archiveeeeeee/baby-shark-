import childLucas from "@/assets/child-lucas.jpg";
import childEmma from "@/assets/child-emma.jpg";
import childLea from "@/assets/child-lea.jpg";
import childHugo from "@/assets/child-hugo.jpg";
import childChloe from "@/assets/child-chloe.jpg";
import childNathan from "@/assets/child-nathan.jpg";
import { emptyState, currentUserStorageKey } from "@/lib/app-state";
import { seedState } from "@/lib/seed";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  AppState,
  Child,
  Contract,
  Device,
  DocumentRecord,
  FamilyRequest,
  Group,
  Invoice,
  MessageThread,
  Parent,
  PreRegistration,
  Structure,
  TeamShift,
  Transmission,
  UserAccount,
} from "@/types";

const childPhotoMap: Record<string, string> = {
  Lucas: childLucas,
  Emma: childEmma,
  Léa: childLea,
  Hugo: childHugo,
  Chloé: childChloe,
  Nathan: childNathan,
};

export async function fetchRemoteState(): Promise<AppState | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const [
    structuresRes,
    groupsRes,
    usersRes,
    parentsRes,
    childrenRes,
    childParentsRes,
    pickupsRes,
    preregistrationsRes,
    contractsRes,
    invoicesRes,
    transmissionsRes,
    requestsRes,
    documentsRes,
    devicesRes,
    shiftsRes,
    messagesRes,
  ] = await Promise.all([
    supabase.from("structures").select("*").limit(1),
    supabase.from("groups").select("*").order("sort_order"),
    supabase.from("user_profiles").select("*"),
    supabase.from("parents").select("*"),
    supabase.from("children").select("*"),
    supabase.from("child_parents").select("*"),
    supabase.from("authorized_pickups").select("*"),
    supabase.from("preregistrations").select("*").order("created_at", { ascending: false }),
    supabase.from("contracts").select("*").order("created_at", { ascending: false }),
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    supabase.from("transmissions").select("*").order("created_at", { ascending: false }),
    supabase.from("family_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("documents").select("*").order("created_at", { ascending: false }),
    supabase.from("devices").select("*").order("created_at", { ascending: false }),
    supabase.from("team_shifts").select("*").order("created_at", { ascending: false }),
    supabase.from("message_threads").select("*").order("updated_at", { ascending: false }),
  ]);

  const structures = ensureData(structuresRes.data);
  if (!structures.length) return null;

  const structureRow = structures[0];
  const documents = ensureData(documentsRes.data);
  const childParents = ensureData(childParentsRes.data);
  const pickups = ensureData(pickupsRes.data);

  const groups: Group[] = ensureData(groupsRes.data).map((row: any) => ({
    id: row.id,
    name: row.name,
    colorClass: row.color_class || colorClassFromGroupName(row.name),
  }));

  const structure: Structure = {
    id: structureRow.id,
    name: structureRow.name,
    slug: structureRow.slug,
    timezone: structureRow.timezone,
    currency: structureRow.currency,
    country: structureRow.country,
    tagline: structureRow.tagline || emptyState.structure.tagline,
    address: structureRow.address || "",
    phone: structureRow.phone || "",
    email: structureRow.email || "",
    websiteTitle: structureRow.website_title || structureRow.name,
    groups,
  };

  const users: UserAccount[] = ensureData(usersRes.data).map((row: any) => ({
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    structureId: row.structure_id,
    visibleInTeamApp: row.visible_in_team_app,
    title: row.title || undefined,
  }));

  const parents: Parent[] = ensureData(parentsRes.data).map((row: any) => ({
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim(),
    email: row.email,
    phone: row.phone || "",
    payer: Boolean(row.payer_user_id),
    childIds: childParents
      .filter((link: any) => link.parent_id === row.id)
      .map((link: any) => link.child_id),
    documents: documents
      .filter((doc: any) => doc.linked_type === "parent" && doc.linked_id === row.id)
      .map((doc: any) => mapDocument(doc)),
  }));

  const contracts: Contract[] = ensureData(contractsRes.data).map((row: any) => ({
    id: row.id,
    childId: row.child_id,
    payerParentId: row.payer_parent_id,
    startDate: row.start_date,
    endDate: row.end_date || undefined,
    scheduleLabel: row.schedule_label || "",
    pricingLabel: row.pricing_label || "",
    status: row.status,
    signatureStatus: row.signature_status,
  }));

  const children: Child[] = ensureData(childrenRes.data).map((row: any) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date || "",
    groupId: row.group_id || "",
    parentIds: childParents
      .filter((link: any) => link.child_id === row.id)
      .map((link: any) => link.parent_id),
    authorizedPickup: pickups
      .filter((pickup: any) => pickup.child_id === row.id)
      .map((pickup: any) => pickup.full_name),
    medicalNotes: row.health_notes || "",
    allergies: row.allergies || [],
    photo: row.photo_url || childPhotoMap[row.first_name] || childLucas,
    activeContractId: contracts.find(
      (contract) => contract.childId === row.id && contract.status !== "ended",
    )?.id,
  }));

  const invoices: Invoice[] = ensureData(invoicesRes.data).map((row: any) => ({
    id: row.id,
    parentId: row.parent_id,
    contractId: row.contract_id || undefined,
    label: row.label,
    month: row.month || "",
    amount: Number(row.amount || 0),
    paidAmount: Number(row.paid_amount || 0),
    number: row.number || undefined,
    status: row.status,
  }));

  const transmissions: Transmission[] = ensureData(transmissionsRes.data).map((row: any) => ({
    id: row.id,
    childId: row.child_id,
    createdAt: row.created_at,
    category: row.category,
    title: row.title,
    details: row.details || "",
    visibility: row.visibility,
    authorId: row.author_id || "",
  }));

  const requests: FamilyRequest[] = ensureData(requestsRes.data).map((row: any) => ({
    id: row.id,
    parentId: row.parent_id,
    childId: row.child_id,
    type: row.type,
    date: row.request_date || row.created_at?.slice(0, 10) || "",
    details: row.details || "",
    status: row.status,
  }));

  const appDocuments: DocumentRecord[] = documents.map((row: any) => mapDocument(row));

  const devices: Device[] = ensureData(devicesRes.data).map((row: any) => ({
    id: row.id,
    label: row.label,
    type: row.type,
    code: row.enrollment_code,
    visibleModules: row.visible_modules || [],
    lastSeen: row.last_seen || row.created_at,
  }));

  const teamShifts: TeamShift[] = ensureData(shiftsRes.data).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    day: row.day_label,
    start: row.start_time || "",
    end: row.end_time || "",
    status: row.status,
  }));

  const messages: MessageThread[] = ensureData(messagesRes.data).map((row: any) => ({
    id: row.id,
    title: row.title,
    audience: row.audience,
    participantIds: [],
    lastMessage: row.last_message || "",
    updatedAt: row.updated_at,
  }));

  const savedCurrentUserId = localStorage.getItem(currentUserStorageKey);
  const currentUserId = users.some((user) => user.id === savedCurrentUserId)
    ? savedCurrentUserId!
    : users.find((user) => user.role === "admin")?.id || users[0]?.id || "";

  return {
    structure,
    currentUserId,
    users,
    parents,
    children,
    preregistrations: ensureData(preregistrationsRes.data).map((row: any) => ({
      id: row.id,
      childName: row.child_name,
      parentName: row.parent_name,
      email: row.email,
      phone: row.phone || "",
      requestedStartDate: row.requested_start_date || "",
      requestedRhythm: row.requested_rhythm || "",
      source: row.source,
      status: row.status,
      notes: row.notes || "",
      tags: row.tags || [],
    })),
    contracts,
    invoices,
    transmissions,
    requests,
    documents: appDocuments,
    devices,
    teamShifts,
    messages,
  };
}

export async function bootstrapRemoteFromSeed() {
  if (!isSupabaseConfigured || !supabase) return;

  const structureCheck = await supabase.from("structures").select("id").limit(1);
  if ((structureCheck.data || []).length > 0) return;

  const { data: structureRow, error: structureError } = await supabase
    .from("structures")
    .insert({
      name: seedState.structure.name,
      slug: seedState.structure.slug,
      timezone: seedState.structure.timezone,
      currency: seedState.structure.currency,
      country: seedState.structure.country,
      tagline: seedState.structure.tagline,
      address: seedState.structure.address,
      phone: seedState.structure.phone,
      email: seedState.structure.email,
      website_title: seedState.structure.websiteTitle,
    })
    .select()
    .single();

  if (structureError) throw structureError;
  const structureId = structureRow.id as string;

  const groupMap = new Map<string, string>();
  for (const [index, group] of seedState.structure.groups.entries()) {
    const { data, error } = await supabase
      .from("groups")
      .insert({
        structure_id: structureId,
        name: group.name,
        color_class: group.colorClass,
        sort_order: index,
      })
      .select()
      .single();

    if (error) throw error;
    groupMap.set(group.id, data.id);
  }

  const userMap = new Map<string, string>();
  for (const user of seedState.users) {
    const id = crypto.randomUUID();
    const { error } = await supabase.from("user_profiles").insert({
      id,
      structure_id: structureId,
      role: user.role,
      full_name: user.name,
      email: user.email,
      title: user.title || null,
      visible_in_team_app: user.visibleInTeamApp || false,
    });

    if (error) throw error;
    userMap.set(user.id, id);
  }

  const tenantId = await getTenantId();

  const parentMap = new Map<string, string>();
  for (const parent of seedState.parents) {
    const parts = parent.name.trim().split(/\s+/);
    const firstName = parts.shift() || "";
    const lastName = parts.join(" ");

    const { data, error } = await supabase
      .from("parents")
      .insert({
        tenant_id: tenantId,
        payer_user_id: null,
        first_name: firstName,
        last_name: lastName,
        email: parent.email,
        phone: parent.phone,
        portal_status: parent.payer ? "payer" : "invited",
        address: {},
        metadata: {},
      })
      .select()
      .single();

    if (error) throw error;
    parentMap.set(parent.id, data.id);
  }

  const childMap = new Map<string, string>();
  for (const child of seedState.children) {
    const { data, error } = await supabase
      .from("children")
      .insert({
        structure_id: structureId,
        tenant_id: tenantId,
        group_id: groupMap.get(child.groupId) || null,
        first_name: child.firstName,
        last_name: child.lastName,
        birth_date: child.birthDate || null,
        health_notes: child.medicalNotes,
        allergies: child.allergies,
        doctor_name: null,
        doctor_phone: null,
        photo_url: child.photo,
        metadata: {},
      })
      .select()
      .single();

    if (error) throw error;
    childMap.set(child.id, data.id);

    for (const parentId of child.parentIds) {
      const mappedParent = parentMap.get(parentId);
      if (mappedParent) {
        const { error: relationError } = await supabase.from("child_parents").insert({
          child_id: data.id,
          parent_id: mappedParent,
          tenant_id: tenantId,
        });
        if (relationError) throw relationError;
      }
    }

    for (const fullName of child.authorizedPickup) {
      const { error: pickupError } = await supabase
        .from("authorized_pickups")
        .insert({ child_id: data.id, full_name: fullName });
      if (pickupError) throw pickupError;
    }
  }

  const contractMap = new Map<string, string>();
  for (const contract of seedState.contracts) {
    const { data, error } = await supabase
      .from("contracts")
      .insert({
        structure_id: structureId,
        child_id: childMap.get(contract.childId),
        payer_parent_id: parentMap.get(contract.payerParentId),
        start_date: contract.startDate,
        end_date: contract.endDate || null,
        schedule_label: contract.scheduleLabel,
        pricing_label: contract.pricingLabel,
        status: contract.status,
        signature_status: contract.signatureStatus,
      })
      .select()
      .single();

    if (error) throw error;
    contractMap.set(contract.id, data.id);
  }

  for (const preregistration of seedState.preregistrations) {
    const { error } = await supabase.from("preregistrations").insert({
      structure_id: structureId,
      child_name: preregistration.childName,
      parent_name: preregistration.parentName,
      email: preregistration.email,
      phone: preregistration.phone,
      requested_start_date: preregistration.requestedStartDate || null,
      requested_rhythm: preregistration.requestedRhythm,
      source: preregistration.source,
      status: preregistration.status,
      notes: preregistration.notes,
      tags: preregistration.tags,
    });
    if (error) throw error;
  }

  for (const invoice of seedState.invoices) {
    const { error } = await supabase.from("invoices").insert({
      structure_id: structureId,
      parent_id: parentMap.get(invoice.parentId),
      contract_id: invoice.contractId ? contractMap.get(invoice.contractId) : null,
      label: invoice.label,
      month: invoice.month,
      amount: invoice.amount,
      paid_amount: invoice.paidAmount,
      number: invoice.number,
      status: invoice.status,
    });
    if (error) throw error;
  }

  for (const transmission of seedState.transmissions) {
    const { error } = await supabase.from("transmissions").insert({
      structure_id: structureId,
      child_id: childMap.get(transmission.childId),
      author_id: userMap.get(transmission.authorId) || null,
      category: transmission.category,
      title: transmission.title,
      details: transmission.details,
      visibility: transmission.visibility,
      created_at: transmission.createdAt,
    });
    if (error) throw error;
  }

  for (const request of seedState.requests) {
    const { error } = await supabase.from("family_requests").insert({
      structure_id: structureId,
      parent_id: parentMap.get(request.parentId),
      child_id: childMap.get(request.childId),
      type: request.type,
      request_date: request.date,
      details: request.details,
      status: request.status,
    });
    if (error) throw error;
  }

  for (const document of seedState.documents) {
    const linkedId =
      document.linkedTo.type === "parent"
        ? parentMap.get(document.linkedTo.id)
        : document.linkedTo.type === "child"
          ? childMap.get(document.linkedTo.id)
          : document.linkedTo.type === "contract"
            ? contractMap.get(document.linkedTo.id)
            : structureId;

    const { error } = await supabase.from("documents").insert({
      structure_id: structureId,
      title: document.title,
      category: document.category,
      linked_type: document.linkedTo.type,
      linked_id: linkedId,
      created_at: document.uploadedAt,
    });
    if (error) throw error;
  }

  for (const device of seedState.devices) {
    const { error } = await supabase.from("devices").insert({
      structure_id: structureId,
      label: device.label,
      type: device.type,
      enrollment_code: device.code,
      visible_modules: device.visibleModules,
      last_seen: device.lastSeen,
    });
    if (error) throw error;
  }

  for (const shift of seedState.teamShifts) {
    const { error } = await supabase.from("team_shifts").insert({
      structure_id: structureId,
      user_id: userMap.get(shift.userId),
      day_label: shift.day,
      start_time: shift.start,
      end_time: shift.end,
      status: shift.status,
    });
    if (error) throw error;
  }

  for (const message of seedState.messages) {
    const { error } = await supabase.from("message_threads").insert({
      structure_id: structureId,
      title: message.title,
      audience: message.audience,
      last_message: message.lastMessage,
      updated_at: message.updatedAt,
    });
    if (error) throw error;
  }
}

export async function insertPreRegistration(
  structureId: string,
  payload: Omit<PreRegistration, "id" | "status">,
) {
  if (!supabase) return;
  const { error } = await supabase.from("preregistrations").insert({
    structure_id: structureId,
    child_name: payload.childName,
    parent_name: payload.parentName,
    email: payload.email,
    phone: payload.phone,
    requested_start_date: payload.requestedStartDate || null,
    requested_rhythm: payload.requestedRhythm,
    source: payload.source,
    status: "new",
    notes: payload.notes,
    tags: payload.tags,
  });
  if (error) throw error;
}

export async function patchPreRegistrationStatus(id: string, status: PreRegistration["status"]) {
  if (!supabase) return;
  const { error } = await supabase.from("preregistrations").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function insertContract(
  structureId: string,
  payload: Omit<Contract, "id" | "status" | "signatureStatus">,
) {
  if (!supabase) return;
  const { error } = await supabase.from("contracts").insert({
    structure_id: structureId,
    child_id: payload.childId,
    payer_parent_id: payload.payerParentId,
    start_date: payload.startDate,
    end_date: payload.endDate || null,
    schedule_label: payload.scheduleLabel,
    pricing_label: payload.pricingLabel,
    status: "ready_for_signature",
    signature_status: "pending",
  });
  if (error) throw error;
}

export async function insertInvoice(
  structureId: string,
  payload: Omit<Invoice, "id" | "status" | "paidAmount" | "number">,
  nextNumber: string,
) {
  if (!supabase) return;
  const { error } = await supabase.from("invoices").insert({
    structure_id: structureId,
    parent_id: payload.parentId,
    contract_id: payload.contractId || null,
    label: payload.label,
    month: payload.month,
    amount: payload.amount,
    paid_amount: 0,
    number: nextNumber,
    status: "proforma",
  });
  if (error) throw error;
}

export async function patchInvoicePayment(invoice: Invoice, delta: number) {
  if (!supabase) return;
  const paidAmount = Math.min(invoice.amount, invoice.paidAmount + delta);
  const status = paidAmount >= invoice.amount ? "paid" : "partial";
  const { error } = await supabase
    .from("invoices")
    .update({ paid_amount: paidAmount, status })
    .eq("id", invoice.id);
  if (error) throw error;
}

export async function insertTransmission(
  structureId: string,
  payload: Omit<Transmission, "id" | "createdAt">,
) {
  if (!supabase) return;
  const { error } = await supabase.from("transmissions").insert({
    structure_id: structureId,
    child_id: payload.childId,
    author_id: payload.authorId,
    category: payload.category,
    title: payload.title,
    details: payload.details,
    visibility: payload.visibility,
  });
  if (error) throw error;
}

export async function insertFamilyRequest(
  structureId: string,
  payload: Omit<FamilyRequest, "id" | "status">,
) {
  if (!supabase) return;
  const { error } = await supabase.from("family_requests").insert({
    structure_id: structureId,
    parent_id: payload.parentId,
    child_id: payload.childId,
    type: payload.type,
    request_date: payload.date,
    details: payload.details,
    status: "submitted",
  });
  if (error) throw error;
}

export async function insertDocument(
  structureId: string,
  payload: Omit<DocumentRecord, "id" | "uploadedAt">,
) {
  if (!supabase) return;
  const { error } = await supabase.from("documents").insert({
    structure_id: structureId,
    title: payload.title,
    category: payload.category,
    linked_type: payload.linkedTo.type,
    linked_id: payload.linkedTo.id,
  });
  if (error) throw error;
}

export async function insertDevice(
  structureId: string,
  payload: Omit<Device, "id" | "lastSeen">,
) {
  if (!supabase) return;
  const { error } = await supabase.from("devices").insert({
    structure_id: structureId,
    label: payload.label,
    type: payload.type,
    enrollment_code: payload.code,
    visible_modules: payload.visibleModules,
    last_seen: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function insertMessageThread(
  structureId: string,
  payload: Omit<MessageThread, "id" | "updatedAt">,
) {
  if (!supabase) return;
  const { error } = await supabase.from("message_threads").insert({
    structure_id: structureId,
    title: payload.title,
    audience: payload.audience,
    last_message: payload.lastMessage,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

function ensureData<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

function mapDocument(doc: any): DocumentRecord {
  return {
    id: doc.id,
    title: doc.title,
    category: doc.category,
    linkedTo: { type: doc.linked_type, id: doc.linked_id },
    uploadedAt: doc.created_at,
  };
}

function colorClassFromGroupName(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("béb")) return "bg-peach/20 text-peach-foreground";
  if (normalized.includes("moy")) return "bg-lavender/20 text-lavender-foreground";
  return "bg-sky/20 text-sky-foreground";
}

let cachedTenantId: string | null = null;

async function getTenantId() {
  if (!supabase) return null;
  if (cachedTenantId) return cachedTenantId;

  const { data, error } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
  if (error) throw error;

  cachedTenantId = data?.id ?? null;
  return cachedTenantId;
}

export async function insertParent(
  structureId: string,
  payload: { name: string; email: string; phone: string; payer: boolean },
): Promise<any> {
  if (!supabase) return null;

  const tenantId = await getTenantId();
  const parts = payload.name.trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");

  const { data, error } = await supabase
    .from("parents")
    .insert({
      tenant_id: tenantId,
      payer_user_id: null,
      first_name: firstName,
      last_name: lastName,
      email: payload.email,
      phone: payload.phone,
      portal_status: payload.payer ? "payer" : "invited",
      address: {},
      metadata: {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertChild(
  structureId: string,
  payload: {
    firstName: string;
    lastName: string;
    birthDate: string;
    groupId: string;
    medicalNotes: string;
    allergies: string[];
    photo?: string;
  },
): Promise<any> {
  if (!supabase) return null;

  const tenantId = await getTenantId();
  const { data, error } = await supabase
    .from("children")
    .insert({
      structure_id: structureId,
      tenant_id: tenantId,
      group_id: payload.groupId || null,
      first_name: payload.firstName,
      last_name: payload.lastName,
      birth_date: payload.birthDate || null,
      health_notes: payload.medicalNotes,
      allergies: payload.allergies,
      doctor_name: null,
      doctor_phone: null,
      photo_url: payload.photo || null,
      metadata: {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function linkChildParent(
  structureId: string,
  childId: string,
  parentId: string,
): Promise<void> {
  if (!supabase) return;

  const tenantId = await getTenantId();
  const { error } = await supabase.from("child_parents").insert({
    child_id: childId,
    parent_id: parentId,
    tenant_id: tenantId,
  });

  if (error) throw error;
}