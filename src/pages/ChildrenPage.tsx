import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppData, useChildrenWithRelations } from "@/context/AppDataContext";

export default function ChildrenPage() {
  const { state, addParent, addChild } = useAppData();
  const children = useChildrenWithRelations();

  const availableGroups = state.structure.groups ?? [];
  const availableParents = state.parents ?? [];

  const [parentForm, setParentForm] = useState({
    name: "",
    email: "",
    phone: "",
    payer: false,
  });

  const [childForm, setChildForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    groupId: "",
    medicalNotes: "",
    allergies: "",
    photo: "",
    parentIds: [] as string[],
  });

  const validGroupIds = useMemo(
    () => new Set(availableGroups.map((group) => group.id)),
    [availableGroups],
  );

  useEffect(() => {
    const firstGroupId = availableGroups[0]?.id ?? "";
    if (!firstGroupId) return;

    setChildForm((current) => {
      if (current.groupId && validGroupIds.has(current.groupId)) {
        return current;
      }
      return { ...current, groupId: firstGroupId };
    });
  }, [availableGroups, validGroupIds]);

  async function handleAddParent() {
    if (!parentForm.name.trim() || !parentForm.email.trim()) return;

    await addParent({
      name: parentForm.name.trim(),
      email: parentForm.email.trim(),
      phone: parentForm.phone.trim(),
      payer: parentForm.payer,
    });

    setParentForm({
      name: "",
      email: "",
      phone: "",
      payer: false,
    });
  }

  async function handleAddChild() {
    if (!childForm.firstName.trim() || !childForm.lastName.trim()) return;
    if (!childForm.groupId) return;

    const allergiesArray = childForm.allergies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    await addChild({
      firstName: childForm.firstName.trim(),
      lastName: childForm.lastName.trim(),
      birthDate: childForm.birthDate,
      groupId: childForm.groupId,
      medicalNotes: childForm.medicalNotes.trim(),
      allergies: allergiesArray,
      photo: childForm.photo.trim() || undefined,
      parentIds: childForm.parentIds,
    });

    setChildForm({
      firstName: "",
      lastName: "",
      birthDate: "",
      groupId: availableGroups[0]?.id ?? "",
      medicalNotes: "",
      allergies: "",
      photo: "",
      parentIds: [],
    });
  }

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Enfants & familles"
          subtitle="Vue centralisée des dossiers enfant, rattachements parents, contrats et transmissions."
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle>Ajouter un parent</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Input
                placeholder="Nom du parent"
                value={parentForm.name}
                onChange={(e) =>
                  setParentForm((current) => ({ ...current, name: e.target.value }))
                }
              />

              <Input
                placeholder="Email"
                value={parentForm.email}
                onChange={(e) =>
                  setParentForm((current) => ({ ...current, email: e.target.value }))
                }
              />

              <Input
                placeholder="Téléphone"
                value={parentForm.phone}
                onChange={(e) =>
                  setParentForm((current) => ({ ...current, phone: e.target.value }))
                }
              />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="payer"
                  checked={parentForm.payer}
                  onCheckedChange={(checked) =>
                    setParentForm((current) => ({ ...current, payer: !!checked }))
                  }
                />
                <label htmlFor="payer" className="text-sm">
                  Parent payeur
                </label>
              </div>

              <Button className="w-full rounded-xl" onClick={handleAddParent}>
                Créer le parent
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle>Ajouter un enfant</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Input
                placeholder="Prénom de l'enfant"
                value={childForm.firstName}
                onChange={(e) =>
                  setChildForm((current) => ({ ...current, firstName: e.target.value }))
                }
              />

              <Input
                placeholder="Nom de famille"
                value={childForm.lastName}
                onChange={(e) =>
                  setChildForm((current) => ({ ...current, lastName: e.target.value }))
                }
              />

              <Input
                type="date"
                value={childForm.birthDate}
                onChange={(e) =>
                  setChildForm((current) => ({ ...current, birthDate: e.target.value }))
                }
              />

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Groupe</label>
                <select
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  value={childForm.groupId}
                  onChange={(e) =>
                    setChildForm((current) => ({ ...current, groupId: e.target.value }))
                  }
                >
                  {availableGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Parents associés
                </label>
                <select
                  multiple
                  className="w-full border rounded-lg p-2 text-sm bg-background min-h-[120px]"
                  value={childForm.parentIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(
                      (option) => option.value,
                    );
                    setChildForm((current) => ({ ...current, parentIds: selected }));
                  }}
                >
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
              </div>

              <Textarea
                placeholder="Notes médicales"
                value={childForm.medicalNotes}
                onChange={(e) =>
                  setChildForm((current) => ({ ...current, medicalNotes: e.target.value }))
                }
              />

              <Input
                placeholder="Allergies (séparées par des virgules)"
                value={childForm.allergies}
                onChange={(e) =>
                  setChildForm((current) => ({ ...current, allergies: e.target.value }))
                }
              />

              <Input
                placeholder="URL de la photo"
                value={childForm.photo}
                onChange={(e) =>
                  setChildForm((current) => ({ ...current, photo: e.target.value }))
                }
              />

              <Button
                className="w-full rounded-xl"
                onClick={handleAddChild}
                disabled={!childForm.groupId}
              >
                Créer l'enfant
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid xl:grid-cols-2 gap-4 mt-8">
          {children.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Aucun enfant enregistré pour le moment.
            </p>
          )}

          {children.map((child) => (
            <Link key={child.id} to={`/enfants/${child.id}`}>
              <Card className="rounded-2xl shadow-soft hover:shadow-medium transition">
                <CardContent className="p-5 flex gap-4">
                  <img
                    src={child.photo || "https://placehold.co/80x80"}
                    alt={`${child.firstName} ${child.lastName}`}
                    className="h-20 w-20 rounded-2xl object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-display font-semibold text-lg">
                          {child.firstName} {child.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {child.parents.map((parent) => parent.name).join(" · ")}
                        </p>
                      </div>

                      {child.group ? (
                        <Badge className={`rounded-full border-0 ${child.group.colorClass}`}>
                          {child.group.name}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Allergies</p>
                        <p className="font-medium">
                          {child.allergies.join(", ") || "Aucune"}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Contrat</p>
                        <p className="font-medium">
                          {child.contract?.pricingLabel ?? "À créer"}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Transmissions</p>
                        <p className="font-medium">{child.transmissions.length}</p>
                      </div>
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