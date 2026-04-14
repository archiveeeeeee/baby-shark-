import { useEffect, useMemo, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type ShiftStatus = "planned" | "absent" | "cancelled";

type TeamMember = {
  id: string;
  full_name: string;
  title?: string | null;
  role?: string | null;
  visible_in_team_app?: boolean | null;
};

type StaffScheduleRow = {
  id: string;
  user_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: ShiftStatus;
  notes: string | null;
};

const weekDays = [
  { index: 0, label: "Lundi" },
  { index: 1, label: "Mardi" },
  { index: 2, label: "Mercredi" },
  { index: 3, label: "Jeudi" },
  { index: 4, label: "Vendredi" },
  { index: 5, label: "Samedi" },
  { index: 6, label: "Dimanche" },
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

function statusBadgeClass(status: ShiftStatus) {
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

export default function PlanningTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [rows, setRows] = useState<StaffScheduleRow[]>([]);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [mode, setMode] = useState<"day" | "week">("day");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => toISODate(startOfWeek(new Date())));
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [status, setStatus] = useState<ShiftStatus>("planned");
  const [notes, setNotes] = useState("");

  const filteredMembers = useMemo(() => {
    const base = members.filter((member) => member.visible_in_team_app !== false);
    if (selectedRole === "all") return base;
    return base.filter((member) => (member.role || "") === selectedRole);
  }, [members, selectedRole]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, StaffScheduleRow[]>();
    for (const day of weekDays) {
      const dayDate = toISODate(addDays(weekStart, day.index));
      map.set(dayDate, rows.filter((row) => row.date === dayDate));
    }
    return map;
  }, [rows, weekStart]);

  const roles = useMemo(() => {
    return Array.from(new Set(members.map((member) => member.role).filter(Boolean))) as string[];
  }, [members]);

  useEffect(() => {
    if (!filteredMembers.length) {
      setSelectedUserIds([]);
      return;
    }

    setSelectedUserIds((current) =>
      current.filter((id) => filteredMembers.some((member) => member.id === id)),
    );
  }, [filteredMembers]);

  useEffect(() => {
    void loadPlanning();
  }, [weekStart]);

  async function loadPlanning() {
    if (!isSupabaseConfigured || !supabase) {
      setMembers([]);
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const start = toISODate(weekStart);
      const end = toISODate(addDays(weekStart, 6));

      const [{ data: usersData, error: usersError }, { data: schedulesData, error: schedulesError }] =
        await Promise.all([
          supabase
            .from("user_profiles")
            .select("id, full_name, title, role, visible_in_team_app")
            .order("full_name"),
          supabase
            .from("staff_schedules")
            .select("*")
            .gte("date", start)
            .lte("date", end)
            .order("date")
            .order("start_time"),
        ]);

      if (usersError) throw usersError;
      if (schedulesError) throw schedulesError;

      setMembers((usersData ?? []) as TeamMember[]);
      setRows((schedulesData ?? []) as StaffScheduleRow[]);
    } catch (error: any) {
      console.error("Planning team load failed", error);
      setErrorMessage(error?.message || "Chargement du planning équipe impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function applyBulkPlan() {
    if (!supabase || !isSupabaseConfigured) return;
    if (!selectedUserIds.length) {
      setErrorMessage("Sélectionne au moins un membre de l’équipe.");
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
          : selectedWeekDays.map((dayIndex) => toISODate(addDays(weekStart, dayIndex)));

      const payload = selectedUserIds.flatMap((userId) =>
        dates.map((date) => ({
          tenant_id: tenantId,
          user_id: userId,
          date,
          start_time: startTime,
          end_time: endTime,
          status,
          notes: notes || null,
        })),
      );

      const { error } = await supabase
        .from("staff_schedules")
        .upsert(payload, { onConflict: "tenant_id,user_id,date" });

      if (error) throw error;
      await loadPlanning();
    } catch (error: any) {
      console.error("Bulk team schedule failed", error);
      setErrorMessage(error?.message || "Impossible de planifier la sélection.");
    } finally {
      setSaving(false);
    }
  }

  async function updateRow(
    rowId: string,
    updates: Partial<Pick<StaffScheduleRow, "start_time" | "end_time" | "status" | "notes">>,
  ) {
    if (!supabase) return;

    try {
      const { error } = await supabase.from("staff_schedules").update(updates).eq("id", rowId);
      if (error) throw error;
      await loadPlanning();
    } catch (error: any) {
      console.error("Team schedule update failed", error);
      setErrorMessage(error?.message || "Modification impossible.");
    }
  }

  async function deleteRow(rowId: string) {
    if (!supabase) return;

    try {
      const { error } = await supabase.from("staff_schedules").delete().eq("id", rowId);
      if (error) throw error;
      await loadPlanning();
    } catch (error: any) {
      console.error("Team schedule delete failed", error);
      setErrorMessage(error?.message || "Suppression impossible.");
    }
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  function toggleWeekDay(dayIndex: number) {
    setSelectedWeekDays((current) =>
      current.includes(dayIndex)
        ? current.filter((index) => index !== dayIndex)
        : [...current, dayIndex],
    );
  }

  function selectAllFilteredUsers() {
    setSelectedUserIds(filteredMembers.map((member) => member.id));
  }

  function clearSelectedUsers() {
    setSelectedUserIds([]);
  }

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Planning équipe"
          subtitle="Planification en masse par jour ou par semaine, avec édition et suppression."
        />

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Planification équipe en masse</CardTitle>
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
                <label className="text-sm text-muted-foreground mb-1 block">Rôle</label>
                <select
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="all">Toute l’équipe</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Heure de début</label>
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
                  onChange={(e) => setStatus(e.target.value as ShiftStatus)}
                >
                  <option value="planned">Prévu</option>
                  <option value="absent">Absent</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Jour ciblé</label>
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
                <label className="text-sm text-muted-foreground mb-2 block">Jours à planifier</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => {
                    const active = selectedWeekDays.includes(day.index);
                    return (
                      <button
                        key={day.index}
                        type="button"
                        onClick={() => toggleWeekDay(day.index)}
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
                  Équipe sélectionnée ({selectedUserIds.length})
                </label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={selectAllFilteredUsers}>
                    Tout sélectionner
                  </Button>
                  <Button type="button" variant="outline" className="rounded-xl" onClick={clearSelectedUsers}>
                    Tout vider
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredMembers.map((member) => {
                  const active = selectedUserIds.includes(member.id);
                  return (
                    <button
                      type="button"
                      key={member.id}
                      onClick={() => toggleUser(member.id)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        active ? "border-primary bg-primary/5" : "border-border/40 bg-background"
                      }`}
                    >
                      <p className="font-medium truncate">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.title || member.role || "Équipe"}
                      </p>
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
          const dayDate = toISODate(addDays(weekStart, day.index));
          const dayRows = groupedByDay.get(dayDate) ?? [];

          return (
            <Card key={day.index} className="rounded-2xl shadow-soft">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display font-semibold">{day.label}</h2>
                    <p className="text-sm text-muted-foreground">{formatShortDate(addDays(weekStart, day.index))}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dayRows.length} shift{dayRows.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {dayRows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
                      Aucun shift planifié.
                    </div>
                  ) : (
                    dayRows.map((row) => {
                      const member = members.find((item) => item.id === row.user_id);
                      if (!member) return null;

                      return (
                        <div key={row.id} className="rounded-2xl border border-border/40 p-3 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{member.full_name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {member.title || member.role || "Équipe"}
                              </p>
                            </div>
                            <Badge className={statusBadgeClass(row.status)}>{row.status}</Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="time"
                              value={row.start_time || ""}
                              onChange={(e) =>
                                void updateRow(row.id, { start_time: e.target.value || null })
                              }
                            />
                            <Input
                              type="time"
                              value={row.end_time || ""}
                              onChange={(e) =>
                                void updateRow(row.id, { end_time: e.target.value || null })
                              }
                            />
                          </div>

                          <select
                            className="w-full border rounded-lg p-2 text-sm bg-background"
                            value={row.status}
                            onChange={(e) =>
                              void updateRow(row.id, { status: e.target.value as ShiftStatus })
                            }
                          >
                            <option value="planned">Prévu</option>
                            <option value="absent">Absent</option>
                            <option value="cancelled">Annulé</option>
                          </select>

                          <Textarea
                            value={row.notes || ""}
                            placeholder="Notes"
                            onChange={(e) => void updateRow(row.id, { notes: e.target.value || null })}
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

        {loading ? <div className="text-sm text-muted-foreground">Chargement du planning...</div> : null}
      </div>
    </BackOfficeLayout>
  );
}
