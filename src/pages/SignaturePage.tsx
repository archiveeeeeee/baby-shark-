import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { SectionTitle } from "@/components/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppDataContext";

export default function SignaturePage() {
  const { state } = useAppData();
  return (
    <BackOfficeLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <SectionTitle title="Signature" subtitle="Workflow faux prêt à brancher : on montre ce qui doit partir chez un prestataire plus tard." />
        <div className="space-y-4">{state.contracts.map((contract)=><Card key={contract.id} className="rounded-2xl shadow-soft"><CardContent className="p-5 flex items-center justify-between gap-3"><div><p className="font-medium">Contrat {contract.id}</p><p className="text-sm text-muted-foreground">Début {contract.startDate}</p></div><Badge className="rounded-full border-0 bg-primary/10 text-primary">{contract.signatureStatus}</Badge></CardContent></Card>)}</div>
      </div>
    </BackOfficeLayout>
  );
}
