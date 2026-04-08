import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, useChildrenWithRelations, useCurrentUser } from "@/context/AppDataContext";
import { dateTimeLabel } from "@/lib/utils-data";

export default function ChildProfile() {
  const { id } = useParams();
  const { addTransmission } = useAppData();
  const currentUser = useCurrentUser();
  const children = useChildrenWithRelations();
  const child = children.find((item) => item.id === id) ?? children[0];
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState<"activity" | "health" | "note">("activity");
  const [visibility, setVisibility] = useState<"parent" | "internal" | "management" | "medical">("parent");

  const latest = useMemo(() => child.transmissions.slice(0, 8), [child.transmissions]);

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle title={`${child.firstName} ${child.lastName}`} subtitle="Fiche enfant, informations santé, rattachements et transmissions en direct." />
        <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <Card className="rounded-2xl shadow-soft">
            <CardContent className="p-6 flex gap-5 flex-col md:flex-row">
              <img src={child.photo} alt={child.firstName} className="h-28 w-28 rounded-3xl object-cover" />
              <div className="flex-1 grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date de naissance</p>
                  <p className="font-medium">{child.birthDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Groupe</p>
                  <p className="font-medium">{child.group?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Parents</p>
                  <p className="font-medium">{child.parents.map((parent) => parent.name).join(", ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Personnes autorisées</p>
                  <p className="font-medium">{child.authorizedPickup.join(", ")}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">Notes santé</p>
                  <p className="font-medium">{child.medicalNotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader><CardTitle>Ajouter une transmission</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Titre" value={title} onChange={(event) => setTitle(event.target.value)} />
              <Textarea placeholder="Détails" value={details} onChange={(event) => setDetails(event.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Activité</SelectItem>
                    <SelectItem value="health">Santé</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={visibility} onValueChange={(value) => setVisibility(value as typeof visibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Visible parent</SelectItem>
                    <SelectItem value="internal">Interne équipe</SelectItem>
                    <SelectItem value="management">Direction</SelectItem>
                    <SelectItem value="medical">Médical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={() => {
                  if (!title || !details) return;
                  addTransmission({ childId: child.id, category, title, details, visibility, authorId: currentUser.id });
                  setTitle("");
                  setDetails("");
                }}
              >
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle>Dernières transmissions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {latest.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/40 p-4">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant="secondary" className="rounded-full capitalize">{item.category}</Badge>
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
    </BackOfficeLayout>
  );
}
