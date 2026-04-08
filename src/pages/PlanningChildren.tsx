import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { useChildrenWithRelations } from "@/context/AppDataContext";

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
export default function PlanningChildren() {
  const children = useChildrenWithRelations();
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle title="Planning enfants" subtitle="Lecture rapide des groupes, présences attendues et organisation de semaine." />
        {days.map((day) => (
          <Card key={day} className="rounded-2xl shadow-soft">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between"><h2 className="font-display font-semibold">{day}</h2><span className="text-sm text-muted-foreground">{children.length} places planifiées</span></div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {children.map((child) => (
                  <div key={child.id + day} className="rounded-2xl border border-border/40 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={child.photo} alt={child.firstName} className="h-11 w-11 rounded-2xl object-cover" />
                      <div>
                        <p className="font-medium">{child.firstName} {child.lastName}</p>
                        <p className="text-sm text-muted-foreground">{child.group?.name}</p>
                      </div>
                    </div>
                    <span className="text-xs rounded-full px-2.5 py-1 bg-primary/10 text-primary">08:00–17:00</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </BackOfficeLayout>
  );
}
