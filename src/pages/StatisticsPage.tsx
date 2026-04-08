import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/context/AppDataContext";
import { money } from "@/lib/utils-data";

export default function StatisticsPage() {
  const { state } = useAppData();
  const paid = state.invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const parentVisible = state.transmissions.filter((item) => item.visibility === "parent").length;
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle title="Statistiques" subtitle="KPIs utiles, pas des gadgets de dashboard vides." />
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            ["Parents actifs", state.parents.length],
            ["Contrats actifs", state.contracts.filter((contract) => contract.status === "active").length],
            ["Transmissions visibles parents", parentVisible],
            ["Encaissements", money(paid)],
          ].map(([label, value]) => (
            <Card key={label as string} className="rounded-2xl shadow-soft"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label as string}</p><p className="text-3xl font-display font-bold mt-1">{value as string | number}</p></CardContent></Card>
          ))}
        </div>
      </div>
    </BackOfficeLayout>
  );
}
