import { ShieldCheck, Lock, PencilLine, Settings2, Users2 } from "lucide-react";

import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppData } from "@/context/AppDataContext";
import {
  accessLevelMeta,
  permissionAreas,
  roleDefinitions,
  getUsersByDisplayRole,
} from "@/lib/access-control";
import { cn } from "@/lib/utils";

const roleIcons = {
  superadmin: ShieldCheck,
  admin: Settings2,
  manager: Users2,
  team: PencilLine,
  parent: Lock,
} as const;

export default function AccessPage() {
  const { state } = useAppData();
  const roleGroups = getUsersByDisplayRole(state.users);

  return (
    <BackOfficeLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <SectionTitle
          title="Droits d'accès"
          subtitle="Matrice RBAC posée par rôle applicatif pour éviter le faux contrôle. Ici, on montre qui peut vraiment voir, agir, gérer ou administrer."
        />

        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Lecture de la matrice</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {Object.entries(accessLevelMeta).map(([key, meta]) => (
                <div key={key} className="rounded-2xl border border-border/70 bg-background/80 p-3">
                  <Badge className={cn("rounded-full border text-xs font-medium", meta.className)}>{meta.label}</Badge>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {key === "none" && "Pas d'accès à ce module."}
                    {key === "read" && "Consultation seulement, sans impact métier."}
                    {key === "contribute" && "Peut envoyer, compléter ou signer dans son périmètre."}
                    {key === "manage" && "Peut modifier et piloter le module au quotidien."}
                    {key === "admin" && "Peut configurer, arbitrer et agir sans limitation locale."}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Point de vigilance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Cette page pose une règle produit claire. Tant que Supabase Auth + RLS ne sont pas branchés,
                c&apos;est une <span className="font-medium text-foreground">référence fonctionnelle</span>, pas une sécurité backend.
              </p>
              <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-warning-foreground">
                L&apos;angle mort classique, c&apos;est de croire qu&apos;un badge de rôle suffit. Non. Sans matrice propre,
                les écrans te racontent une histoire et les droits réels racontent autre chose.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-5">
          {roleGroups.map((role) => {
            const Icon = roleIcons[role.key];
            return (
              <Card key={role.key} className="rounded-3xl border-border/70 shadow-soft">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge className={cn("rounded-full border text-xs font-medium", role.colorClass)}>
                        {role.shortLabel}
                      </Badge>
                      <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{role.label}</h3>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/50 p-2 text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-3 text-sm">
                    <p className="font-medium text-foreground">{role.scope}</p>
                    <p className="mt-1 text-muted-foreground">{role.users.length} compte(s) associé(s)</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Matrice des permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[240px]">Module</TableHead>
                  {roleDefinitions.map((role) => (
                    <TableHead key={role.key} className="min-w-[150px]">
                      {role.shortLabel}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionAreas.map((area) => (
                  <TableRow key={area.key}>
                    <TableCell className="align-top">
                      <div>
                        <p className="font-medium text-foreground">{area.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{area.description}</p>
                      </div>
                    </TableCell>
                    {roleDefinitions.map((role) => {
                      const level = area.levels[role.key];
                      const meta = accessLevelMeta[level];
                      return (
                        <TableCell key={`${area.key}-${role.key}`}>
                          <Badge className={cn("rounded-full border font-medium", meta.className)}>
                            {meta.label}
                          </Badge>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-5">
          {roleGroups.map((role) => (
            <Card key={role.key} className="rounded-3xl border-border/70 shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{role.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {role.users.length ? (
                  role.users.map((user) => (
                    <div key={user.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        {user.title || role.label}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Aucun compte rattaché à ce rôle pour l&apos;instant.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </BackOfficeLayout>
  );
}
