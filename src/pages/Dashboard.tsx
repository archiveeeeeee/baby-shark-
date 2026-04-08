import { Link } from "react-router-dom";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData, useChildrenWithRelations, useCurrentUser } from "@/context/AppDataContext";
import { money } from "@/lib/utils-data";
import { Baby, FileText, Receipt, Tablet, Users2 } from "lucide-react";

export default function Dashboard() {
  const { state } = useAppData();
  const children = useChildrenWithRelations();
  const currentUser = useCurrentUser();
  const todayPresent = state.transmissions.filter((tr) => tr.category === "presence").length;
  const openPreregistrations = state.preregistrations.filter((pre) => pre.status !== "rejected").length;
  const unpaid = state.invoices.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + (invoice.amount - invoice.paidAmount), 0);

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 shadow-elevated">
          <Badge className="rounded-full border-0 bg-white/10 text-white">V1 vendable · Belgique · Multi-tenant</Badge>
          <h1 className="text-3xl font-display font-bold mt-4">Bonjour {currentUser.name.split(" ")[0]} 👋</h1>
          <p className="text-primary-foreground/80 mt-2 max-w-2xl">La DA est gelée. Maintenant, le produit vit par ses données communes : enfants, familles, contrats, factures, transmissions et appareils partagent le même socle.</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Enfants suivis", value: children.length, icon: Baby },
            { label: "Pré-inscriptions actives", value: openPreregistrations, icon: FileText },
            { label: "Reste à encaisser", value: money(unpaid), icon: Receipt },
            { label: "Appareils connectés", value: state.devices.length, icon: Tablet },
          ].map((item) => (
            <Card key={item.label} className="rounded-2xl shadow-soft">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-3xl font-display font-bold mt-1">{item.value}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><item.icon className="h-5 w-5" /></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid xl:grid-cols-[1.3fr_0.7fr] gap-6">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Jour en cours</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Les modules communiquent sur les mêmes enfants et parents.</p>
              </div>
              <Button asChild className="rounded-xl"><Link to="/app-equipe">Ouvrir l'app équipe</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {children.slice(0, 5).map((child) => (
                <Link key={child.id} to={`/enfants/${child.id}`} className="block rounded-2xl border border-border/40 p-4 hover:bg-muted/20 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={child.photo} alt={child.firstName} className="h-12 w-12 rounded-2xl object-cover" />
                      <div>
                        <p className="font-medium">{child.firstName} {child.lastName}</p>
                        <p className="text-sm text-muted-foreground">{child.parents.map((parent) => parent.name).join(" · ")}</p>
                      </div>
                    </div>
                    {child.group ? <Badge className={`rounded-full border-0 ${child.group.colorClass}`}>{child.group.name}</Badge> : null}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle>Flux croisés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border border-border/40 p-4">
                <p className="font-medium">Parents</p>
                <p className="text-muted-foreground mt-1">{state.parents.length} fiches parent payeur ou rattaché aux enfants.</p>
              </div>
              <div className="rounded-2xl border border-border/40 p-4">
                <p className="font-medium">Transmissions</p>
                <p className="text-muted-foreground mt-1">{state.transmissions.length} événements encodés visibles selon 4 niveaux de confidentialité.</p>
              </div>
              <div className="rounded-2xl border border-border/40 p-4">
                <p className="font-medium">Demandes familles</p>
                <p className="text-muted-foreground mt-1">{state.requests.length} demandes absence/retard/réservation/document.</p>
              </div>
              <div className="rounded-2xl border border-border/40 p-4 flex items-center justify-between">
                <span>App famille</span>
                <Button variant="outline" size="sm" className="rounded-xl" asChild><Link to="/app-famille">Tester</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BackOfficeLayout>
  );
}
