import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppDataContext";
import { useMemo, useState } from "react";

type ExportFeedback = {
  type: "success" | "error";
  message: string;
};

function toCsvValue(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) {
    throw new Error("Aucune donnée disponible pour cet export.");
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.map(toCsvValue).join(","),
    ...data.map((row) => headers.map((field) => toCsvValue(row[field])).join(",")),
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

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildExportFileName(base: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${base}-${stamp}.csv`;
}

export default function ExportsPage() {
  const { state } = useAppData();
  const [feedback, setFeedback] = useState<ExportFeedback | null>(null);

  const exportStats = useMemo(() => {
    const signedContracts = state.contracts.filter((contract) => contract.signatureStatus === "signed").length;
    const activeContracts = state.contracts.filter((contract) => contract.status === "active").length;
    const overdueInvoices = state.invoices.filter((invoice) => invoice.status === "overdue").length;
    const pendingInvoices = state.invoices.filter(
      (invoice) => invoice.status === "partial" || invoice.status === "overdue",
    ).length;

    return {
      children: state.children.length,
      invoices: state.invoices.length,
      contracts: state.contracts.length,
      signedContracts,
      activeContracts,
      documents: state.documents.length,
      overdueInvoices,
      pendingInvoices,
    };
  }, [state.children, state.contracts, state.documents, state.invoices]);

  const runExport = (label: string, builder: () => Record<string, unknown>[], fileBaseName: string) => {
    try {
      const data = builder();
      downloadCSV(data, buildExportFileName(fileBaseName));
      setFeedback({
        type: "success",
        message: `${label} exporté avec succès. Le téléchargement CSV a démarré.`,
      });
    } catch (error) {
      console.error(`Export failed for ${label}`, error);
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : `L'export ${label.toLowerCase()} a échoué.`,
      });
    }
  };

  const exportChildren = () =>
    runExport(
      "Enfants",
      () =>
        state.children.map((child) => {
          const parents = child.parentIds
            .map((parentId) => state.parents.find((parent) => parent.id === parentId))
            .filter(Boolean);

          const activeContract = child.activeContractId
            ? state.contracts.find((contract) => contract.id === child.activeContractId)
            : state.contracts.find((contract) => contract.childId === child.id && contract.status !== "ended");

          return {
            "Nom enfant": `${child.firstName} ${child.lastName}`,
            "Date naissance": child.birthDate || "",
            "Groupe": state.structure.groups.find((group) => group.id === child.groupId)?.name ?? "",
            "Parents": parents.map((parent) => parent?.name ?? "").join(", "),
            "Emails parents": parents.map((parent) => parent?.email ?? "").join(", "),
            "Téléphones parents": parents.map((parent) => parent?.phone ?? "").join(", "),
            "Allergies": child.allergies.join(", "),
            "Notes médicales": child.medicalNotes || "",
            "Contrat actif": activeContract ? "Oui" : "Non",
            "Statut contrat": activeContract?.status ?? "",
          };
        }),
      "export-enfants",
    );

  const exportInvoices = () =>
    runExport(
      "Factures",
      () =>
        state.invoices.map((invoice) => {
          const parent = state.parents.find((item) => item.id === invoice.parentId);
          const contract = invoice.contractId
            ? state.contracts.find((item) => item.id === invoice.contractId)
            : null;
          const child = contract ? state.children.find((item) => item.id === contract.childId) : null;

          return {
            "Num facture": invoice.number || invoice.id,
            "Libellé": invoice.label,
            "Mois": invoice.month,
            "Montant": invoice.amount,
            "Déjà payé": invoice.paidAmount,
            "Reste dû": Math.max(invoice.amount - invoice.paidAmount, 0),
            "Statut": invoice.status,
            "Parent": parent?.name || "",
            "Email parent": parent?.email || "",
            "Enfant lié": child ? `${child.firstName} ${child.lastName}` : "",
          };
        }),
      "export-factures",
    );

  const exportContracts = () =>
    runExport(
      "Contrats",
      () =>
        state.contracts.map((contract) => {
          const child = state.children.find((item) => item.id === contract.childId);
          const parent = state.parents.find((item) => item.id === contract.payerParentId);

          return {
            "Référence contrat": contract.id,
            "Nom enfant": child ? `${child.firstName} ${child.lastName}` : "",
            "Parent payeur": parent?.name || "",
            "Email parent": parent?.email || "",
            "Début contrat": contract.startDate,
            "Fin contrat": contract.endDate || "",
            "Cadence": contract.scheduleLabel,
            "Tarification": contract.pricingLabel,
            "Statut contrat": contract.status,
            "Statut signature": contract.signatureStatus,
            "Signé le": formatDate(contract.signatureSignedAt),
            "Signé par": contract.signedBy || "",
            "PDF signé": contract.signedDocumentUrl || "",
          };
        }),
      "export-contrats",
    );

  const exportSignatures = () =>
    runExport(
      "Signatures",
      () =>
        state.contracts.map((contract) => {
          const child = state.children.find((item) => item.id === contract.childId);
          const parent = state.parents.find((item) => item.id === contract.payerParentId);

          return {
            "Référence contrat": contract.id,
            "Nom enfant": child ? `${child.firstName} ${child.lastName}` : "",
            "Parent signataire": parent?.name || "",
            "Email signataire": parent?.email || "",
            "Signature obtenue": contract.signatureStatus === "signed" ? "Oui" : "Non",
            "Statut signature": contract.signatureStatus,
            "Signé le": formatDate(contract.signatureSignedAt),
            "Signé par": contract.signedBy || "",
            "Document signé": contract.signedDocumentUrl || "",
            "Statut contrat": contract.status,
          };
        }),
      "export-signatures",
    );

  const exportDocuments = () =>
    runExport(
      "Documents",
      () =>
        state.documents.map((document) => ({
          "Référence document": document.id,
          "Titre": document.title,
          "Catégorie": document.category,
          "Type entité": document.linkedTo.type,
          "ID entité": document.linkedTo.id,
          "Ajouté le": formatDate(document.uploadedAt),
        })),
      "export-documents",
    );

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <SectionTitle
          title="Exports"
          subtitle="Ici, on sort enfin des fichiers réellement utilisables pour l’administratif, le contrôle, la compta et le suivi contractuel."
        />

        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="rounded-2xl shadow-soft">
            <CardContent className="p-5 space-y-2">
              <p className="text-sm text-muted-foreground">Enfants exportables</p>
              <p className="text-3xl font-display font-bold">{exportStats.children}</p>
              <p className="text-xs text-muted-foreground">Base terrain, familles, groupes et santé.</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardContent className="p-5 space-y-2">
              <p className="text-sm text-muted-foreground">Factures exportables</p>
              <p className="text-3xl font-display font-bold">{exportStats.invoices}</p>
              <p className="text-xs text-muted-foreground">
                {exportStats.pendingInvoices} à surveiller, dont {exportStats.overdueInvoices} en retard.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardContent className="p-5 space-y-2">
              <p className="text-sm text-muted-foreground">Contrats actifs</p>
              <p className="text-3xl font-display font-bold">{exportStats.activeContracts}</p>
              <p className="text-xs text-muted-foreground">
                {exportStats.signedContracts} signés sur {exportStats.contracts} contrats au total.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardContent className="p-5 space-y-2">
              <p className="text-sm text-muted-foreground">Documents exportables</p>
              <p className="text-3xl font-display font-bold">{exportStats.documents}</p>
              <p className="text-xs text-muted-foreground">Vision rapide sur l’archivage et la conformité.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid xl:grid-cols-[1.25fr_0.9fr] gap-6 items-start">
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Exports opérationnels</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Enfants</p>
                    <Badge className="rounded-full bg-sky-100 text-sky-700 border-0">Terrain</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Coordonnées familles, groupe, allergies, suivi de base.
                  </p>
                  <Button className="rounded-xl w-full" onClick={exportChildren}>
                    Exporter enfants
                  </Button>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Factures</p>
                    <Badge className="rounded-full bg-violet-100 text-violet-700 border-0">Finance</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Compta, suivi des règlements, reste dû et vue parent liée.
                  </p>
                  <Button variant="outline" className="rounded-xl w-full" onClick={exportInvoices}>
                    Exporter factures
                  </Button>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Contrats</p>
                    <Badge className="rounded-full bg-amber-100 text-amber-700 border-0">Juridique</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Statut contrat, signature, parent payeur, dates, PDF signé.
                  </p>
                  <Button variant="outline" className="rounded-xl w-full" onClick={exportContracts}>
                    Exporter contrats
                  </Button>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Signatures</p>
                    <Badge className="rounded-full bg-emerald-100 text-emerald-700 border-0">Preuve</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export focalisé sur la preuve de signature et l’état documentaire.
                  </p>
                  <Button variant="outline" className="rounded-xl w-full" onClick={exportSignatures}>
                    Exporter signatures
                  </Button>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4 space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Documents</p>
                    <Badge className="rounded-full bg-rose-100 text-rose-700 border-0">Archivage</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vision globale des documents stockés pour contrôle, audit ou reprise administrative.
                  </p>
                  <Button variant="outline" className="rounded-xl w-full md:w-auto" onClick={exportDocuments}>
                    Exporter documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-soft sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Lecture métier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground leading-relaxed">
                Cette page ne doit pas être une décoration. Elle doit permettre de sortir des fichiers actionnables sans passer par du JSON, de la console ou du bricolage manuel.
              </div>

              <div className="rounded-2xl border p-4 space-y-3">
                <p className="font-medium">Ce qui est couvert maintenant</p>
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-2">
                  <li>export terrain enfants,</li>
                  <li>export finance factures,</li>
                  <li>export juridique contrats,</li>
                  <li>export preuve signatures,</li>
                  <li>export archivage documents.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 leading-relaxed">
                Le vrai intérêt d’un export, ce n’est pas de “sortir des données”. C’est d’éviter que ton client se sente piégé dans l’outil et de lui donner une porte de sortie crédible en cas de contrôle, besoin comptable ou audit.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BackOfficeLayout>
  );
}
