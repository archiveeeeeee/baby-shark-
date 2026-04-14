import { useEffect, useMemo, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useChildrenWithRelations } from "@/context/AppDataContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type ScheduleStatus = "planned" | "absent" | "cancelled";

type ChildScheduleRow = {
  id: string;
  child_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: ScheduleStatus;
  notes: string | null;
  tenant_id?: string | null;
};

const weekDays = [
  { key: 1, label: "Lundi" },
  { key: 2, label: "Mardi" },
  { key: 3, label: "Mercredi" },
  { key: 4, label: "Jeudi" },
  { key: 5, label: "Vendredi" },
];

function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(input: Date) {
  const date = new Date(input);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(input: Date, days: number) {
  const date = new Date(input);
  date.setDate(date.getDate() + days);
  return date;
}

function formatShortDate(input: Date) {
  return input.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
  });
}

function statusBadgeClass(status: ScheduleStatus) {
  if (status === "absent") return "bg-amber-100 text-amber-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-emerald-100 text-emerald-700";
}

async function getTenantId() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export default function PlanningChildren() {
  const children = useChildrenWithRelations();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [rows, setRows] = useState<ChildScheduleRow[]>([]);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [mode, setMode] = useState<"day" | "week">("day");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => toISODate(startOfWeek(new Date())));
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [status, setStatus] = useState<ScheduleStatus>("planned");
  const [notes, setNotes] = useState("");

  const filteredChildren = useMemo(() => {
    if (selectedGroupId === "all") return children;
    return children.filter((child) => child.group?.id === selectedGroupId);
  }, [children, selectedGroupId]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, ChildScheduleRow[]>();
    for (const day of weekDays) {
      const dayDate = toISODate(addDays(weekStart, day.key - 1));
      map.set(dayDate, rows.filter((row) => row.date === dayDate));
    }
    return map;
  }, [rows, weekStart]);

  useEffect(() => {
    if (!filteredChildren.length) {
      setSelectedChildIds([]);
      return;
    }

    setSelectedChildIds((current) =>
      current.filter((id) => filteredChildren.some((child) => child.id === id)),
    );
  }, [filteredChildren]);

  useEffect(() => {
    void loadSchedules();
  }, [weekStart]);

  async function loadSchedules() {
    if (!isSupabaseConfigured || !supabase) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const start = toISODate(weekStart);
      const end = toISODate(addDays(weekStart, 4));

      const { data, error } = await supabase
        .from("child_schedules")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date")
        .order("start_time");

      if (error) throw error;
      setRows((data ?? []) as ChildScheduleRow[]);
    } catch (error: any) {
      console.error("Planning children load failed", error);
      setErrorMessage(error?.message || "Chargement du planning impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function applyBulkPlan() {
    if (!supabase || !isSupabaseConfigured) return;
    if (!selectedChildIds.length) {
      setErrorMessage("Sélectionne au moins un enfant.");
      return;
    }
    if (!startTime || !endTime) {
      setErrorMessage("Renseigne une heure de début et de fin.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const tenantId = await getTenantId();
      if (!tenantId) throw new Error("tenant_id introuvable.");

      const dates =
        mode === "day"
          ? [selectedDate]
          : selectedWeekDays.map((dayKey) => toISODate(addDays(weekStart, dayKey - 1)));

      const payload = selectedChildIds.flatMap((childId) =>
        dates.map((date) => ({
          tenant_id: tenantId,
          child_id: childId,
          date,
          start_time: status === "planned" ? startTime : null,
          end_time: status === "planned" ? endTime : null,
          status,
          notes: notes || null,
        })),
      );

      const { error } = await supabase
        .from("child_schedules")
        .upsert(payload, { onConflict: "tenant_id,child_id,date" });

      if (error) throw error;

      await loadSchedules();
    } catch (error: any) {
      console.error("Bulk schedule failed", error);
      setErrorMessage(error?.message || "Impossible de planifier la sélection.");
    } finally {
      setSaving(false);
    }
  }

  async function updateRow(
    rowId: string,
    updates: Partial<Pick<ChildScheduleRow, "start_time" | "end_time" | "status" | "notes">>,
  ) {
    if (!supabase) return;

    try {
      const { error } = await supabase.from("child_schedules").update(updates).eq("id", rowId);
      if (error) throw error;
      await loadSchedules();
    } catch (error: any) {
      console.error("Schedule update failed", error);
      setErrorMessage(error?.message || "Modification impossible.");
    }
  }

  async function deleteRow(rowId: string) {
    if (!supabase) return;

    try {
      const { error } = await supabase.from("child_schedules").delete().eq("id", rowId);
      if (error) throw error;
      await loadSchedules();
    } catch (error: any) {
      console.error("Schedule delete failed", error);
      setErrorMessage(error?.message || "Suppression impossible.");
    }
  }

  function toggleChild(childId: string) {
    setSelectedChildIds((current) =>
      current.includes(childId) ? current.filter((id) => id !== childId) : [...current, childId],
    );
  }

  function toggleWeekDay(dayKey: number) {
    setSelectedWeekDays((current) =>
      current.includes(dayKey) ? current.filter((key) => key !== dayKey) : [...current, dayKey],
    );
  }

  function selectAllFilteredChildren() {
    setSelectedChildIds(filteredChildren.map((child) => child.id));
  }

  function clearSelectedChildren() {
    setSelectedChildIds([]);
  }

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Planning enfants"
          subtitle="Planification par lot sur une journée ou sur toute la semaine, avec édition et suppression."
        />

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Planification en masse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid lg:grid-cols-4 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Mode</label>
                <select
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "day" | "week")}
                >
                  <option value="day">Jour unique</option>
                  <option value="week">Semaine</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Groupe</label>
                <select
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="all">Tous les groupes</option>
                  {Array.from(
                    new Map(
                      children
                        .filter((child) => child.group)
                        .map((child) => [child.group!.id, child.group!.name]),
                    ).entries(),
                  ).map(([groupId, groupName]) => (
                    <option key={groupId} value={groupId}>
                      {groupName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Heure de début
                </label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Heure de fin</label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Statut</label>
                <select
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
                >
                  <option value="planned">Prévu</option>
                  <option value="absent">Absent</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Jour ciblé
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={mode !== "day"}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Semaine</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setWeekStart((current) => addDays(current, -7))}
                  >
                    Semaine -
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setWeekStart((current) => addDays(current, 7))}
                  >
                    Semaine +
                  </Button>
                </div>
              </div>
            </div>

            {mode === "week" ? (
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Jours à planifier
                </label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => {
                    const active = selectedWeekDays.includes(day.key);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleWeekDay(day.key)}
                        className={`rounded-full px-3 py-1.5 text-sm border ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="text-sm text-muted-foreground block">
                  Enfants sélectionnés ({selectedChildIds.length})
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={selectAllFilteredChildren}
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={clearSelectedChildren}
                  >
                    Tout vider
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredChildren.map((child) => {
                  const active = selectedChildIds.includes(child.id);
                  return (
                    <button
                      type="button"
                      key={child.id}
                      onClick={() => toggleChild(child.id)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border/40 bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={child.photo}
                          alt={child.firstName}
                          className="h-11 w-11 rounded-2xl object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {child.firstName} {child.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {child.group?.name || "Sans groupe"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Notes</label>
              <Textarea
                placeholder="Note facultative pour toute la sélection"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button className="rounded-xl" onClick={applyBulkPlan} disabled={saving || loading}>
              {saving ? "Enregistrement..." : "Planifier la sélection"}
            </Button>
          </CardContent>
        </Card>

        {weekDays.map((day) => {
          const dayDate = toISODate(addDays(weekStart, day.key - 1));
          const dayRows = groupedByDay.get(dayDate) ?? [];

          return (
            <Card key={day.key} className="rounded-2xl shadow-soft">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display font-semibold">{day.label}</h2>
                    <p className="text-sm text-muted-foreground">{formatShortDate(addDays(weekStart, day.key - 1))}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dayRows.length} présence{dayRows.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {dayRows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
                      Aucune présence planifiée.
                    </div>
                  ) : (
                    dayRows.map((row) => {
                      const child = children.find((item) => item.id === row.child_id);
                      if (!child) return null;

                      return (
                        <div
                          key={row.id}
                          className="rounded-2xl border border-border/40 p-3 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={child.photo}
                                alt={child.firstName}
                                className="h-11 w-11 rounded-2xl object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {child.firstName} {child.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {child.group?.name || "Sans groupe"}
                                </p>
                              </div>
                            </div>
                            <Badge className={statusBadgeClass(row.status)}>
                              {row.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="time"
                              value={row.start_time || ""}
                              disabled={row.status !== "planned"}
                              onChange={(e) =>
                                void updateRow(row.id, { start_time: e.target.value || null })
                              }
                            />
                            <Input
                              type="time"
                              value={row.end_time || ""}
                              disabled={row.status !== "planned"}
                              onChange={(e) =>
                                void updateRow(row.id, { end_time: e.target.value || null })
                              }
                            />
                          </div>

                          <select
                            className="w-full border rounded-lg p-2 text-sm bg-background"
                            value={row.status}
                            onChange={(e) =>
                              void updateRow(row.id, {
                                status: e.target.value as ScheduleStatus,
                                start_time:
                                  e.target.value === "planned" ? row.start_time : null,
                                end_time: e.target.value === "planned" ? row.end_time : null,
                              })
                            }
                          >
                            <option value="planned">Prévu</option>
                            <option value="absent">Absent</option>
                            <option value="cancelled">Annulé</option>
                          </select>

                          <Textarea
                            value={row.notes || ""}
                            placeholder="Notes"
                            onChange={(e) =>
                              void updateRow(row.id, { notes: e.target.value || null })
                            }
                          />

                          <Button
                            type="button"
                            variant="outline"
                            className="w-full rounded-xl"
                            onClick={() => void deleteRow(row.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {loading ? (
          <div className="text-sm text-muted-foreground">Chargement du planning...</div>
        ) : null}
      </div>
    </BackOfficeLayout>
  );
}
