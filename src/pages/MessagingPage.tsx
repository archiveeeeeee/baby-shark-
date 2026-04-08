import { useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppDataContext";

export default function MessagingPage() {
  const { state, addMessageThread } = useAppData();
  const [title, setTitle] = useState("");
  const [lastMessage, setLastMessage] = useState("");
  const [audience, setAudience] = useState<"internal" | "parent">("internal");

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle title="Messagerie" subtitle="Flux parent ↔ structure et flux interne partagent la même logique métier." />
        <div className="grid xl:grid-cols-[0.8fr_1.2fr] gap-6">
          <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Nouveau fil</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="Titre" value={title} onChange={(e)=>setTitle(e.target.value)} /><Textarea placeholder="Premier message" value={lastMessage} onChange={(e)=>setLastMessage(e.target.value)} /><div className="flex gap-2"><Button variant={audience==='internal'?'default':'outline'} className="rounded-xl" onClick={()=>setAudience('internal')}>Interne</Button><Button variant={audience==='parent'?'default':'outline'} className="rounded-xl" onClick={()=>setAudience('parent')}>Parents</Button></div><Button className="w-full rounded-xl" onClick={()=>{ if(!title||!lastMessage) return; addMessageThread({ title, audience, lastMessage, participantIds: []}); setTitle(''); setLastMessage(''); }}>Créer le fil</Button></CardContent></Card>
          <div className="space-y-4">{state.messages.map((thread)=><Card key={thread.id} className="rounded-2xl shadow-soft"><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><div><p className="font-display font-semibold text-lg">{thread.title}</p><p className="text-sm text-muted-foreground mt-1">{thread.lastMessage}</p></div><Badge className="rounded-full border-0 bg-primary/10 text-primary">{thread.audience}</Badge></div></CardContent></Card>)}</div>
        </div>
      </div>
    </BackOfficeLayout>
  );
}
