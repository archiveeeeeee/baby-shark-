import { useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppDataContext";

export default function DevicesPage() {
  const { state, addDevice } = useAppData();
  const [label, setLabel] = useState("");
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <SectionTitle title="Appareils" subtitle="Tablette accueil, tablette section, mobile équipe : chaque appareil a ses modules visibles." />
        <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Nouvel appareil</CardTitle></CardHeader><CardContent className="flex gap-3"><Input placeholder="Label appareil" value={label} onChange={(e)=>setLabel(e.target.value)} /><Button className="rounded-xl" onClick={()=>{ if(!label) return; addDevice({ label, type:'section', code: String(Math.floor(100000+Math.random()*899999)), visibleModules:['pointage','transmissions']}); setLabel(''); }}>Créer</Button></CardContent></Card>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{state.devices.map((device)=><Card key={device.id} className="rounded-2xl shadow-soft"><CardContent className="p-5 space-y-3"><div className="flex items-center justify-between"><p className="font-medium">{device.label}</p><Badge className="rounded-full border-0 bg-primary/10 text-primary">{device.type}</Badge></div><p className="text-sm text-muted-foreground">Code d'enrôlement : {device.code}</p><div className="flex flex-wrap gap-2">{device.visibleModules.map((module)=><Badge key={module} variant="secondary" className="rounded-full">{module}</Badge>)}</div></CardContent></Card>)}</div>
      </div>
    </BackOfficeLayout>
  );
}
