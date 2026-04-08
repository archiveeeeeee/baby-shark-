import { Link } from "react-router-dom";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChildrenWithRelations } from "@/context/AppDataContext";

export default function ChildrenPage() {
  const children = useChildrenWithRelations();
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle title="Enfants & familles" subtitle="Vue centralisée des dossiers enfant, rattachements parents, contrats et transmissions." />
        <div className="grid xl:grid-cols-2 gap-4">
          {children.map((child) => (
            <Link key={child.id} to={`/enfants/${child.id}`}>
              <Card className="rounded-2xl shadow-soft hover:shadow-medium transition">
                <CardContent className="p-5 flex gap-4">
                  <img src={child.photo} alt={`${child.firstName} ${child.lastName}`} className="h-20 w-20 rounded-2xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-display font-semibold text-lg">{child.firstName} {child.lastName}</p>
                        <p className="text-sm text-muted-foreground">{child.parents.map((parent) => parent.name).join(" · ")}</p>
                      </div>
                      {child.group ? <Badge className={`rounded-full border-0 ${child.group.colorClass}`}>{child.group.name}</Badge> : null}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                      <div><p className="text-muted-foreground">Allergies</p><p className="font-medium">{child.allergies.join(", ") || "Aucune"}</p></div>
                      <div><p className="text-muted-foreground">Contrat</p><p className="font-medium">{child.contract?.pricingLabel ?? "À créer"}</p></div>
                      <div><p className="text-muted-foreground">Transmissions</p><p className="font-medium">{child.transmissions.length}</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </BackOfficeLayout>
  );
}
