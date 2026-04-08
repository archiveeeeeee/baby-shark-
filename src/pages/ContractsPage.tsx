import { useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppDataContext";

export default function ContractsPage() {
  const { state, createContract } = useAppData();
  const [childId, setChildId] = useState(state.children[0]?.id ?? "");
  const [payerParentId, setPayerParentId] = useState(state.parents[0]?.id ?? "");
  const [startDate, setStartDate] = useState("2026-09-01");
  const [scheduleLabel, setScheduleLabel] = useState("Temps plein");
  const [pricingLabel, setPricingLabel] = useState("820 €/mois");

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle title="Contrats" subtitle="Génération des contrats, versionnage simple et workflow de signature prêt à brancher." />
        <div className="grid xl:grid-cols-[0.8fr_1.2fr] gap-6">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader><CardTitle>Nouveau contrat</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={childId} onValueChange={setChildId}><SelectTrigger><SelectValue placeholder="Enfant" /></SelectTrigger><SelectContent>{state.children.map((child) => <SelectItem key={child.id} value={child.id}>{child.firstName} {child.lastName}</SelectItem>)}</SelectContent></Select>
              <Select value={payerParentId} onValueChange={setPayerParentId}><SelectTrigger><SelectValue placeholder="Parent payeur" /></SelectTrigger><SelectContent>{state.parents.map((parent) => <SelectItem key={parent.id} value={parent.id}>{parent.name}</SelectItem>)}</SelectContent></Select>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input value={scheduleLabel} onChange={(e) => setScheduleLabel(e.target.value)} placeholder="Rythme" />
              <Input value={pricingLabel} onChange={(e) => setPricingLabel(e.target.value)} placeholder="Tarification" />
              <Button className="w-full rounded-xl" onClick={() => createContract({ childId, payerParentId, startDate, scheduleLabel, pricingLabel })}>Préparer le contrat</Button>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {state.contracts.map((contract) => {
              const child = state.children.find((item) => item.id === contract.childId);
              const parent = state.parents.find((item) => item.id === contract.payerParentId);
              return (
                <Card key={contract.id} className="rounded-2xl shadow-soft">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display font-semibold text-lg">{child?.firstName} {child?.lastName}</p>
                        <p className="text-sm text-muted-foreground">{parent?.name} · {contract.scheduleLabel}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="rounded-full">{contract.status}</Badge>
                        <Badge className="rounded-full border-0 bg-primary/10 text-primary">{contract.signatureStatus}</Badge>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div><p className="text-muted-foreground">Début</p><p className="font-medium">{contract.startDate}</p></div>
                      <div><p className="text-muted-foreground">Tarif</p><p className="font-medium">{contract.pricingLabel}</p></div>
                      <div><p className="text-muted-foreground">Workflow</p><p className="font-medium">Prêt à brancher</p></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </BackOfficeLayout>
  );
}
