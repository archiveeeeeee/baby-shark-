import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="text-3xl font-display font-bold">Cette page n'existe pas.</h1>
        <Button asChild className="rounded-xl"><Link to="/">Retour au tableau de bord</Link></Button>
      </div>
    </div>
  );
}
