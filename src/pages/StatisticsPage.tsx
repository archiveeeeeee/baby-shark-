import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppData } from "@/context/AppDataContext";
import { dateTimeLabel, money } from "@/lib/utils-data";
import {
  Activity,
  Baby,
  BellRing,
  CreditCard,
  Euro,
  FileCheck2,
  FileText,
  HeartPulse,
  MessageSquare,
  Receipt,
  Smartphone,
  Users2,
} from "lucide-react";

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function statusTone(value: number, warningThreshold: number) {
  if (value === 0) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (value >= warningThreshold) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-sky-700 bg-sky-50 border-sky-200";
}

export default function StatisticsPage() {
  const { state } = useAppData();

  const activeParents = state.parents.length;
  const payerParents = state.parents.filter((parent) => parent.payer).length;
  const childrenCount = state.children.length;
  const activeContracts = state.contracts.filter((contract) => contract.status === "active").length;
  const pendingContracts = state.contracts.filter((contract) => contract.signatureStatus === "pending").length;
  const signedContracts = state.contracts.filter((contract) => contract.signatureStatus === "signed").length;

  const totalInvoiced = state.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalCollected = state.invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const outstanding = Math.max(totalInvoiced - totalCollected, 0);
  const collectionRate = percentage(totalCollected, totalInvoiced);
  const overdueInvoices = state.invoices.filter((invoice) => invoice.status === "overdue").length;
  const partialInvoices = state.invoices.filter((invoice) => invoice.status === "partial").length;

  const parentVisibleTransmissions = state.transmissions.filter((item) => item.visibility === "parent").length;
  const internalSensitiveTransmissions = state.transmissions.filter((item) => item.visibility !== "parent").length;
  const healthTransmissions = state.transmissions.filter((item) => item.category === "health").length;
  const latestTransmission = [...state.transmissions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const pendingRequests = state.requests.filter((request) => request.status === "submitted").length;
  const approvedRequests = state.requests.filter((request) => request.status === "approved").length;
  const parentMessages = state.messages.filter((thread) => thread.audience === "parent").length;
  const internalMessages = state.messages.filter((thread) => thread.audience === "internal").length;

  const openPreregistrations = state.preregistrations.filter((item) => item.status !== "rejected").length;
  const hotPreregistrations = state.preregistrations.filter((item) =>
    item.tags.some((tag) => ["chaud", "urgent", "prioritaire"].includes(tag.toLowerCase())),
  ).length;

  const devicesOnline = state.devices.length;
  const visibleTeam = state.users.filter((user) => user.role === "team" || user.role === "manager").length;
  const presentShifts = state.teamShifts.filter((shift) => shift.status === "present").length;
  const plannedShifts = state.teamShifts.filter((shift) => shift.status === "planned").length;
  const absentShifts = state.teamShifts.filter((shift) => shift.status === "absence").length;

  const childrenByGroup = state.structure.groups.map((group) => {
    const count = state.children.filter((child) => child.groupId === group.id).length;
    return {
      ...group,
      count,
      coverage: percentage(count, childrenCount),
    };
  });

  const transmissionByCategory = [
    { key: "presence", label: "Présences" },
    { key: "meal", label: "Repas" },
    { key: "nap", label: "Siestes" },
    { key: "change", label: "Changes" },
    { key: "health", label: "Santé" },
    { key: "activity", label: "Activités" },
    { key: "photo", label: "Photos" },
    { key: "note", label: "Notes" },
  ].map((item) => ({
    ...item,
    count: state.transmissions.filter((transmission) => transmission.category === item.key).length,
  }));

  const documentByCategory = [
    { key: "contract", label: "Contrats" },
    { key: "medical", label: "Médical" },
    { key: "parent", label: "Parents" },
    { key: "internal", label: "Interne" },
    { key: "invoice", label: "Factures" },
  ].map((item) => ({
    ...item,
    count: state.documents.filter((document) => document.category === item.key).length,
  }));

  const linkedChildren = state.children.filter((child) => child.parentIds.length > 0).length;
  const childrenWithAllergies = state.children.filter((child) => child.allergies.length > 0).length;

  const headlineCards = [
    {
      label: "Enfants suivis",
      value: childrenCount,
      detail: `${linkedChildren} rattachés à une famille`,
      icon: Baby,
    },
    {
      label: "Parents actifs",
      value: activeParents,
      detail: `${payerParents} parent(s) payeur(s)`,
      icon: Users2,
    },
    {
      label: "Encaissements",
      value: money(totalCollected),
      detail: `${collectionRate}% du facturé encaissé`,
      icon: Euro,
    },
    {
      label: "Reste à encaisser",
      value: money(outstanding),
      detail: `${partialInvoices} facture(s) partielle(s) · ${overdueInvoices} en retard`,
      icon: Receipt,
    },
  ];

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Statistiques"
          subtitle="Un cockpit de pilotage, pas quatre chiffres décoratifs. Ici on suit acquisition, exploitation, familles et cash."
        />

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {headlineCards.map((item) => (
            <Card key={item.label} className="rounded-2xl shadow-soft border-border/50">
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-3xl font-display font-bold mt-1">{item.value}</p>
                  <p className="text-sm text-muted-foreground mt-2">{item.detail}</p>
                </div>
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6">
          <Card className="rounded-2xl shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Finance et contrats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/50 p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground">Facturé</p>
                  <p className="text-2xl font-display font-bold mt-1">{money(totalInvoiced)}</p>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground">Contrats actifs</p>
                  <p className="text-2xl font-display font-bold mt-1">{activeContracts}</p>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground">Signature en attente</p>
                  <p className="text-2xl font-display font-bold mt-1">{pendingContracts}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium">Taux d'encaissement</p>
                    <p className="text-sm text-muted-foreground">Ce ratio dit si la facturation produit vraiment du cash.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-700">
                    {collectionRate}%
                  </Badge>
                </div>
                <Progress value={collectionRate} className="h-2.5" />
                <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Contrats signés</p>
                    <p className="font-semibold mt-1">{signedContracts}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Factures partielles</p>
                    <p className="font-semibold mt-1">{partialInvoices}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Factures en retard</p>
                    <p className="font-semibold mt-1">{overdueInvoices}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Points de vigilance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: "Reste à encaisser",
                  value: money(outstanding),
                  hint: "Le cash non encaissé est le premier trou noir à surveiller.",
                  tone: statusTone(Math.round(outstanding), 500),
                },
                {
                  label: "Contrats à faire signer",
                  value: `${pendingContracts}`,
                  hint: "Un contrat non signé, c'est un onboarding pas fini et un risque administratif.",
                  tone: statusTone(pendingContracts, 2),
                },
                {
                  label: "Demandes familles en attente",
                  value: `${pendingRequests}`,
                  hint: "Si ça stagne ici, la relation parent se dégrade en silence.",
                  tone: statusTone(pendingRequests, 3),
                },
                {
                  label: "Signalements santé",
                  value: `${healthTransmissions}`,
                  hint: "La donnée santé doit être suivie, pas noyée dans le flux général.",
                  tone: statusTone(healthTransmissions, 2),
                },
              ].map((item) => (
                <div key={item.label} className={`rounded-2xl border p-4 ${item.tone}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm mt-1 opacity-90">{item.hint}</p>
                    </div>
                    <span className="text-xl font-display font-bold whitespace-nowrap">{item.value}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <Card className="rounded-2xl shadow-soft border-border/50 xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Exploitation terrain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/50 p-4">
                  <p className="text-sm text-muted-foreground">Équipe visible</p>
                  <p className="text-2xl font-display font-bold mt-1">{visibleTeam}</p>
                </div>
                <div className="rounded-2xl border border-border/50 p-4">
                  <p className="text-sm text-muted-foreground">Appareils actifs</p>
                  <p className="text-2xl font-display font-bold mt-1">{devicesOnline}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Présents</span>
                  <span className="font-semibold">{presentShifts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Planifiés</span>
                  <span className="font-semibold">{plannedShifts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Absents</span>
                  <span className="font-semibold">{absentShifts}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium">Dernière activité terrain</p>
                    <p className="text-sm text-muted-foreground">Le flux opérationnel doit rester vivant.</p>
                  </div>
                  <HeartPulse className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm">
                  {latestTransmission
                    ? `${latestTransmission.title} · ${dateTimeLabel(latestTransmission.createdAt)}`
                    : "Aucune transmission enregistrée."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-border/50 xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Familles et communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/50 p-4">
                  <p className="text-sm text-muted-foreground">Demandes en attente</p>
                  <p className="text-2xl font-display font-bold mt-1">{pendingRequests}</p>
                </div>
                <div className="rounded-2xl border border-border/50 p-4">
                  <p className="text-sm text-muted-foreground">Demandes approuvées</p>
                  <p className="text-2xl font-display font-bold mt-1">{approvedRequests}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-border/50 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Transmissions visibles parents</p>
                    <p className="text-sm text-muted-foreground">Ce que les familles voient vraiment.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">{parentVisibleTransmissions}</Badge>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Transmissions internes/sensibles</p>
                    <p className="text-sm text-muted-foreground">Ce qui doit rester côté structure.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">{internalSensitiveTransmissions}</Badge>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Fils parents</p>
                    <p className="text-sm text-muted-foreground">Conversations ouvertes avec les familles.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-700">{parentMessages}</Badge>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Fils internes</p>
                    <p className="text-sm text-muted-foreground">Coordination équipe et management.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-700">{internalMessages}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-border/50 xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Acquisition et conformité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Pré-inscriptions ouvertes</p>
                    <p className="text-sm text-muted-foreground">Le pipe commercial réel de la structure.</p>
                  </div>
                  <span className="text-2xl font-display font-bold">{openPreregistrations}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{hotPreregistrations} dossier(s) signalé(s) comme chaud(s) ou prioritaires.</p>
              </div>

              <div className="rounded-2xl border border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Enfants avec allergies</span>
                  <span className="font-semibold">{childrenWithAllergies}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Documents stockés</span>
                  <span className="font-semibold">{state.documents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profils famille reliés</span>
                  <span className="font-semibold">{linkedChildren}/{childrenCount}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck2 className="h-4 w-4 text-primary" />
                  <p className="font-medium">Répartition des documents</p>
                </div>
                <div className="space-y-3">
                  {documentByCategory.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
          <Card className="rounded-2xl shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-primary" />
                Répartition enfants par section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {childrenByGroup.map((group) => (
                <div key={group.id} className="rounded-2xl border border-border/50 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`rounded-full border-0 ${group.colorClass}`}>{group.name}</Badge>
                      <span className="text-sm text-muted-foreground">{group.count} enfant(s)</span>
                    </div>
                    <span className="text-sm font-semibold">{group.coverage}%</span>
                  </div>
                  <Progress value={group.coverage} className="h-2.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Répartition du flux de transmissions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              {transmissionByCategory.map((item) => (
                <div key={item.key} className="rounded-2xl border border-border/50 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{percentage(item.count, state.transmissions.length)}% du flux total</p>
                  </div>
                  <span className="text-xl font-display font-bold">{item.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </BackOfficeLayout>
  );
}
