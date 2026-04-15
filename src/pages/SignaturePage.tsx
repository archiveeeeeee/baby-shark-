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
  signedAt?: string | null;
  signedBy?: string | null;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
            signedAt: contract.signatureSignedAt ?? current[contract.id]?.signedAt ?? null,
            signedBy: contract.signedBy ?? current[contract.id]?.signedBy ?? null,
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

  const contracts = useMemo(
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
          signedAt: contract.signatureSignedAt ?? null,
          signedBy: contract.signedBy ?? null,
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
        ...(current[contractId] ?? { status: "not_started", reminderCount: 0, signedAt: null, signedBy: null }),
        ...next,
      },
    }));
  };

  const persistSignatureStatus = async (contractId: string, nextStatus: UiSignatureStatus, signerEmail?: string) => {
    setSelectedId(contractId);
    setFeedback(null);

    if (!isSupabaseConfigured || !supabase) {
      const nowIso = new Date().toISOString();
      updateWorkflow(contractId, {
        status: nextStatus,
        sentAt: nextStatus === "pending" || nextStatus === "signed" ? nowIso : undefined,
        signedAt: nextStatus === "signed" ? nowIso : null,
        signedBy: nextStatus === "signed" ? signerEmail ?? null : null,
      });
      setFeedback({
        type: "success",
        message: "Mode local : le statut a été mis à jour dans l'application, sans persistance distante.",
      });
      return;
    }

    setBusyById((current) => ({ ...current, [contractId]: true }));

    try {
      const nowIso = new Date().toISOString();
      const payload =
        nextStatus === "signed"
          ? {
              signature_status: "signed",
              status: "active",
              signature_signed_at: nowIso,
              signed_by: signerEmail ?? null,
            }
          : {
              signature_status: "pending",
              status: "ready_for_signature",
            };

      const { error } = await supabase.from("contracts").update(payload).eq("id", contractId);

      if (error) {
        throw error;
      }

      const nowIso = new Date().toISOString();
      updateWorkflow(contractId, {
        status: nextStatus,
        sentAt: nextStatus === "pending" || nextStatus === "signed" ? nowIso : undefined,
        signedAt: nextStatus === "signed" ? nowIso : null,
        signedBy: nextStatus === "signed" ? signerEmail ?? null : null,
      });

      await refresh();

      setFeedback({
        type: "success",
        message:
          nextStatus === "signed"
            ? "Le contrat a bien été marqué signé dans Supabase. Après refresh, il reste signé."
            : "Le contrat a bien été marqué comme envoyé à signer dans Supabase.",
      });
    } catch (error) {
      console.error("Signature workflow update failed", error);
      setFeedback({
        type: "error",
        message: "La mise à jour Supabase a échoué. Le statut n'a pas été persisté.",
      });
    } finally {
      setBusyById((current) => ({ ...current, [contractId]: false }));
    }
  };

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Signature"
          subtitle="Ici, on pilote réellement l’envoi, la relance et le suivi des contrats à signer. Le branchement prestataire viendra plus tard, mais l’écran doit déjà servir au métier."
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
                          className="rounded-xl"
                          variant={canSend ? "default" : "secondary"}
                          disabled={!canSend || isBusy}
                          onClick={() => {
                            void persistSignatureStatus(contract.id, "pending", contract.parentEmail);
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
                            void persistSignatureStatus(contract.id, "signed", contract.parentEmail);
                          }}
                        >
                          {isBusy && canMarkSigned ? "Enregistrement..." : "Marquer signé"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3 text-sm">
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
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Action attendue</p>
                        <p className="font-medium mt-1">
                          {contract.workflow.status === "signed"
                            ? "Dossier sécurisé"
                            : contract.workflow.status === "pending"
                              ? "Signature parent attendue"
                              : "Envoi initial à déclencher"}
                        </p>
                        {contract.workflow.status === "signed" ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Signé le {formatDate(contract.workflow.signedAt ?? undefined)}
                            {contract.workflow.signedBy ? ` · par ${contract.workflow.signedBy}` : ""}
                          </p>
                        ) : null}
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
                    {selectedContract.workflow.status === "signed" ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Signé le : {formatDate(selectedContract.workflow.signedAt ?? undefined)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Signé par : {selectedContract.workflow.signedBy ?? "Non renseigné"}
                        </p>
                      </>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 leading-relaxed">
                    Le vrai risque ici, ce n’est pas l’absence d’un prestataire e-sign tout de suite. C’est de perdre le suivi humain : qui doit signer, où le contrat en est, et combien de fois tu as relancé.
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
                          "Le contrat est considéré sécurisé côté suivi. L’étape suivante doit naturellement nourrir les exports, la facturation et l’archivage documentaire."}
                      </p>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <p className="font-medium">Ce que cette page doit piloter</p>
                      <ul className="mt-2 space-y-2 text-muted-foreground list-disc pl-4">
                        <li>le stock de contrats jamais envoyés,</li>
                        <li>les contrats en attente qui stagnent,</li>
                        <li>la preuve qu’un dossier est bien signé avant d’avancer plus loin.</li>
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
