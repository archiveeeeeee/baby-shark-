import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppDataContext";

export default function TeamDirectory() {
  const { state } = useAppData();
  const team = state.users.filter((user) => ["admin", "manager", "team"].includes(user.role));
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle title="Équipe & RH" subtitle="Fiches visibles dans l'app terrain, fonctions et rôles de structure." />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {team.map((user) => (
            <Card key={user.id} className="rounded-2xl shadow-soft">
              <CardContent className="p-5 space-y-2">
                <p className="font-display font-semibold text-lg">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="rounded-full border-0 bg-primary/10 text-primary">{user.role}</Badge>
                  {user.visibleInTeamApp ? <Badge variant="secondary" className="rounded-full">Visible terrain</Badge> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </BackOfficeLayout>
  );
}
