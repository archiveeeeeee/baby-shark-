import { useMemo, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppData, useCurrentUser } from "@/context/AppDataContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Role } from "@/types";

type StaffForm = {
  fullName: string;
  email: string;
  role: Role;
  title: string;
  visibleInTeamApp: boolean;
};

const emptyForm: StaffForm = {
  fullName: "",
  email: "",
  role: "team",
  title: "",
  visibleInTeamApp: true,
};

async function getTenantId() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export default function TeamDirectory() {
  const { state, refresh } = useAppData();
  const currentUser = useCurrentUser();

  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");

  const team = useMemo(() => {
    const base = state.users.filter((user) => ["admin", "manager", "team"].includes(user.role));
    if (roleFilter === "all") return base;
    return base.filter((user) => user.role === roleFilter);
  }, [state.users, roleFilter]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(user: (typeof state.users)[number]) {
    setEditingId(user.id);
    setForm({
      fullName: user.name,
      email: user.email,
      role: user.role as Role,
      title: user.title || "",
      visibleInTeamApp: !!user.visibleInTeamApp,
    });
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function saveStaff() {
    if (!supabase || !isSupabaseConfigured) return;

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();

    if (!fullName) {
      setErrorMessage("Le nom est obligatoire.");
      return;
    }
    if (!email) {
      setErrorMessage("L’email est obligatoire.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (editingId) {
        const { error } = await supabase
          .from("user_profiles")
          .update({
            full_name: fullName,
            email,
            role: form.role,
            title: form.title.trim() || null,
            visible_in_team_app: form.visibleInTeamApp,
          })
          .eq("id", editingId);

        if (error) throw error;
        setSuccessMessage("Membre mis à jour.");
      } else {
        const tenantId = await getTenantId();
        if (!tenantId) throw new Error("tenant_id introuvable.");

        const { error } = await supabase.from("user_profiles").insert({
          id: crypto.randomUUID(),
          structure_id: state.structure.id,
          tenant_id: tenantId,
          full_name: fullName,
          email,
          role: form.role,
          title: form.title.trim() || null,
          visible_in_team_app: form.visibleInTeamApp,
        });

        if (error) throw error;
        setSuccessMessage("Membre créé.");
      }

      resetForm();
      await refresh();
    } catch (error: any) {
      console.error("Team RH save failed", error);
      setErrorMessage(error?.message || "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStaff(userId: string) {
    if (!supabase || !isSupabaseConfigured) return;
    if (userId === currentUser.id) {
      setErrorMessage("Tu ne peux pas supprimer le profil actuellement utilisé.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.from("user_profiles").delete().eq("id", userId);
      if (error) throw error;

      if (editingId === userId) resetForm();
      setSuccessMessage("Membre supprimé.");
      await refresh();
    } catch (error: any) {
      console.error("Team RH delete failed", error);
      setErrorMessage(error?.message || "Suppression impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Équipe & RH"
          subtitle="Créer, modifier, masquer terrain ou supprimer les profils staff pour ne plus dépendre des données de démo."
        />

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>{editingId ? "Modifier un membre" : "Ajouter un membre"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}
            {successMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <div className="grid lg:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Nom complet</label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                  placeholder="Ex. Younes El ..."
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="nom@babyshark.be"
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Rôle</label>
                <select
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  value={form.role}
                  onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as Role }))}
                >
                  <option value="admin">admin</option>
                  <option value="manager">manager</option>
                  <option value="team">team</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Fonction</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Ex. Puéricultrice"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Visible terrain</label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((s) => ({ ...s, visibleInTeamApp: !s.visibleInTeamApp }))
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-left ${
                    form.visibleInTeamApp
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  {form.visibleInTeamApp ? "Oui, visible dans l’app terrain" : "Non, caché de l’app terrain"}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="rounded-xl" onClick={saveStaff} disabled={saving}>
                {saving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer le membre"}
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={resetForm}>
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-lg">Annuaire staff</h2>
              <select
                className="border rounded-lg p-2 text-sm bg-background"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "all" | Role)}
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">admin</option>
                <option value="manager">manager</option>
                <option value="team">team</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {team.map((user) => (
                <Card key={user.id} className="rounded-2xl shadow-soft">
                  <CardContent className="p-5 space-y-3">
                    <div className="space-y-1">
                      <p className="font-display font-semibold text-lg">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.title || "Fonction non renseignée"}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Badge className="rounded-full border-0 bg-primary/10 text-primary">
                        {user.role}
                      </Badge>
                      {user.visibleInTeamApp ? (
                        <Badge variant="secondary" className="rounded-full">
                          Visible terrain
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded-full">
                          Caché terrain
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => startEdit(user)}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => void deleteStaff(user.id)}
                        disabled={user.id === currentUser.id}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Crée d’abord tes vrais profils, puis supprime les anciens profils de démo un par un avec le bouton “Supprimer”.
            </p>
          </CardContent>
        </Card>
      </div>
    </BackOfficeLayout>
  );
}
