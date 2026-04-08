import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";

export default function ExportsPage() {
  const { state } = useAppData();
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <SectionTitle title="Exports" subtitle="Exports simples V1. Pas de moteur comptable avancé, juste ce qu'il faut pour vendre proprement." />
        <Card className="rounded-2xl shadow-soft"><CardContent className="p-5 flex flex-wrap gap-3"><Button className="rounded-xl" onClick={()=>window.alert(`Export JSON prêt pour ${state.children.length} enfants.`)}>Exporter enfants</Button><Button variant="outline" className="rounded-xl" onClick={()=>window.alert(`Export JSON prêt pour ${state.invoices.length} factures.`)}>Exporter factures</Button></CardContent></Card>
      </div>
    </BackOfficeLayout>
  );
}
