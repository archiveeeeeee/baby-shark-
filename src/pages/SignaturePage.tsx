import { useEffect, useMemo, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Contract } from "@/types";

type UiSignatureStatus = Contract["signatureStatus"];

type SignatureWorkflowState = {
  status: UiSignatureStatus;
  sentAt?: string;
  reminderCount: number;
};

type EnrichedContract = Contract & {
  childName: string;
  parentName: string;
  parentEmail: string;
  workflow: SignatureWorkflowState;
};

const DOCUMENT_BUCKET = "documents";

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

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusMeta(status: UiSignatureStatus) {
  switch (status) {
    case "signed":
      return {
        label: "Signé",
        badgeClass: "bg-emerald-100 text-emerald-700 border-0",
        panelClass: "border-emerald-200 bg-emerald-50/70",
      };
    case "pending":
      return {
        label: "Envoyé / en attente",
        badgeClass: "bg-amber-100 text-amber-700 border-0",
        panelClass: "border-amber-200 bg-amber-50/70",
      };
    case "not_started":
    default:
      return {
        label: "À envoyer",
        badgeClass: "bg-slate-100 text-slate-700 border-0",
        panelClass: "border-slate-200 bg-slate-50/80",
      };
  }
}

function sanitizePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

function buildSimplePdfBlob(lines: string[]) {
  const encoder = new TextEncoder();
  const textLines = lines.map((line) => sanitizePdfText(line)).filter(Boolean);
  let currentY = 790;
  const contentStream = [
    "BT",
    "/F1 12 Tf",
    "50 790 Td",
    ...textLines.flatMap((line, index) => {
      const commands =
        index === 0
          ? [`(${line}) Tj`]
          : [`0 -18 Td`, `(${line}) Tj`];
      currentY -= 18;
      return commands;
    }),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${encoder.encode(contentStream).length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += object;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

async function getTenantId() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SignaturePage() {
  const { state, refresh } = useAppData();
  const [workflow, setWorkflow] = useState<Record<string, SignatureWorkflowState>>({});
  const [selectedId, setSelectedId] = useState<string | null>(state.contracts[0]?.id ?? null);
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setWorkflow((current) =>
      Object.fromEntries(
        state.contracts.map((contract) => [
          contract.id,
          {
            status: contract.signatureStatus,
            sentAt:
              contract.signatureStatus === "pending" || contract.signatureStatus === "signed"
                ? current[contract.id]?.sentAt ?? contract.startDate
                : undefined,
            reminderCount: current[contract.id]?.reminderCount ?? 0,
          },
        ]),
      ),
    );
  }, [state.contracts]);

  useEffect(() => {
    if (!selectedId && state.contracts[0]?.id) {
      setSelectedId(state.contracts[0].id);
      return;
    }

    if (selectedId && !state.contracts.some((contract) => contract.id === selectedId)) {
      setSelectedId(state.contracts[0]?.id ?? null);
    }
  }, [selectedId, state.contracts]);

  const contracts = useMemo<EnrichedContract[]>(
    () =>
      state.contracts.map((contract) => {
        const child = state.children.find((item) => item.id === contract.childId);
        const parent = state.parents.find((item) => item.id === contract.payerParentId);
        const current = workflow[contract.id] ?? {
          status: contract.signatureStatus,
          sentAt:
            contract.signatureStatus === "pending" || contract.signatureStatus === "signed"
              ? contract.startDate
              : undefined,
          reminderCount: 0,
        };

        return {
          ...contract,
          childName: child ? `${child.firstName} ${child.lastName}` : "Enfant non relié",
          parentName: parent?.name ?? "Parent payeur non relié",
          parentEmail: parent?.email ?? "Email non renseigné",
          workflow: current,
        };
      }),
    [state.children, state.contracts, state.parents, workflow],
  );

  const selectedContract = contracts.find((contract) => contract.id === selectedId) ?? contracts[0] ?? null;
  const pendingCount = contracts.filter((contract) => contract.workflow.status === "pending").length;
  const signedCount = contracts.filter((contract) => contract.workflow.status === "signed").length;
  const notStartedCount = contracts.filter((contract) => contract.workflow.status === "not_started").length;
  const signatureRate = contracts.length ? Math.round((signedCount / contracts.length) * 100) : 0;

  const updateWorkflow = (contractId: string, next: Partial<SignatureWorkflowState>) => {
    setWorkflow((current) => ({
      ...current,
      [contractId]: {
        ...(current[contractId] ?? { status: "not_started", reminderCount: 0 }),
        ...next,
      },
    }));
  };

  const buildSignedContractPdf = (contract: EnrichedContract, signedAtIso: string, signedBy: string) => {
    const lines = [
      `BabyShark - Contrat signe`,
      `Structure : ${state.structure.name}`,
      `Contrat : ${contract.id}`,
      `Enfant : ${contract.childName}`,
      `Parent signataire : ${contract.parentName}`,
      `Contact signataire : ${signedBy}`,
      `Date de debut : ${formatDate(contract.startDate)}`,
      `Cadence : ${contract.scheduleLabel}`,
      `Tarif : ${contract.pricingLabel}`,
      `Statut : signe`,
      `Signe le : ${formatDateTime(signedAtIso)}`,
      `Adresse structure : ${state.structure.address}`,
      `Email structure : ${state.structure.email}`,
      `Telephone structure : ${state.structure.phone}`,
      `Document genere automatiquement depuis le cockpit Signature.`,
    ];

    return buildSimplePdfBlob(lines);
  };

  const generateAndUploadSignedContractPdf = async (contract: EnrichedContract, signedAtIso: string, signedBy: string) => {
    if (!supabase) {
      throw new Error("Supabase non configuré");
    }

    const tenantId = await getTenantId();
    const pdfBlob = buildSignedContractPdf(contract, signedAtIso, signedBy);
    const safeChildName = slugify(contract.childName || "contrat");
    const storagePath = `${tenantId ?? "tenant"}/contract/${contract.id}/contrat-signe-${safeChildName}.pdf`;

    const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(storagePath, pdfBlob, {
      upsert: true,
      contentType: "application/pdf",
      cacheControl: "3600",
    });

    if (uploadError) {
      throw uploadError;
    }

    if (tenantId) {
      const { error: docError } = await supabase.from("documents").insert({
        tenant_id: tenantId,
        entity_type: "contract",
        entity_id: contract.id,
        document_type: "contract",
        title: `Contrat signé - ${contract.childName}`,
        file_path: storagePath,
        status: "active",
        metadata: {
          signed_at: signedAtIso,
          signed_by: signedBy,
          mime_type: "application/pdf",
          generated_by: "signature-page",
        },
      });

      if (docError) {
        console.warn("Document row insert failed", docError);
      }
    }

    return storagePath;
  };

  const openSignedDocument = async (contract: EnrichedContract) => {
    setSelectedId(contract.id);
    setFeedback(null);

    const directPath = contract.signedDocumentUrl;
    if (!directPath) {
      setFeedback({
        type: "error",
        message: "Aucun PDF signé n'est encore stocké pour ce contrat.",
      });
      return;
    }

    if (!supabase) {
      window.open(directPath, "_blank", "noopener,noreferrer");
      return;
    }

    setBusyById((current) => ({ ...current, [contract.id]: true }));

    try {
      if (/^https?:\/\//i.test(directPath)) {
        window.open(directPath, "_blank", "noopener,noreferrer");
      } else {
        const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(directPath, 60 * 30);
        if (error) throw error;
        if (!data?.signedUrl) throw new Error("URL signée introuvable");
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Open signed PDF failed", error);
      setFeedback({
        type: "error",
        message: "Impossible d'ouvrir le PDF signé. Vérifie le bucket documents et le chemin stocké.",
      });
    } finally {
      setBusyById((current) => ({ ...current, [contract.id]: false }));
    }
  };

  const persistSignatureStatus = async (contract: EnrichedContract, nextStatus: UiSignatureStatus) => {
    setSelectedId(contract.id);
    setFeedback(null);

    if (!isSupabaseConfigured || !supabase) {
      const localSignedAt = nextStatus === "signed" ? new Date().toISOString() : undefined;
      const localSignedBy = nextStatus === "signed" ? contract.parentEmail : undefined;

      updateWorkflow(contract.id, {
        status: nextStatus,
        sentAt: nextStatus === "pending" || nextStatus === "signed" ? new Date().toISOString() : undefined,
      });
      setFeedback({
        type: "success",
        message:
          nextStatus === "signed"
            ? `Mode local : statut signé simulé. Aucun PDF distant n'a été archivé pour ${localSignedBy} le ${formatDateTime(localSignedAt)}.`
            : "Mode local : le statut a été mis à jour dans l'application, sans persistance distante.",
      });
      return;
    }

    setBusyById((current) => ({ ...current, [contract.id]: true }));

    try {
      const nowIso = new Date().toISOString();

      if (nextStatus === "signed") {
        const signedBy = contract.parentEmail || contract.parentName || "signataire inconnu";
        const signedDocumentUrl =
          contract.signedDocumentUrl || (await generateAndUploadSignedContractPdf(contract, nowIso, signedBy));

        const { error } = await supabase
          .from("contracts")
          .update({
            signature_status: "signed",
            status: "active",
            signature_signed_at: nowIso,
            signed_by: signedBy,
            signed_document_url: signedDocumentUrl,
          })
          .eq("id", contract.id);

        if (error) throw error;

        updateWorkflow(contract.id, {
          status: "signed",
          sentAt: contract.workflow.sentAt ?? nowIso,
        });

        await refresh();

        setFeedback({
          type: "success",
          message: "Le contrat a été signé, horodaté, attribué à son signataire et archivé en PDF.",
        });
        return;
      }

      const { error } = await supabase
        .from("contracts")
        .update({
          signature_status: "pending",
          status: "ready_for_signature",
        })
        .eq("id", contract.id);

      if (error) throw error;

      updateWorkflow(contract.id, {
        status: "pending",
        sentAt: nowIso,
      });

      await refresh();

      setFeedback({
        type: "success",
        message: "Le contrat a bien été marqué comme envoyé à signer dans Supabase.",
      });
    } catch (error) {
      console.error("Signature workflow update failed", error);
      setFeedback({
        type: "error",
        message: "La mise à jour Signature a échoué. Vérifie la colonne signed_document_url et le bucket documents.",
      });
    } finally {
      setBusyById((current) => ({ ...current, [contract.id]: false }));
    }
  };

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Signature"
          subtitle="Ici, on pilote réellement l’envoi, la relance, la signature et l’archivage PDF des contrats."
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
          {[
            ["Contrats à envoyer", notStartedCount, "Ceux qui ne sont encore partis nulle part."],
            ["En attente de signature", pendingCount, "Contrats envoyés mais pas encore conclus."],
            ["Contrats signés", signedCount, "Dossiers effectivement sécurisés."],
            ["Taux de signature", `${signatureRate}%`, "Mesure réelle du closing administratif."],
          ].map(([label, value, hint]) => (
            <Card key={label as string} className="rounded-2xl shadow-soft">
              <CardContent className="p-5 space-y-2">
                <p className="text-sm text-muted-foreground">{label as string}</p>
                <p className="text-3xl font-display font-bold">{value as string | number}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{hint as string}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid xl:grid-cols-[1.35fr_0.9fr] gap-6 items-start">
          <div className="space-y-4">
            {contracts.map((contract) => {
              const meta = getStatusMeta(contract.workflow.status);
              const canSend = contract.workflow.status === "not_started";
              const canRemind = contract.workflow.status === "pending";
              const canMarkSigned = contract.workflow.status === "pending";
              const canViewSignedPdf = contract.workflow.status === "signed" && Boolean(contract.signedDocumentUrl);
              const isBusy = busyById[contract.id] === true;

              return (
                <Card
                  key={contract.id}
                  className={`rounded-2xl shadow-soft border transition ${selectedId === contract.id ? meta.panelClass : ""}`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-lg leading-tight">{contract.childName}</p>
                          <Badge className={`rounded-full ${meta.badgeClass}`}>{meta.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Parent signataire : {contract.parentName}</p>
                        <p className="text-sm text-muted-foreground">
                          Démarrage contrat : {formatDate(contract.startDate)} · {contract.scheduleLabel} · {contract.pricingLabel}
                        </p>
                        <p className="text-xs text-muted-foreground">Référence dossier : {contract.id}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <Button variant="outline" className="rounded-xl" onClick={() => setSelectedId(contract.id)}>
                          Voir le dossier
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          disabled={!canViewSignedPdf || isBusy}
                          onClick={() => {
                            void openSignedDocument(contract);
                          }}
                        >
                          Voir contrat signé
                        </Button>
                        <Button
                          className="rounded-xl"
                          variant={canSend ? "default" : "secondary"}
                          disabled={!canSend || isBusy}
                          onClick={() => {
                            void persistSignatureStatus(contract, "pending");
                          }}
                        >
                          {isBusy && canSend ? "Envoi..." : "Envoyer à signer"}
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-xl"
                          disabled={!canRemind || isBusy}
                          onClick={() => {
                            setSelectedId(contract.id);
                            updateWorkflow(contract.id, {
                              reminderCount: (workflow[contract.id]?.reminderCount ?? 0) + 1,
                            });
                            setFeedback({
                              type: "success",
                              message: "Relance enregistrée côté interface. Si tu veux une vraie traçabilité, il faudra aussi persister les relances en base.",
                            });
                          }}
                        >
                          Relancer
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          disabled={!canMarkSigned || isBusy}
                          onClick={() => {
                            void persistSignatureStatus(contract, "signed");
                          }}
                        >
                          {isBusy && canMarkSigned ? "Signature + PDF..." : "Marquer signé"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-5 gap-3 text-sm">
                      <div className="rounded-2xl border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Envoi</p>
                        <p className="font-medium mt-1">
                          {contract.workflow.sentAt ? `Envoyé le ${formatDate(contract.workflow.sentAt)}` : "Pas encore envoyé"}
                        </p>
                      </div>
                      <div className="rounded-2xl border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Relances</p>
                        <p className="font-medium mt-1">{contract.workflow.reminderCount} relance(s)</p>
                      </div>
                      <div className="rounded-2xl border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Signé le</p>
                        <p className="font-medium mt-1">{formatDateTime(contract.signatureSignedAt)}</p>
                      </div>
                      <div className="rounded-2xl border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Signé par</p>
                        <p className="font-medium mt-1 break-all">{contract.signedBy || "—"}</p>
                      </div>
                      <div className="rounded-2xl border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Action attendue</p>
                        <p className="font-medium mt-1">
                          {contract.workflow.status === "signed"
                            ? "Dossier sécurisé + PDF archivé"
                            : contract.workflow.status === "pending"
                              ? "Signature parent attendue"
                              : "Envoi initial à déclencher"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="rounded-2xl shadow-soft sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Lecture métier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedContract ? (
                <>
                  <div className="rounded-2xl border bg-muted/20 p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-lg">{selectedContract.childName}</p>
                      <Badge className={`rounded-full ${getStatusMeta(selectedContract.workflow.status).badgeClass}`}>
                        {getStatusMeta(selectedContract.workflow.status).label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Parent signataire : {selectedContract.parentName}</p>
                    <p className="text-sm text-muted-foreground">Contact : {selectedContract.parentEmail}</p>
                    <p className="text-sm text-muted-foreground">Début prévu : {formatDate(selectedContract.startDate)}</p>
                    <p className="text-sm text-muted-foreground">Cadence : {selectedContract.scheduleLabel}</p>
                    <p className="text-sm text-muted-foreground">Tarif : {selectedContract.pricingLabel}</p>
                    <p className="text-sm text-muted-foreground">Signé le : {formatDateTime(selectedContract.signatureSignedAt)}</p>
                    <p className="text-sm text-muted-foreground break-all">Signé par : {selectedContract.signedBy || "—"}</p>
                    <p className="text-sm text-muted-foreground break-all">
                      PDF archivé : {selectedContract.signedDocumentUrl ? "oui" : "non"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 leading-relaxed">
                    Le faux suivi est terminé. Ici, un contrat signé doit aussi produire une preuve consultable. Sans PDF archivé, ton statut "signé" reste une promesse.
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="rounded-2xl border p-4">
                      <p className="font-medium">Étape actuelle</p>
                      <p className="text-muted-foreground mt-1">
                        {selectedContract.workflow.status === "not_started" &&
                          "Le contrat existe, mais personne ne l’a encore envoyé. Le dossier peut dormir sans que personne ne s’en rende compte."}
                        {selectedContract.workflow.status === "pending" &&
                          "Le parent a quelque chose à signer. Le prochain levier, ce n’est pas un nouveau champ, c’est la relance jusqu’à clôture."}
                        {selectedContract.workflow.status === "signed" &&
                          "Le contrat est sécurisé au minimum : statut, horodatage, signataire et PDF archivé. Le prochain levier, c’est l’export propre et la preuve exploitable."}
                      </p>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <p className="font-medium">Ce que cette page doit piloter</p>
                      <ul className="mt-2 space-y-2 text-muted-foreground list-disc pl-4">
                        <li>le stock de contrats jamais envoyés,</li>
                        <li>les contrats en attente qui stagnent,</li>
                        <li>la preuve consultable qu’un dossier est bien signé.</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Aucun contrat disponible pour le suivi signature.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </BackOfficeLayout>
  );
}
