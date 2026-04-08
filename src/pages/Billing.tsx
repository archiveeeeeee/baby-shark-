import { useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppDataContext";
import { money } from "@/lib/utils-data";

export default function Billing() {
  const { state, createInvoice, registerPayment } = useAppData();
  const [parentId, setParentId] = useState(state.parents[0]?.id ?? "");
  const [label, setLabel] = useState("Crèche mai 2026");
  const [month, setMonth] = useState("2026-05");
  const [amount, setAmount] = useState("820");

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle title="Facturation" subtitle="Niveau B : pro forma, facture finale verrouillée, parent payeur et règlements manuels." />
        <div className="grid xl:grid-cols-[0.85fr_1.15fr] gap-6">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader><CardTitle>Créer une facture</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder="Parent payeur" /></SelectTrigger>
                <SelectContent>{state.parents.map((parent) => <SelectItem key={parent.id} value={parent.id}>{parent.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé" />
              <Input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="Mois" />
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Montant" />
              <Button className="w-full rounded-xl" onClick={() => createInvoice({ parentId, label, month, amount: Number(amount), contractId: state.contracts.find((contract) => contract.payerParentId === parentId)?.id })}>Générer une pro forma</Button>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {state.invoices.map((invoice) => {
              const parent = state.parents.find((item) => item.id === invoice.parentId);
              return (
                <Card key={invoice.id} className="rounded-2xl shadow-soft">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display font-semibold text-lg">{invoice.label}</p>
                        <p className="text-sm text-muted-foreground">{parent?.name} · {invoice.number ?? "Sans numéro"}</p>
                      </div>
                      <Badge className="rounded-full border-0 bg-primary/10 text-primary">{invoice.status}</Badge>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div><p className="text-muted-foreground">Montant</p><p className="font-medium">{money(invoice.amount)}</p></div>
                      <div><p className="text-muted-foreground">Déjà payé</p><p className="font-medium">{money(invoice.paidAmount)}</p></div>
                      <div><p className="text-muted-foreground">Reste</p><p className="font-medium">{money(invoice.amount - invoice.paidAmount)}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => registerPayment(invoice.id, Math.min(100, invoice.amount - invoice.paidAmount || 100))}>Encaisser 100 €</Button>
                      <Button size="sm" className="rounded-xl" onClick={() => registerPayment(invoice.id, invoice.amount - invoice.paidAmount)}>Marquer payée</Button>
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
