import { useMemo, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppData, useChildrenWithRelations, useCurrentUser } from "@/context/AppDataContext";
import { dateTimeLabel } from "@/lib/utils-data";

const mealPresets = ["A très bien mangé", "A bien mangé", "A peu mangé", "N'a pas mangé", "Biberon terminé", "Biberon partiel", "Refusé"];
const napPresets = ["Pas de sieste", "Endormi facilement", "Endormi difficilement", "Courte sieste", "Bonne sieste", "Sieste agitée", "Réveil facile", "Réveil difficile"];
const changePresets = ["Couche propre", "Couche urine", "Couche selles", "Change complet", "Passage toilettes", "Accident", "Crème appliquée"];
const healthPresets = ["Température normale", "Température élevée", "Médicament administré", "Incident mineur", "Observation santé", "Poids noté"];

type QuickCategory = "presence" | "meal" | "nap" | "change" | "health" | "activity" | "note";

export default function TeamApp() {
  const { addTransmission } = useAppData();
  const children = useChildrenWithRelations();
  const currentUser = useCurrentUser();
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? "");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDetails, setNoteDetails] = useState("");
  const selectedChild = children.find((child) => child.id === selectedChildId) ?? children[0];
  const latest = useMemo(() => selectedChild.transmissions.slice(0, 10), [selectedChild.transmissions]);

  const quickAdd = (
    category: QuickCategory,
    title: string,
    details: string,
    visibility: "parent" | "internal" | "management" | "medical" = "parent",
  ) => {
    addTransmission({ childId: selectedChild.id, category, title, details, visibility, authorId: currentUser.id });
  };

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl bg-card shadow-soft border border-border/40 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Badge className="rounded-full border-0 bg-primary/10 text-primary">App équipe</Badge>
            <h1 className="text-2xl font-display font-bold mt-3">Terrain opérationnel</h1>
            <p className="text-sm text-muted-foreground mt-1">Vue groupe pour aller vite, vue enfant pour la granularité, réponses prédéfinies pour ne pas perdre du temps.</p>
          </div>
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-full md:w-72 rounded-xl"><SelectValue placeholder="Choisir un enfant" /></SelectTrigger>
            <SelectContent>{children.map((child) => <SelectItem key={child.id} value={child.id}>{child.firstName} {child.lastName}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
          <div className="space-y-4">
            <Card className="rounded-2xl shadow-soft">
              <CardContent className="p-5 flex gap-4">
                <img src={selectedChild.photo} alt={selectedChild.firstName} className="h-24 w-24 rounded-3xl object-cover" />
                <div>
                  <p className="font-display font-semibold text-xl">{selectedChild.firstName} {selectedChild.lastName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedChild.group?.name} · {selectedChild.parents.map((parent) => parent.name).join(" · ")}</p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => quickAdd("presence", "Arrivée enregistrée", "Présent, signature non obligatoire.", "parent")}>Présent</Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => quickAdd("presence", "Absence encodée", "Absence prévue ou signalée.", "internal")}>Absence</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Repas</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{mealPresets.map((preset) => <Button key={preset} size="sm" variant="outline" className="rounded-full" onClick={() => quickAdd("meal", "Repas", preset, "parent")}>{preset}</Button>)}</CardContent></Card>
            <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Sieste</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{napPresets.map((preset) => <Button key={preset} size="sm" variant="outline" className="rounded-full" onClick={() => quickAdd("nap", "Sieste", preset, "parent")}>{preset}</Button>)}</CardContent></Card>
            <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Change</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{changePresets.map((preset) => <Button key={preset} size="sm" variant="outline" className="rounded-full" onClick={() => quickAdd("change", "Change", preset, "internal")}>{preset}</Button>)}</CardContent></Card>
            <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Santé</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{healthPresets.map((preset) => <Button key={preset} size="sm" variant="outline" className="rounded-full" onClick={() => quickAdd("health", "Santé", preset, preset.includes("Température") || preset.includes("Médicament") ? "medical" : "internal")}>{preset}</Button>)}</CardContent></Card>
            <Card className="rounded-2xl shadow-soft">
              <CardHeader><CardTitle>Note libre</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Titre" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
                <Textarea placeholder="Détail rapide" value={noteDetails} onChange={(e) => setNoteDetails(e.target.value)} />
                <Button className="rounded-xl w-full" onClick={() => { if (!noteTitle || !noteDetails) return; quickAdd("note", noteTitle, noteDetails, "management"); setNoteTitle(""); setNoteDetails(""); }}>Ajouter une note direction</Button>
              </CardContent>
            </Card>
          </div>
          <Card className="rounded-2xl shadow-soft">
            <CardHeader><CardTitle>Fil de journée</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {latest.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{item.title}</p>
                      <Badge variant="secondary" className="rounded-full">{item.category}</Badge>
                      <Badge className="rounded-full border-0 bg-primary/10 text-primary">{item.visibility}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{dateTimeLabel(item.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{item.details}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </BackOfficeLayout>
  );
}
