import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedState } from "@/lib/seed";
import { loadState, saveState, uid } from "@/lib/utils-data";
import { AppState, Contract, Device, DocumentRecord, FamilyRequest, Invoice, MessageThread, PreRegistration, Role, Transmission } from "@/types";
import { currentUserStorageKey } from "@/lib/app-state";
import { bootstrapRemoteFromSeed, fetchRemoteState, insertContract, insertDevice, insertDocument, insertFamilyRequest, insertInvoice, insertMessageThread, insertPreRegistration, insertTransmission, insertParent, insertChild, linkChildParent, patchInvoicePayment, patchPreRegistrationStatus } from "@/lib/supabase-data";
import { isSupabaseConfigured } from "@/lib/supabase";

interface ContextValue {
  state: AppState;
  loading: boolean;
  storageMode: "local" | "supabase";
  refresh: () => Promise<void>;
  switchRole: (role: Role) => void;
  addPreRegistration: (payload: Omit<PreRegistration, "id" | "status">) => Promise<void>;
  updatePreRegistrationStatus: (id: string, status: PreRegistration["status"]) => Promise<void>;
  createContract: (payload: Omit<Contract, "id" | "status" | "signatureStatus">) => Promise<void>;
  createInvoice: (payload: Omit<Invoice, "id" | "status" | "paidAmount" | "number">) => Promise<void>;
  registerPayment: (invoiceId: string, amount: number) => Promise<void>;
  addTransmission: (payload: Omit<Transmission, "id" | "createdAt">) => Promise<void>;
  addFamilyRequest: (payload: Omit<FamilyRequest, "id" | "status">) => Promise<void>;
  addDocument: (payload: Omit<DocumentRecord, "id" | "uploadedAt">) => Promise<void>;
  addDevice: (payload: Omit<Device, "id" | "lastSeen">) => Promise<void>;
  addMessageThread: (payload: Omit<MessageThread, "id" | "updatedAt">) => Promise<void>;

  /**
   * Create a new parent. In local mode it updates the in-memory state only. In
   * Supabase mode it writes to the `parents` table, then refreshes state from
   * the backend. The `childIds` array is initialised empty and documents list
   * empty on creation. The payer flag controls whether this parent will be
   * considered as the default payer for contracts and invoices.
   */
  addParent: (payload: { name: string; email: string; phone: string; payer: boolean }) => Promise<void>;

  /**
   * Create a new child and optionally link it to one or more parents. In
   * Supabase mode it writes to the `children` table then creates entries in
   * `child_parents` for each provided parentId. In local mode it updates the
   * in-memory state and augments parent.childIds accordingly. The
   * `authorizedPickup` and `activeContractId` fields are initialised empty.
   */
  addChild: (payload: {
    firstName: string;
    lastName: string;
    birthDate: string;
    groupId: string;
    medicalNotes: string;
    allergies: string[];
    photo?: string;
    parentIds: string[];
  }) => Promise<void>;
}

