import { useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppDataContext";
import { dateTimeLabel } from "@/lib/utils-data";

export default function DocumentsPage() {
  const { state, addDocument } = useAppData();
  const [title, setTitle] = useState("");
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle title="Documents" subtitle="Pièces structure, parent, contrat ou santé, toutes rattachées à une entité métier." />
        <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Ajouter un document logique</CardTitle></CardHeader><CardContent className="flex gap-3"><Input placeholder="Titre" value={title} onChange={(e)=>setTitle(e.target.value)} /><Button className="rounded-xl" onClick={()=>{ if(!title) return; addDocument({ title, category: 'internal', linkedTo: { type: 'structure', id: state.structure.id } }); setTitle(''); }}>Ajouter</Button></CardContent></Card>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{state.documents.map((doc)=><Card key={doc.id} className="rounded-2xl shadow-soft"><CardContent className="p-5 space-y-2"><p className="font-medium">{doc.title}</p><Badge className="rounded-full border-0 bg-primary/10 text-primary">{doc.category}</Badge><p className="text-sm text-muted-foreground">Ajouté le {dateTimeLabel(doc.uploadedAt)}</p></CardContent></Card>)}</div>
      </div>
    </BackOfficeLayout>
  );
}
