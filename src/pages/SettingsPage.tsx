import { useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppData } from "@/context/AppDataContext";

export default function SettingsPage() {
  const { state } = useAppData();
  const [readonly] = useState(state.structure);
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <SectionTitle title="Paramétrage" subtitle="Les paramètres structure sont visibles ici. Le vrai branchement DB viendra sur Supabase." />
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="rounded-2xl shadow-soft"><CardContent className="p-5 space-y-3"><Input value={readonly.name} readOnly /><Input value={readonly.email} readOnly /><Input value={readonly.phone} readOnly /><Input value={readonly.address} readOnly /></CardContent></Card>
          <Card className="rounded-2xl shadow-soft"><CardContent className="p-5 space-y-3">{readonly.groups.map((group)=><div key={group.id} className="rounded-xl border border-border/40 px-3 py-2 text-sm">{group.name}</div>)}</CardContent></Card>
        </div>
      </div>
    </BackOfficeLayout>
  );
}
