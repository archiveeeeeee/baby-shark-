import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";

export function BackOfficeLayout({ children }: { children: React.ReactNode }) {
  const { state } = useAppData();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="relative max-md:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un enfant, une famille..."
                  className="h-9 w-72 rounded-xl bg-muted/60 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button className="relative h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-card" />
              </button>
              <span className="hidden sm:block">{state.structure.country} · {state.structure.currency}</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
