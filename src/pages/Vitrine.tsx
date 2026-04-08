import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import hero from "@/assets/hero-vitrine.jpg";
import { useAppData } from "@/context/AppDataContext";

export default function Vitrine() {
  const { state, addPreRegistration } = useAppData();
  const [form, setForm] = useState({ childName: "", parentName: "", email: "", phone: "", requestedStartDate: "", requestedRhythm: "", notes: "" });
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <img src={hero} alt="Crèche" className="h-[380px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-foreground/10" />
        <div className="absolute inset-0 max-w-7xl mx-auto p-6 flex items-end">
          <div className="text-white max-w-2xl pb-10">
            <Badge className="rounded-full border-0 bg-white/10 text-white">Site vitrine connecté</Badge>
            <h1 className="text-4xl font-display font-bold mt-4">{state.structure.websiteTitle}</h1>
            <p className="mt-3 text-white/80">{state.structure.tagline}</p>
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto p-6 grid xl:grid-cols-[1fr_0.9fr] gap-6">
        <div className="space-y-4">
          <Card className="rounded-2xl shadow-soft"><CardContent className="p-6"><h2 className="text-2xl font-display font-bold">Pourquoi BabyShark ?</h2><p className="text-muted-foreground mt-3">Un seul système relie pré-inscription, back-office, équipe terrain, parents et facturation. Fin du double encodage, fin des messages dispersés, fin des outils qui ne se parlent pas.</p></CardContent></Card>
          <Card className="rounded-2xl shadow-soft"><CardContent className="p-6"><h3 className="font-display font-semibold text-xl">Nos groupes</h3><div className="flex flex-wrap gap-2 mt-4">{state.structure.groups.map((group)=><Badge key={group.id} className={`rounded-full border-0 ${group.colorClass}`}>{group.name}</Badge>)}</div></CardContent></Card>
        </div>
        <Card className="rounded-2xl shadow-soft"><CardContent className="p-6 space-y-3"><h3 className="text-2xl font-display font-bold">Pré-inscription</h3><Input placeholder="Nom de l'enfant" value={form.childName} onChange={(e)=>setForm({ ...form, childName: e.target.value })} /><Input placeholder="Nom du parent" value={form.parentName} onChange={(e)=>setForm({ ...form, parentName: e.target.value })} /><Input placeholder="Email" value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} /><Input placeholder="Téléphone" value={form.phone} onChange={(e)=>setForm({ ...form, phone: e.target.value })} /><Input type="date" value={form.requestedStartDate} onChange={(e)=>setForm({ ...form, requestedStartDate: e.target.value })} /><Input placeholder="Rythme souhaité" value={form.requestedRhythm} onChange={(e)=>setForm({ ...form, requestedRhythm: e.target.value })} /><Textarea placeholder="Informations complémentaires" value={form.notes} onChange={(e)=>setForm({ ...form, notes: e.target.value })} /><Button className="w-full rounded-xl" onClick={()=>{ if(!form.childName||!form.parentName||!form.email) return; addPreRegistration({ ...form, source:'website', tags:['site'], }); setForm({ childName:'', parentName:'', email:'', phone:'', requestedStartDate:'', requestedRhythm:'', notes:'' }); }}>Envoyer ma demande</Button></CardContent></Card>
      </div>
    </div>
  );
}
