import { useState } from "react";
import { toast } from "sonner";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppData } from "@/context/AppDataContext";

export default function PreRegistrations() {
  const {
    state,
    addPreRegistration,
    updatePreRegistrationStatus,
    storageMode,
  } = useAppData();

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    childName: "",
    parentName: "",
    email: "",
    phone: "",
    requestedStartDate: "",
    requestedRhythm: "",
    source: "backoffice" as const,
    notes: "",
    tags: "",
  });

  async function handleCreatePreRegistration() {
    if (!form.childName || !form.parentName || !form.email) {
      toast.error("Nom enfant, nom parent et email sont obligatoires.");
      return;
    }

    if (storageMode !== "supabase") {
      toast.error(
        "Supabase n'est pas connecté sur cet environnement. Aucune pré-inscription réelle ne sera enregistrée tant que les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY ne sont pas configurées en production."
      );
      return;
    }

    setSubmitting(true);

    try {
      await addPreRegistration({
        childName: form.childName,
        parentName: form.parentName,
        email: form.email,
        phone: form.phone,
        requestedStartDate: form.requestedStartDate,
        requestedRhythm: form.requestedRhythm,
        source: form.source,
        notes: form.notes,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      setForm({
        childName: "",
        parentName: "",
        email: "",
        phone: "",
        requestedStartDate: "",
        requestedRhythm: "",
        source: "backoffice",
        notes: "",
        tags: "",
      });

      toast.success("Pré-inscription enregistrée dans Supabase.");
    } catch (error) {
      console.error("BabyShark pre-registration create failed", error);
      toast.error(
        "Échec de l'enregistrement Supabase. Vérifie la console et la configuration du projet."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Pré-inscriptions"
          subtitle="Capture commerciale structurée depuis le site vitrine et le back-office."
        />

        <Alert className="border-warning/30 bg-warning/5">
          <AlertTitle>Diagnostic runtime</AlertTitle>
          <AlertDescription>
            storageMode actuel : <strong>{storageMode}</strong>
          </AlertDescription>
        </Alert>

        {storageMode !== "supabase" && (
          <Alert className="border-destructive/30 bg-destructive/5 text-destructive">
            <AlertTitle>Mode local détecté</AlertTitle>
            <AlertDescription>
              Cette page n'écrit rien en base tant que Supabase n'est pas
              configuré sur l'environnement courant. Les cartes affichées ici
              peuvent être purement locales et ne prouvent aucune création
              réelle en base.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle>Nouvelle pré-inscription</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Input
                placeholder="Nom enfant"
                value={form.childName}
                onChange={(e) =>
                  setForm({ ...form, childName: e.target.value })
                }
              />

              <Input
                placeholder="Nom parent"
                value={form.parentName}
                onChange={(e) =>
                  setForm({ ...form, parentName: e.target.value })
                }
              />

              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <Input
                placeholder="Téléphone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <Input
                type="date"
                value={form.requestedStartDate}
                onChange={(e) =>
                  setForm({ ...form, requestedStartDate: e.target.value })
                }
              />

              <Input
                placeholder="Rythme souhaité"
                value={form.requestedRhythm}
                onChange={(e) =>
                  setForm({ ...form, requestedRhythm: e.target.value })
                }
              />

              <Input
                placeholder="Tags séparés par virgule"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />

              <Textarea
                placeholder="Notes internes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />

              <Button
                className="w-full rounded-xl"
                disabled={submitting}
                onClick={handleCreatePreRegistration}
              >
                {submitting ? "Enregistrement..." : "Créer le dossier"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {state.preregistrations.map((item) => (
              <Card key={item.id} className="rounded-2xl shadow-soft">
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold text-lg">
                        {item.childName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.parentName} · {item.email}
                      </p>
                    </div>

                    <Badge className="rounded-full border-0 bg-primary/10 text-primary">
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="rounded-full"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Début souhaité : {item.requestedStartDate || "—"} · Rythme :{" "}
                    {item.requestedRhythm || "—"}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() =>
                        updatePreRegistrationStatus(item.id, "qualified")
                      }
                    >
                      Qualifier
                    </Button>

                    <Button
                      size="sm"
                      className="rounded-xl"
                      onClick={() =>
                        updatePreRegistrationStatus(item.id, "accepted")
                      }
                    >
                      Accepter
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-xl"
                      onClick={() =>
                        updatePreRegistrationStatus(item.id, "rejected")
                      }
                    >
                      Refuser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </BackOfficeLayout>
  );
}