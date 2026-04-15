import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";

function downloadCSV(data: Record<string, string | number>[], filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((field) => `"${String(row[field] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function ExportsPage() {
  const { state } = useAppData();

  const exportChildren = () => {
    const formatted = state.children.map((child) => {
      const parents = child.parentIds
        .map((parentId) => state.parents.find((parent) => parent.id === parentId))
        .filter(Boolean);

      return {
        "Nom enfant": `${child.firstName} ${child.lastName}`,
        "Date naissance": child.birthDate || "",
        "Parents": parents.map((parent) => parent?.name ?? "").join(", "),
        "Emails": parents.map((parent) => parent?.email ?? "").join(", "),
        "Groupe": state.structure.groups.find((group) => group.id === child.groupId)?.name ?? "",
        "Allergies": child.allergies.join(", "),
      };
    });

    downloadCSV(formatted, "enfants.csv");
  };

  const exportInvoices = () => {
    const formatted = state.invoices.map((invoice) => {
      const parent = state.parents.find((item) => item.id === invoice.parentId);

      return {
        "Num facture": invoice.number || invoice.id,
        "Parent": parent?.name || "",
        "Email": parent?.email || "",
        "Montant": invoice.amount,
        "Déjà payé": invoice.paidAmount,
        "Statut": invoice.status,
        "Mois": invoice.month,
        "Libellé": invoice.label,
      };
    });

    downloadCSV(formatted, "factures.csv");
  };

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <SectionTitle
          title="Exports"
          subtitle="Exports simples V1. Pas de moteur comptable avancé, juste ce qu'il faut pour vendre proprement."
        />

        <Card className="rounded-2xl shadow-soft">
          <CardContent className="p-5 flex flex-wrap gap-3">
            <Button className="rounded-xl" onClick={exportChildren}>
              Exporter enfants
            </Button>

            <Button variant="outline" className="rounded-xl" onClick={exportInvoices}>
              Exporter factures
            </Button>
          </CardContent>
        </Card>
      </div>
    </BackOfficeLayout>
  );
}
