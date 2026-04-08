import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppDataContext";

export default function AccessPage() {
  const { state } = useAppData();
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <SectionTitle title="Droits d'accès" subtitle="RBAC affiché par rôle applicatif, en attendant le branchement Supabase Auth + RLS." />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{state.users.map((user)=><Card key={user.id} className="rounded-2xl shadow-soft"><CardContent className="p-5 space-y-2"><p className="font-medium">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}</p><Badge className="rounded-full border-0 bg-primary/10 text-primary">{user.role}</Badge></CardContent></Card>)}</div>
      </div>
    </BackOfficeLayout>
  );
}
