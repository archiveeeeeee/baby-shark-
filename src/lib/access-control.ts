import { Role, UserAccount } from "@/types";

export type AccessLevel = "none" | "read" | "contribute" | "manage" | "admin";
export type DisplayRole = Role;

export interface RoleDefinition {
  key: DisplayRole;
  label: string;
  shortLabel: string;
  description: string;
  scope: string;
  colorClass: string;
}

export interface PermissionArea {
  key: string;
  label: string;
  description: string;
  levels: Record<DisplayRole, AccessLevel>;
}

export const roleDefinitions: RoleDefinition[] = [
  {
    key: "superadmin",
    label: "Superadmin",
    shortLabel: "Superadmin",
    description: "Pilote la plateforme, les structures, la sécurité et les règles globales.",
    scope: "Vision plateforme + configuration critique",
    colorClass: "bg-coral/15 text-coral-foreground border-coral/20",
  },
  {
    key: "admin",
    label: "Admin structure",
    shortLabel: "Admin",
    description: "Dirige la crèche, arbitre les dossiers et contrôle l'exploitation locale.",
    scope: "Vision complète de la structure",
    colorClass: "bg-primary/10 text-primary border-primary/20",
  },
  {
    key: "manager",
    label: "Manager",
    shortLabel: "Manager",
    description: "Coordonne l'équipe et suit l'opérationnel sans toucher aux réglages sensibles.",
    scope: "Pilotage terrain et validation métier",
    colorClass: "bg-sky/15 text-sky-foreground border-sky/25",
  },
  {
    key: "team",
    label: "Équipe",
    shortLabel: "Équipe",
    description: "Exécute le quotidien terrain, saisit les événements et consulte l'essentiel.",
    scope: "Usage opérationnel ciblé",
    colorClass: "bg-mint/20 text-mint-foreground border-mint/30",
  },
  {
    key: "parent",
    label: "Parent",
    shortLabel: "Parent",
    description: "Accède uniquement à son périmètre famille : infos, documents, messages et signature.",
    scope: "Accès personnel limité",
    colorClass: "bg-sunshine/20 text-sunshine-foreground border-sunshine/30",
  },
];

export const permissionAreas: PermissionArea[] = [
  {
    key: "dashboard",
    label: "Tableau de bord",
    description: "Vue de pilotage, alertes et suivi quotidien.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "manage",
      team: "read",
      parent: "none",
    },
  },
  {
    key: "preregistrations",
    label: "Pré-inscriptions",
    description: "Lecture, qualification et conversion des demandes entrantes.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "manage",
      team: "read",
      parent: "contribute",
    },
  },
  {
    key: "children-families",
    label: "Enfants & familles",
    description: "Fiches enfants, parents, infos de référence et historique utile.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "manage",
      team: "contribute",
      parent: "read",
    },
  },
  {
    key: "contracts",
    label: "Contrats",
    description: "Création, ajustement et suivi contractuel.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "read",
      team: "none",
      parent: "read",
    },
  },
  {
    key: "billing",
    label: "Facturation",
    description: "Factures, paiements, relances et export comptable.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "read",
      team: "none",
      parent: "read",
    },
  },
  {
    key: "children-planning",
    label: "Planning enfants",
    description: "Présences prévues, réservations et capacité.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "manage",
      team: "contribute",
      parent: "contribute",
    },
  },
  {
    key: "team-planning",
    label: "Planning équipe",
    description: "Horaires, affectations et absences staff.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "manage",
      team: "read",
      parent: "none",
    },
  },
  {
    key: "team-rh",
    label: "Équipe & RH",
    description: "Profils collaborateurs, rôles et données RH visibles.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "manage",
      team: "read",
      parent: "none",
    },
  },
  {
    key: "statistics",
    label: "Statistiques",
    description: "KPI structure, tendances et suivi d'activité.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "manage",
      team: "read",
      parent: "none",
    },
  },
  {
    key: "messaging",
    label: "Messagerie",
    description: "Échanges internes et familles selon le contexte.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "manage",
      team: "contribute",
      parent: "contribute",
    },
  },
  {
    key: "documents",
    label: "Documents",
    description: "Dépôt, lecture et partage documentaire.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "manage",
      team: "read",
      parent: "read",
    },
  },
  {
    key: "settings",
    label: "Paramétrage",
    description: "Réglages structure, options métier et configuration sensible.",
    levels: {
      superadmin: "admin",
      admin: "manage",
      manager: "none",
      team: "none",
      parent: "none",
    },
  },
  {
    key: "devices",
    label: "Appareils",
    description: "Tablettes, codes appareil et modules visibles.",
    levels: {
      superadmin: "admin",
      admin: "manage",
      manager: "read",
      team: "none",
      parent: "none",
    },
  },
  {
    key: "access-rights",
    label: "Droits d'accès",
    description: "Matrice RBAC, lecture des rôles et futur branchement sécurité.",
    levels: {
      superadmin: "admin",
      admin: "read",
      manager: "none",
      team: "none",
      parent: "none",
    },
  },
  {
    key: "signature",
    label: "Signature",
    description: "Signature parent et suivi du cycle documentaire.",
    levels: {
      superadmin: "admin",
      admin: "admin",
      manager: "read",
      team: "none",
      parent: "contribute",
    },
  },
  {
    key: "exports",
    label: "Exports",
    description: "Exports opérationnels, financiers et pièces consolidées.",
    levels: {
      superadmin: "admin",
      admin: "manage",
      manager: "read",
      team: "none",
      parent: "none",
    },
  },
  {
    key: "site-vitrine",
    label: "Site vitrine",
    description: "Contenu public, pages d'acquisition et formulaires exposés.",
    levels: {
      superadmin: "admin",
      admin: "manage",
      manager: "read",
      team: "none",
      parent: "contribute",
    },
  },
];

export const accessLevelMeta: Record<AccessLevel, { label: string; className: string }> = {
  none: {
    label: "Aucun",
    className: "border-border bg-muted/60 text-muted-foreground",
  },
  read: {
    label: "Lecture",
    className: "border-sky/30 bg-sky/10 text-sky-foreground",
  },
  contribute: {
    label: "Contribution",
    className: "border-sunshine/30 bg-sunshine/15 text-sunshine-foreground",
  },
  manage: {
    label: "Gestion",
    className: "border-mint/30 bg-mint/15 text-mint-foreground",
  },
  admin: {
    label: "Administration",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
};

export function getEffectiveRole(user: UserAccount): DisplayRole {
  const title = user.title?.toLowerCase() ?? "";
  if (user.role === "superadmin" || title.includes("superadmin")) return "superadmin";
  return user.role;
}

export function getUsersByDisplayRole(users: UserAccount[]) {
  return roleDefinitions.map((role) => ({
    ...role,
    users: users.filter((user) => getEffectiveRole(user) === role.key),
  }));
}
