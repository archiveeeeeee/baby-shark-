import { ChangeEvent, useMemo, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/context/AppDataContext";
import { dateTimeLabel } from "@/lib/utils-data";
import { uploadDocumentAndCreate } from "@/lib/supabase-data";

type EntityType = "structure" | "parent" | "child" | "contract";

const documentTypeOptions = [
  { value: "administratif", label: "Administratif" },
  { value: "sante", label: "Santé" },
  { value: "contrat", label: "Contrat" },
  { value: "facturation", label: "Facturation" },
  { value: "autorisation", label: "Autorisation" },
  { value: "autre", label: "Autre" },
];

export default function DocumentsPage() {
  const { state, refresh } = useAppData();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState("administratif");
  const [entityType, setEntityType] = useState<EntityType>("structure");
  const [entityId, setEntityId] = useState(state.structure.id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const entityOptions = useMemo(() => {
    switch (entityType) {
      case "parent":
        return state.parents.map((parent) => ({
          id: parent.id,
          label: parent.name,
        }));
      case "child":
        return state.children.map((child) => ({
          id: child.id,
          label: `${child.firstName} ${child.lastName}`,
        }));
      case "contract":
        return state.contracts.map((contract) => {
          const child = state.children.find((item) => item.id === contract.childId);
          return {
            id: contract.id,
            label: child
              ? `${child.firstName} ${child.lastName} · ${contract.startDate}`
              : contract.id,
          };
        });
      case "structure":
      default:
        return [{ id: state.structure.id, label: state.structure.name }];
    }
  }, [entityType, state]);

  function handleEntityTypeChange(nextType: EntityType) {
    setEntityType(nextType);
    if (nextType === "structure") {
      setEntityId(state.structure.id);
      return;
    }

    const nextOptions =
      nextType === "parent"
        ? state.parents.map((parent) => parent.id)
        : nextType === "child"
          ? state.children.map((child) => child.id)
          : state.contracts.map((contract) => contract.id);

    setEntityId(nextOptions[0] || "");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  }

  async function handleSubmit() {
    if (!title.trim() || !entityId || !selectedFile) {
      setErrorMessage("Titre, rattachement et fichier sont obligatoires.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      await uploadDocumentAndCreate({
        structureId: state.structure.id,
        title: title.trim(),
        description: description.trim(),
        documentType,
        entityType,
        entityId,
        file: selectedFile,
      });

      await refresh();

      setTitle("");
      setDescription("");
      setDocumentType("administratif");
      setEntityType("structure");
      setEntityId(state.structure.id);
      setSelectedFile(null);

      const fileInput = document.getElementById("document-file-input") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      setErrorMessage(error?.message || "Impossible d'ajouter le document.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SectionTitle
          title="Documents"
          subtitle="Pièces structure, parent, contrat ou santé, toutes rattachées à une entité métier."
        />

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Ajouter un document</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Titre"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <select
              className="w-full border rounded-lg p-2 text-sm bg-background"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
            >
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="w-full border rounded-lg p-2 text-sm bg-background"
              value={entityType}
              onChange={(event) => handleEntityTypeChange(event.target.value as EntityType)}
            >
              <option value="structure">Structure</option>
              <option value="parent">Parent</option>
              <option value="child">Enfant</option>
              <option value="contract">Contrat</option>
            </select>

            <select
              className="w-full border rounded-lg p-2 text-sm bg-background"
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
            >
              {entityOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="md:col-span-2">
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Input id="document-file-input" type="file" onChange={handleFileChange} />
            </div>

            {selectedFile ? (
              <p className="md:col-span-2 text-sm text-muted-foreground">
                Fichier sélectionné : {selectedFile.name}
              </p>
            ) : null}

            {errorMessage ? (
              <p className="md:col-span-2 text-sm text-red-600">{errorMessage}</p>
            ) : null}

            <div className="md:col-span-2 flex justify-end">
              <Button
                className="rounded-xl"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Ajout en cours..." : "Ajouter"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.documents.map((doc) => {
            const extra = doc as any;

            return (
              <Card key={doc.id} className="rounded-2xl shadow-soft">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{doc.title}</p>
                    <Badge className="rounded-full border-0 bg-primary/10 text-primary">
                      {doc.category}
                    </Badge>
                  </div>

                  {extra.description ? (
                    <p className="text-sm text-muted-foreground">{extra.description}</p>
                  ) : null}

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Rattaché à : {doc.linkedTo.type}</p>
                    <p>Ajouté le {dateTimeLabel(doc.uploadedAt)}</p>
                    {extra.filePath ? <p>Fichier : {extra.filePath}</p> : null}
                    {extra.status ? <p>Statut : {extra.status}</p> : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </BackOfficeLayout>
  );
}