const AppDataContext = createContext<ContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState() ?? seedState);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      saveState(state);
      return;
    }

    void refresh();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) saveState(state);
  }, [state]);

  async function refresh() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      await bootstrapRemoteFromSeed();
      const remoteState = await fetchRemoteState();
      if (remoteState) {
        setState(remoteState);
        localStorage.setItem(currentUserStorageKey, remoteState.currentUserId);
      }
    } catch (error) {
      console.error("BabyShark Supabase refresh failed", error);
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo<ContextValue>(() => ({
    state,
    loading,
    storageMode: isSupabaseConfigured ? "supabase" : "local",
    refresh,
    switchRole(role) {
      const found = state.users.find((u) => u.role === role);
      if (found) {
        setState((s) => ({ ...s, currentUserId: found.id }));
        localStorage.setItem(currentUserStorageKey, found.id);
      }
    },
    async addPreRegistration(payload) {
      if (!isSupabaseConfigured) {
        setState((s) => ({
          ...s,
          preregistrations: [{ id: uid("pre"), status: "new", ...payload }, ...s.preregistrations],
        }));
        return;
      }
      await insertPreRegistration(state.structure.id, payload);
      await refresh();
    },
    async updatePreRegistrationStatus(id, status) {
      if (!isSupabaseConfigured) {
        setState((s) => ({
          ...s,
          preregistrations: s.preregistrations.map((item) => (item.id === id ? { ...item, status } : item)),
        }));
        return;
      }
      await patchPreRegistrationStatus(id, status);
      await refresh();
    },
    async createContract(payload) {
      if (!isSupabaseConfigured) {
        setState((s) => ({
          ...s,
          contracts: [{ id: uid("ctr"), status: "ready_for_signature", signatureStatus: "pending", ...payload }, ...s.contracts],
        }));
        return;
      }
      await insertContract(state.structure.id, payload);
      await refresh();
    },
    async createInvoice(payload) {
      if (!isSupabaseConfigured) {
        const nextIndex = sNextInvoiceIndex(state.invoices.length + 1);
        setState((s) => ({
          ...s,
          invoices: [{ id: uid("inv"), status: "proforma", paidAmount: 0, number: nextIndex, ...payload }, ...s.invoices],
        }));
        return;
      }
      const nextIndex = sNextInvoiceIndex(state.invoices.length + 1);
      await insertInvoice(state.structure.id, payload, nextIndex);
      await refresh();
    },
    async registerPayment(invoiceId, amount) {
      if (!isSupabaseConfigured) {
        setState((s) => ({
          ...s,
          invoices: s.invoices.map((invoice) => {
            if (invoice.id !== invoiceId) return invoice;
            const paidAmount = Math.min(invoice.amount, invoice.paidAmount + amount);
            return {
              ...invoice,
              paidAmount,
              status: paidAmount >= invoice.amount ? "paid" : "partial",
            };
          }),
        }));
        return;
      }
      const invoice = state.invoices.find((item) => item.id === invoiceId);
      if (!invoice) return;
      await patchInvoicePayment(invoice, amount);
      await refresh();
    },
    async addTransmission(payload) {
      if (!isSupabaseConfigured) {
        setState((s) => ({
          ...s,
          transmissions: [{ id: uid("tr"), createdAt: new Date().toISOString(), ...payload }, ...s.transmissions],
        }));
        return;
      }
      await insertTransmission(state.structure.id, payload);
      await refresh();
    },
    async addFamilyRequest(payload) {
      if (!isSupabaseConfigured) {
        setState((s) => ({
          ...s,
          requests: [{ id: uid("req"), status: "submitted", ...payload }, ...s.requests],
        }));
        return;
      }
      await insertFamilyRequest(state.structure.id, payload);
      await refresh();
    },
    async addDocument(payload) {
      if (!isSupabaseConfigured) {
        setState((s) => ({
          ...s,
          documents: [{ id: uid("doc"), uploadedAt: new Date().toISOString(), ...payload }, ...s.documents],
        }));
        return;
      }
      await insertDocument(state.structure.id, payload);
      await refresh();
    },
    async addDevice(payload) {
      if (!isSupabaseConfigured) {
        setState((s) => ({
          ...s,
          devices: [{ id: uid("dev"), lastSeen: new Date().toISOString(), ...payload }, ...s.devices],
        }));
        return;
      }
      await insertDevice(state.structure.id, payload);
      await refresh();
    },
    async addMessageThread(payload) {
      if (!isSupabaseConfigured) {
        setState((s) => ({
          ...s,
          messages: [{ id: uid("msg"), updatedAt: new Date().toISOString(), ...payload }, ...s.messages],
        }));
        return;
      }
      await insertMessageThread(state.structure.id, payload);
      await refresh();
    },

    /**
     * Add a new parent. Uses Supabase when configured otherwise updates local state.
     */
    async addParent(payload) {
      if (!isSupabaseConfigured) {
        setState((s) => ({
          ...s,
          parents: [
            {
              id: uid("par"),
              name: payload.name,
              email: payload.email,
              phone: payload.phone,
              payer: payload.payer,
              childIds: [],
              documents: [],
            },
            ...s.parents,
          ],
        }));
        return;
      }
      // Supabase mode
      await insertParent(state.structure.id, payload);
      await refresh();
    },

    /**
     * Add a new child and optionally link to parents. Uses Supabase when
     * configured otherwise updates local state.
     */
    async addChild(payload) {
      if (!isSupabaseConfigured) {
        const newChildId = uid("chl");
        setState((s) => {
          // attach child to parents locally
          const updatedParents = s.parents.map((p) =>
            payload.parentIds.includes(p.id)
              ? { ...p, childIds: [...p.childIds, newChildId] }
              : p,
          );
          return {
            ...s,
            parents: updatedParents,
            children: [
              {
                id: newChildId,
                firstName: payload.firstName,
                lastName: payload.lastName,
                birthDate: payload.birthDate,
                groupId: payload.groupId,
                parentIds: payload.parentIds,
                authorizedPickup: [],
                medicalNotes: payload.medicalNotes,
                allergies: payload.allergies,
                photo: payload.photo || "",
                activeContractId: undefined,
              },
              ...s.children,
            ],
          };
        });
        return;
      }
      // Supabase mode: insert child then link parents
      const { parentIds, ...childData } = payload;
      const inserted = await insertChild(state.structure.id, childData);
      for (const parentId of parentIds) {
        await linkChildParent(state.structure.id, inserted.id, parentId);
      }
      await refresh();
    },
  }), [state, loading]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

function sNextInvoiceIndex(index: number) {
  return `BS-2026-${String(index).padStart(4, "0")}`;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used within AppDataProvider");
  return context;
}

export function useCurrentUser() {
  const { state } = useAppData();
  return state.users.find((user) => user.id === state.currentUserId) ?? state.users[0];
}

export function useChildrenWithRelations() {
  const { state } = useAppData();
  return state.children.map((child) => ({
    ...child,
    group: state.structure.groups.find((group) => group.id === child.groupId),
    parents: state.parents.filter((parent) => child.parentIds.includes(parent.id)),
    transmissions: state.transmissions.filter((transmission) => transmission.childId === child.id),
    contract: state.contracts.find((contract) => contract.id === child.activeContractId),
  }));
}
