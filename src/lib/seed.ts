import childLucas from "@/assets/child-lucas.jpg";
import childEmma from "@/assets/child-emma.jpg";
import childLea from "@/assets/child-lea.jpg";
import childHugo from "@/assets/child-hugo.jpg";
import childChloe from "@/assets/child-chloe.jpg";
import childNathan from "@/assets/child-nathan.jpg";
import { AppState } from "@/types";

export const seedState: AppState = {
  structure: {
    id: "str_demo",
    name: "BabyShark Demo Bruxelles",
    slug: "babyshark-demo-bruxelles",
    timezone: "Europe/Brussels",
    currency: "EUR",
    country: "Belgique",
    tagline: "La suite petite-enfance qui aligne direction, équipe et parents.",
    address: "Rue de l'Enfance 14, 1000 Bruxelles",
    phone: "+32 2 555 12 34",
    email: "contact@babyshark.be",
    websiteTitle: "BabyShark — Structure petite-enfance connectée",
    groups: [
      { id: "grp_bebes", name: "Bébés", colorClass: "bg-peach/20 text-peach-foreground" },
      { id: "grp_moyens", name: "Moyens", colorClass: "bg-lavender/20 text-lavender-foreground" },
      { id: "grp_grands", name: "Grands", colorClass: "bg-sky/20 text-sky-foreground" },
    ],
  },
  currentUserId: "usr_admin",
  users: [
    { id: "usr_super", name: "Amina Soler", email: "superadmin@babyshark.be", role: "admin", structureId: "str_demo", title: "Superadmin" },
    { id: "usr_admin", name: "Marie Laurent", email: "marie@babyshark.be", role: "admin", structureId: "str_demo", title: "Directrice" },
    { id: "usr_mgr", name: "Julie Robert", email: "julie@babyshark.be", role: "manager", structureId: "str_demo", title: "Responsable de section", visibleInTeamApp: true },
    { id: "usr_team_1", name: "Sofia Bernard", email: "sofia@babyshark.be", role: "team", structureId: "str_demo", title: "Puéricultrice", visibleInTeamApp: true },
    { id: "usr_team_2", name: "Claire Martin", email: "claire@babyshark.be", role: "team", structureId: "str_demo", title: "Puéricultrice", visibleInTeamApp: true },
    { id: "usr_parent_1", name: "Thomas Martin", email: "thomas.martin@mail.com", role: "parent", structureId: "str_demo", title: "Parent" },
    { id: "usr_parent_2", name: "Sarah Dubois", email: "sarah.dubois@mail.com", role: "parent", structureId: "str_demo", title: "Parent" },
  ],
  parents: [
    { id: "par_1", name: "Thomas Martin", email: "thomas.martin@mail.com", phone: "+32 470 11 22 33", childIds: ["ch_1"], payer: true, documents: [] },
    { id: "par_2", name: "Sarah Dubois", email: "sarah.dubois@mail.com", phone: "+32 470 44 55 66", childIds: ["ch_2"], payer: true, documents: [] },
    { id: "par_3", name: "Julie Bernard", email: "julie.bernard@mail.com", phone: "+32 470 77 88 99", childIds: ["ch_3", "ch_4"], payer: true, documents: [] },
  ],
  children: [
    { id: "ch_1", firstName: "Lucas", lastName: "Martin", birthDate: "2022-06-18", groupId: "grp_grands", parentIds: ["par_1"], authorizedPickup: ["Thomas Martin", "Camille Martin"], medicalNotes: "Aucune note particulière.", allergies: ["Kiwi"], photo: childLucas, activeContractId: "ctr_1" },
    { id: "ch_2", firstName: "Emma", lastName: "Dubois", birthDate: "2023-01-10", groupId: "grp_moyens", parentIds: ["par_2"], authorizedPickup: ["Sarah Dubois"], medicalNotes: "Sommeil sensible en début d'après-midi.", allergies: [], photo: childEmma, activeContractId: "ctr_2" },
    { id: "ch_3", firstName: "Léa", lastName: "Bernard", birthDate: "2024-02-03", groupId: "grp_bebes", parentIds: ["par_3"], authorizedPickup: ["Julie Bernard", "Marc Bernard"], medicalNotes: "Crème à appliquer si irritation.", allergies: ["Lactose"], photo: childLea },
    { id: "ch_4", firstName: "Hugo", lastName: "Moreau", birthDate: "2022-12-12", groupId: "grp_grands", parentIds: ["par_3"], authorizedPickup: ["Julie Bernard"], medicalNotes: "Ras.", allergies: [], photo: childHugo },
    { id: "ch_5", firstName: "Chloé", lastName: "Petit", birthDate: "2023-08-09", groupId: "grp_moyens", parentIds: ["par_2"], authorizedPickup: ["Sarah Dubois"], medicalNotes: "Ras.", allergies: [], photo: childChloe },
    { id: "ch_6", firstName: "Nathan", lastName: "Leroy", birthDate: "2024-04-14", groupId: "grp_bebes", parentIds: ["par_1"], authorizedPickup: ["Thomas Martin"], medicalNotes: "Ras.", allergies: [], photo: childNathan },
  ],
  preregistrations: [
    { id: "pre_1", childName: "Noah Leroy", parentName: "Camille Leroy", email: "camille.leroy@mail.com", phone: "+32 470 66 22 11", requestedStartDate: "2026-09-01", requestedRhythm: "Temps plein", source: "website", status: "new", notes: "Visite souhaitée le mercredi", tags: ["site", "chaud"] },
    { id: "pre_2", childName: "Inès Simon", parentName: "Nadia Simon", email: "nadia.simon@mail.com", phone: "+32 470 88 11 44", requestedStartDate: "2026-08-15", requestedRhythm: "3 jours/semaine", source: "backoffice", status: "qualified", notes: "Dossier complet", tags: ["relocalisation"] },
  ],
  contracts: [
    { id: "ctr_1", childId: "ch_1", payerParentId: "par_1", startDate: "2025-09-01", scheduleLabel: "Temps plein", status: "active", pricingLabel: "820 €/mois", signatureStatus: "signed" },
    { id: "ctr_2", childId: "ch_2", payerParentId: "par_2", startDate: "2025-10-01", scheduleLabel: "4 jours/semaine", status: "ready_for_signature", pricingLabel: "690 €/mois", signatureStatus: "pending" },
  ],
  invoices: [
    { id: "inv_1", parentId: "par_1", contractId: "ctr_1", label: "Crèche avril 2026", month: "2026-04", amount: 820, status: "final", paidAmount: 0, number: "BS-2026-0001" },
    { id: "inv_2", parentId: "par_2", contractId: "ctr_2", label: "Crèche avril 2026", month: "2026-04", amount: 690, status: "paid", paidAmount: 690, number: "BS-2026-0002" },
  ],
  transmissions: [
    { id: "tr_1", childId: "ch_1", createdAt: new Date().toISOString(), category: "presence", title: "Arrivée enregistrée", details: "Présent à 08:15, signature non requise.", visibility: "parent", authorId: "usr_team_1" },
    { id: "tr_2", childId: "ch_1", createdAt: new Date().toISOString(), category: "meal", title: "Déjeuner", details: "A bien mangé.", visibility: "parent", authorId: "usr_team_1" },
    { id: "tr_3", childId: "ch_2", createdAt: new Date().toISOString(), category: "nap", title: "Sieste", details: "Bonne sieste de 12:45 à 14:10.", visibility: "parent", authorId: "usr_team_2" },
    { id: "tr_4", childId: "ch_3", createdAt: new Date().toISOString(), category: "health", title: "Observation santé", details: "Crème appliquée après change.", visibility: "medical", authorId: "usr_team_2" },
  ],
  requests: [
    { id: "req_1", parentId: "par_1", childId: "ch_1", type: "delay", date: new Date().toISOString().slice(0, 10), details: "Retard exceptionnel de 15 minutes demain.", status: "submitted" },
  ],
  documents: [
    { id: "doc_1", title: "Règlement d'ordre intérieur", category: "internal", linkedTo: { type: "structure", id: "str_demo" }, uploadedAt: new Date().toISOString() },
    { id: "doc_2", title: "Contrat Lucas Martin", category: "contract", linkedTo: { type: "contract", id: "ctr_1" }, uploadedAt: new Date().toISOString() },
  ],
  devices: [
    { id: "dev_1", label: "Tablette Accueil", type: "reception", code: "483920", visibleModules: ["pointage", "departs"], lastSeen: new Date().toISOString() },
    { id: "dev_2", label: "Tablette Section Moyens", type: "section", code: "294118", visibleModules: ["pointage", "transmissions", "photos", "sante"], lastSeen: new Date().toISOString() },
  ],
  teamShifts: [
    { id: "shift_1", userId: "usr_team_1", day: "Lundi", start: "07:30", end: "15:30", status: "present" },
    { id: "shift_2", userId: "usr_team_2", day: "Lundi", start: "09:00", end: "17:00", status: "planned" },
    { id: "shift_3", userId: "usr_mgr", day: "Lundi", start: "08:00", end: "16:00", status: "present" },
  ],
  messages: [
    { id: "msg_1", title: "Absence Hugo", audience: "parent", participantIds: ["par_3"], lastMessage: "Merci, absence bien notée pour aujourd'hui.", updatedAt: new Date().toISOString() },
    { id: "msg_2", title: "Réunion d'équipe", audience: "internal", participantIds: ["usr_team_1", "usr_team_2", "usr_mgr"], lastMessage: "Pensez au briefing de 16h30.", updatedAt: new Date().toISOString() },
  ],
};
