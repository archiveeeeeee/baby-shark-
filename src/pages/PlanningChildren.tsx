import { useEffect, useMemo, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useChildrenWithRelations } from "@/context/AppDataContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type ScheduleStatus = "planned" | "absent" | "cancelled";

type ChildScheduleRow = {
  id: string;
  tenant_id: string;
  child_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: ScheduleStatus;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type FormState = {
  childId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  notes: string;
};

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;
const STATUS_LABEL: Record<ScheduleStatus, string> = {
  planned: "Planifié",
  absent: "Absent",
  cancelled: "Annulé",
};

const emptyForm: FormState = {
  childId: "",
  date: "",
  startTime: "08:00",
  endTime: "17:00",
  status: "planned",
  notes: "",
};

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatHeaderDate(date: Date) {
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

async function getTenantId() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export default function PlanningChildren() {
  const children = useChildrenWithRelations();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [schedules, setSchedules] = useState<ChildScheduleRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const weekDays = useMemo(
    () => DAYS.map((label, index) => ({ label, date: addDays(weekStart, index) })),
    [weekStart],
  );

  async function loadSchedules() {
    if (!isSupabaseConfigured || !supabase) {
      setSchedules([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const tenantId = await getTenantId();
      const from = toInputDate(weekStart);
      const to = toInputDate(addDays(weekStart, 4));

      let query = supabase
        .from("child_schedules")
        .select("*")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setSchedules((data as ChildScheduleRow[]) ?? []);
    } catch (err: any) {
      setError(err?.message || "Impossible de charger le planning enfants.");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedules();
  }, [weekStart]);

  useEffect(() => {
    if (!form.childId && children.length > 0) {
      setForm((current) => ({
        ...current,
        childId: children[0].id,
        date: current.date || toInputDate(weekStart),
      }));
    }
  }, [children, weekStart, form.childId]);

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      childId: children[0]?.id || "",
      date: toInputDate(weekStart),
    });
    setError("");
  }

  async function handleSubmit() {
    if (!supabase) return;
    if (!form.childId || !form.date || !form.startTime || !form.endTime) {
      setError("Tous les champs planning sont obligatoires.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const tenantId = await getTenantId();
      if (!tenantId) throw new Error("tenant_id introuvable pour le planning enfants.");

      const payload = {
        tenant_id: tenantId,
        child_id: form.childId,
        date: form.date,
        start_time: form.startTime,
        end_time: form.endTime,
        status: form.status,
        notes: form.notes || null,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("child_schedules")
          .update(payload)
          .eq("id", editingId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("child_schedules").insert(payload);
        if (insertError) throw insertError;
      }

      await loadSchedules();
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Impossible d'enregistrer le planning.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(row: ChildScheduleRow) {
    setEditingId(row.id);
    setForm({
      childId: row.child_id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      notes: row.notes || "",
    });
    setError("");
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    const ok = window.confirm("Supprimer cette présence du planning enfants ?");
    if (!ok) return;

    setLoading(true);
    setError("");
    try {
      const { error: deleteError } = await supabase.from("child_schedules").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await loadSchedules();
      if (editingId === id) resetForm();
    } catch (err: any) {
      setError(err?.message || "Impossible de supprimer cette présence.");
    } finally {
      setLoading(false);
    }
  }

  function entriesForDate(date: Date) {
    const key = toInputDate(date);
    return schedules.filter((item) => item.date === key);
  }

  function childLabel(childId: string) {
    const child = children.find((item) => item.id === childId);
    return child ? `${child.firstName} ${child.lastName}` : "Enfant introuvable";
  }

  function childGroup(childId: string) {
    const child = children.find((item) => item.id === childId);
    return child?.group?.name || "Sans groupe";
  }

  function childPhoto(childId: string) {
    const child = children.find((item) => item.id === childId);
    return child?.photo || "";
  }

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Planning enfants"
          subtitle="Création, modification et suivi des présences planifiées par jour."
        />

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>{editingId ? "Modifier une présence" : "Ajouter une présence"}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setWeekStart((current) => addDays(current, -7))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Semaine précédente
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setWeekStart(startOfWeek(new Date()))}
              >
                Cette semaine
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setWeekStart((current) => addDays(current, 7))}
              >
                Semaine suivante
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Semaine du {formatHeaderDate(weekStart)} au {formatHeaderDate(addDays(weekStart, 4))}
            </p>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Enfant</Label>
                <Select
                  value={form.childId}
                  onValueChange={(value) => setForm((current) => ({ ...current, childId: value }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choisir un enfant" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={form.date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: ScheduleStatus) =>
                    setForm((current) => ({ ...current, status: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planifié</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Heure début</Label>
                <Input
                  type="time"
                  className="rounded-xl"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, startTime: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Heure fin</Label>
                <Input
                  type="time"
                  className="rounded-xl"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endTime: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                className="rounded-2xl min-h-[100px]"
                placeholder="Informations utiles pour cette présence"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex items-center gap-3">
              <Button className="rounded-xl" onClick={handleSubmit} disabled={loading}>
                {editingId ? "Enregistrer la modification" : "Ajouter au planning"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" className="rounded-xl" onClick={resetForm}>
                  Annuler l'édition
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {weekDays.map(({ label, date }) => {
          const entries = entriesForDate(date);

          return (
            <Card key={label} className="rounded-2xl shadow-soft">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-semibold">{label}</h2>
                    <p className="text-sm text-muted-foreground">{formatHeaderDate(date)}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {entries.length} présence{entries.length > 1 ? "s" : ""} planifiée{entries.length > 1 ? "s" : ""}
                  </span>
                </div>

                {loading && !entries.length ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : null}

                {!entries.length ? (
                  <div className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                    Aucune présence enregistrée pour ce jour.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-border/40 p-3 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {childPhoto(entry.child_id) ? (
                              <img
                                src={childPhoto(entry.child_id)}
                                alt={childLabel(entry.child_id)}
                                className="h-11 w-11 rounded-2xl object-cover"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <p className="font-medium truncate">{childLabel(entry.child_id)}</p>
                              <p className="text-sm text-muted-foreground">{childGroup(entry.child_id)}</p>
                            </div>
                          </div>
                          <Badge className="rounded-full border-0 bg-primary/10 text-primary">
                            {STATUS_LABEL[entry.status]}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs rounded-full px-2.5 py-1 bg-primary/10 text-primary">
                            {entry.start_time}–{entry.end_time}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="rounded-xl"
                              onClick={() => startEdit(entry)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="rounded-xl"
                              onClick={() => void handleDelete(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {entry.notes ? (
                          <p className="text-sm text-muted-foreground">{entry.notes}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </BackOfficeLayout>
  );
}
