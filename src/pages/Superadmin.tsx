import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";
import { Building2, Layers3, ShieldCheck, Users2 } from "lucide-react";

export default function Superadmin() {
  const { state } = useAppData();
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Superadmin"
          subtitle="Pilotage plateforme, structures, accès et industrialisation du SaaS."
          actions={<Button className="rounded-xl">Créer une structure</Button>}
        />
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Structures actives", value: 1, icon: Building2 },
            { label: "Utilisateurs", value: state.users.length, icon: Users2 },
            { label: "Templates", value: 4, icon: Layers3 },
            { label: "Incidents critiques", value: 0, icon: ShieldCheck },
          ].map((card) => (
            <Card key={card.label} className="rounded-2xl shadow-soft">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-display font-bold mt-1">{card.value}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><card.icon className="h-5 w-5" /></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Structure active</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{state.structure.name}</p>
              <p className="text-sm text-muted-foreground">Slug : {state.structure.slug} · {state.structure.country} · {state.structure.currency}</p>
            </div>
            <div className="flex gap-2">
              <Badge className="rounded-full bg-success text-success-foreground border-0">Active</Badge>
              <Badge variant="secondary" className="rounded-full">Multi-tenant prêt</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </BackOfficeLayout>
  );
}
