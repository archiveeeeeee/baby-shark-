import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAppData } from "@/context/AppDataContext";
import { money } from "@/lib/utils-data";
import {
  Building2,
  CreditCard,
  Globe,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Users2,
} from "lucide-react";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-muted/15 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground break-words">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const { state, storageMode } = useAppData();
  const { structure } = state;

  const adminCount = state.users.filter((user) => user.role === "admin" || user.role === "superadmin").length;
  const managementCount = state.users.filter((user) => user.role === "manager").length;
  const teamCount = state.users.filter((user) => user.role === "team").length;
  const parentCount = state.parents.length;
  const groupCount = structure.groups.length;
  const deviceCount = state.devices.length;
  const childCount = state.children.length;
  const documentCount = state.documents.length;
  const activeContracts = state.contracts.filter((contract) => contract.status === "active").length;
  const signedContracts = state.contracts.filter((contract) => contract.signatureStatus === "signed").length;
  const totalInvoiced = state.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPaid = state.invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const outstanding = Math.max(totalInvoiced - totalPaid, 0);
  const parentVisibleModules = ["Contrats", "Facturation", "Messagerie", "Documents", "Signature"];
  const teamVisibleModules = ["Planning enfants", "Planning équipe", "Messagerie", "Documents"];
  const configurationCoverage = Math.round(
    ((Number(Boolean(structure.name)) +
      Number(Boolean(structure.email)) +
      Number(Boolean(structure.phone)) +
      Number(Boolean(structure.address)) +
      Number(groupCount > 0) +
      Number(deviceCount > 0)) /
      6) *
      100,
  );

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Paramétrage"
          subtitle="Ici on structure la crèche. Pas un fourre-tout de champs décoratifs : identité, sections, exploitation, accès et socle digital."
        />

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: "Structure",
              value: structure.name,
              detail: `${structure.country} · ${structure.currency}`,
              icon: Building2,
            },
            {
              label: "Sections actives",
              value: `${groupCount}`,
              detail: `${childCount} enfant(s) réparti(s)`,
              icon: Users2,
            },
            {
              label: "Appareils déclarés",
              value: `${deviceCount}`,
              detail: `${teamCount + managementCount} compte(s) terrain`,
              icon: Smartphone,
            },
            {
              label: "Couverture paramétrage",
              value: `${configurationCoverage}%`,
              detail: storageMode === "supabase" ? "Branché sur Supabase" : "Mode local / seed",
              icon: ShieldCheck,
            },
          ].map((item) => (
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

        <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-6">
          <Card className="rounded-2xl shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Identité de la structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <InfoRow label="Nom commercial" value={structure.name} />
                <InfoRow label="Slug / identifiant" value={structure.slug} />
                <InfoRow label="Email principal" value={structure.email} />
                <InfoRow label="Téléphone" value={structure.phone} />
                <InfoRow label="Fuseau horaire" value={structure.timezone} />
                <InfoRow label="Pays / devise" value={`${structure.country} · ${structure.currency}`} />
              </div>

              <InfoRow label="Adresse" value={structure.address} />

              <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-900">
                <p className="font-medium">Point produit</p>
                <p className="mt-1">
                  Cette zone doit rester la source de vérité structurelle : identité, coordonnées, sections et règles locales.
                  Si tu disperses ça ailleurs, ton back-office devient incohérent très vite.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-primary" />
                Sections et capacité terrain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {structure.groups.map((group) => {
                  const childrenInGroup = state.children.filter((child) => child.groupId === group.id).length;
                  const share = childCount ? Math.round((childrenInGroup / childCount) * 100) : 0;

                  return (
                    <div key={group.id} className="rounded-2xl border border-border/50 p-4 bg-muted/15">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {childrenInGroup} enfant(s) affecté(s) · {share}% du total
                          </p>
                        </div>
                        <Badge variant="outline" className="rounded-full">Section active</Badge>
                      </div>
                      <Progress value={share} className="h-2.5 mt-3" />
                    </div>
                  );
                })}
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/50 p-4">
                  <p className="text-sm text-muted-foreground">Managers</p>
                  <p className="text-2xl font-display font-bold mt-1">{managementCount}</p>
                </div>
                <div className="rounded-2xl border border-border/50 p-4">
                  <p className="text-sm text-muted-foreground">Équipe terrain</p>
                  <p className="text-2xl font-display font-bold mt-1">{teamCount}</p>
                </div>
                <div className="rounded-2xl border border-border/50 p-4">
                  <p className="text-sm text-muted-foreground">Parents reliés</p>
                  <p className="text-2xl font-display font-bold mt-1">{parentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <Card className="rounded-2xl shadow-soft border-border/50 xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Gouvernance et accès
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/50 p-4 bg-muted/15">
                  <p className="text-sm text-muted-foreground">Admins / superadmins</p>
                  <p className="text-2xl font-display font-bold mt-1">{adminCount}</p>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 bg-muted/15">
                  <p className="text-sm text-muted-foreground">Managers</p>
                  <p className="text-2xl font-display font-bold mt-1">{managementCount}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Modules visibles équipe</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {teamVisibleModules.map((module) => (
                      <Badge key={module} variant="outline" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">
                        {module}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium">Modules visibles parents</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parentVisibleModules.map((module) => (
                      <Badge key={module} variant="outline" className="rounded-full bg-amber-50 text-amber-700 border-amber-200">
                        {module}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                <p className="font-medium">Rappel utile</p>
                <p className="mt-1">
                  Les droits fins se pilotent dans l’onglet Droits d’accès. Le paramétrage doit exposer le cadre,
                  pas devenir une seconde matrice cachée.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-border/50 xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Cadre administratif et financier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/50 p-4 bg-muted/15">
                  <p className="text-sm text-muted-foreground">Contrats actifs</p>
                  <p className="text-2xl font-display font-bold mt-1">{activeContracts}</p>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 bg-muted/15">
                  <p className="text-sm text-muted-foreground">Contrats signés</p>
                  <p className="text-2xl font-display font-bold mt-1">{signedContracts}</p>
                </div>
              </div>

              <InfoRow label="Titre site / portail" value={structure.websiteTitle} />
              <InfoRow label="Baseline" value={structure.tagline} />
              <InfoRow label="Facturé cumulé" value={money(totalInvoiced)} />
              <InfoRow label="Reste à encaisser" value={money(outstanding)} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-border/50 xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Socle digital visible
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-border/50 p-4 flex items-start gap-3 bg-muted/15">
                  <Mail className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Canal principal</p>
                    <p className="text-sm text-muted-foreground mt-1">{structure.email}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 flex items-start gap-3 bg-muted/15">
                  <Phone className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Contact téléphonique</p>
                    <p className="text-sm text-muted-foreground mt-1">{structure.phone}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 flex items-start gap-3 bg-muted/15">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Adresse d’exploitation</p>
                    <p className="text-sm text-muted-foreground mt-1">{structure.address}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 flex items-start gap-3 bg-muted/15">
                  <HeartPulse className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Charge documentaire</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {documentCount} document(s) suivis dans l’espace crèche.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BackOfficeLayout>
  );
}
