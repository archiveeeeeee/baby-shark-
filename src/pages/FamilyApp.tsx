import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAppData, useCurrentUser } from "@/context/AppDataContext";
import { dateTimeLabel, money } from "@/lib/utils-data";

export default function FamilyApp() {
  const { state, addFamilyRequest, addDocument } = useAppData();
  const currentUser = useCurrentUser();
  const parent = state.parents.find((item) => item.email === currentUser.email) ?? state.parents[0];
  const children = state.children.filter((child) => parent.childIds.includes(child.id));
  const visibleFeed = useMemo(() => state.transmissions.filter((item) => children.some((child) => child.id === item.childId) && item.visibility === "parent"), [state.transmissions, children]);
  const invoices = state.invoices.filter((invoice) => invoice.parentId === parent.id);
  const [requestType, setRequestType] = useState<"absence" | "delay" | "reservation" | "document">("absence");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 shadow-elevated">
          <Badge className="rounded-full border-0 bg-white/10 text-white">App famille</Badge>
          <h1 className="text-3xl font-display font-bold mt-3">Bonjour {parent.name.split(' ')[0]}</h1>
          <p className="text-primary-foreground/80 mt-2">Vous voyez ici les mêmes données que le back-office, mais filtrées selon vos droits de parent.</p>
        </div>
        <div className="grid xl:grid-cols-[1fr_0.9fr] gap-6">
          <div className="space-y-4">
            <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Fil de journée</CardTitle></CardHeader><CardContent className="space-y-3">{visibleFeed.map((item)=>{ const child=state.children.find((c)=>c.id===item.childId); return <div key={item.id} className="rounded-2xl border border-border/40 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{child?.firstName} · {item.title}</p><p className="text-sm text-muted-foreground mt-1">{item.details}</p></div><span className="text-xs text-muted-foreground">{dateTimeLabel(item.createdAt)}</span></div></div>;})}</CardContent></Card>
            <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Factures</CardTitle></CardHeader><CardContent className="space-y-3">{invoices.map((invoice)=><div key={invoice.id} className="rounded-2xl border border-border/40 p-4 flex items-center justify-between gap-3"><div><p className="font-medium">{invoice.label}</p><p className="text-sm text-muted-foreground">{invoice.number}</p></div><div className="text-right"><p className="font-medium">{money(invoice.amount)}</p><Badge className="rounded-full border-0 bg-primary/10 text-primary">{invoice.status}</Badge></div></div>)}</CardContent></Card>
          </div>
          <div className="space-y-4">
            <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Nouvelle demande</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2">{(["absence","delay","reservation","document"] as const).map((type)=><Button key={type} variant={requestType===type?'default':'outline'} size="sm" className="rounded-full" onClick={()=>setRequestType(type)}>{type}</Button>)}</div><Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} /><Textarea placeholder="Précision pour la structure" value={details} onChange={(e)=>setDetails(e.target.value)} /><Button className="w-full rounded-xl" onClick={()=>{ if(!details||!children[0]) return; if(requestType==='document'){ addDocument({ title:`Document parent · ${parent.name}`, category:'parent', linkedTo:{ type:'parent', id: parent.id } }); } addFamilyRequest({ parentId: parent.id, childId: children[0].id, type: requestType, date, details }); setDetails(''); }}>Envoyer</Button></CardContent></Card>
            <Card className="rounded-2xl shadow-soft"><CardHeader><CardTitle>Documents utiles</CardTitle></CardHeader><CardContent className="space-y-3">{state.documents.filter((doc)=>doc.linkedTo.type==='structure' || doc.linkedTo.id===parent.id).map((doc)=><div key={doc.id} className="rounded-2xl border border-border/40 p-3 flex items-center justify-between"><span className="font-medium">{doc.title}</span><Badge variant="secondary" className="rounded-full">{doc.category}</Badge></div>)}</CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
