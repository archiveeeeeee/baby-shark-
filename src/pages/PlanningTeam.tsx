import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppDataContext";

export default function PlanningTeam() {
  const { state } = useAppData();
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle title="Planning équipe" subtitle="Couverture RH utile sans basculer dans une usine à gaz SIRH." />
        <div className="grid lg:grid-cols-2 gap-4">
          {state.teamShifts.map((shift) => {
            const user = state.users.find((item) => item.id === shift.userId);
            return (
              <Card key={shift.id} className="rounded-2xl shadow-soft">
                <CardContent className="p-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold text-lg">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{shift.day} · {shift.start} → {shift.end}</p>
                  </div>
                  <Badge className="rounded-full border-0 bg-primary/10 text-primary">{shift.status}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </BackOfficeLayout>
  );
}
