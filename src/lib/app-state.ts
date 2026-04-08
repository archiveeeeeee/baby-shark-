import { AppState } from "@/types";

export const currentUserStorageKey = "babyshark-current-user-id";

export const emptyState: AppState = {
  structure: {
    id: "",
    name: "BabyShark",
    slug: "babyshark",
    timezone: "Europe/Brussels",
    currency: "EUR",
    country: "Belgique",
    tagline: "La suite petite-enfance qui aligne direction, équipe et parents.",
    address: "",
    phone: "",
    email: "",
    websiteTitle: "BabyShark",
    groups: [],
  },
  currentUserId: "",
  users: [],
  parents: [],
  children: [],
  preregistrations: [],
  contracts: [],
  invoices: [],
  transmissions: [],
  requests: [],
  documents: [],
  devices: [],
  teamShifts: [],
  messages: [],
};
