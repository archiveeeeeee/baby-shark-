import { useNavigate } from "react-router-dom";
import { useAppData, useCurrentUser } from "@/context/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Building2 } from "lucide-react";

export default function Login() {
  const { state, switchRole } = useAppData();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-peach/10 to-mint/10 p-6 flex items-center justify-center">
      <Card className="w-full max-w-4xl rounded-3xl shadow-elevated border-border/40">
        <CardHeader>
          <Badge className="w-fit bg-primary/10 text-primary border-0 rounded-full">BabyShark V1</Badge>
          <CardTitle className="text-3xl font-display mt-4">Choisissez un profil pour tester le produit</CardTitle>
          <p className="text-muted-foreground">La DA est figée. Cette interface sert à traverser toute la suite avec des rôles différents.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.users.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                switchRole(user.role);
                navigate(user.role === "superadmin" ? "/superadmin" : user.role === "parent" ? "/app-famille" : user.role === "team" ? "/app-equipe" : "/");
              }}
              className="text-left rounded-2xl border border-border/50 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-medium"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  {user.role === "superadmin" ? <Shield className="h-5 w-5" /> : user.role === "parent" ? <Users className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="secondary" className="rounded-full capitalize">{user.role}</Badge>
                {currentUser.id === user.id ? <Badge className="rounded-full bg-success text-success-foreground border-0">Actif</Badge> : null}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
