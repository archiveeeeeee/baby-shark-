import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Baby, Users, FileText, Receipt, CalendarDays,
  UserCog, BarChart3, MessageSquare, FolderOpen, Settings, Tablet,
  Shield, Globe, PenTool, Download, Clock, Building2, Sparkles,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAppData, useCurrentUser } from "@/context/AppDataContext";

const mainNav = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
  { title: "Pré-inscriptions", url: "/pre-inscriptions", icon: FileText },
  { title: "Enfants & Familles", url: "/enfants", icon: Baby },
  { title: "Contrats", url: "/contrats", icon: FileText },
  { title: "Facturation", url: "/facturation", icon: Receipt },
  { title: "Planning enfants", url: "/planning-enfants", icon: CalendarDays },
  { title: "Planning équipe", url: "/planning-equipe", icon: Clock },
];

const managementNav = [
  { title: "Équipe & RH", url: "/equipe", icon: UserCog },
  { title: "Statistiques", url: "/statistiques", icon: BarChart3 },
  { title: "Messagerie", url: "/messagerie", icon: MessageSquare },
  { title: "Documents", url: "/documents", icon: FolderOpen },
];

const settingsNav = [
  { title: "Paramétrage", url: "/parametrage", icon: Settings },
  { title: "Appareils", url: "/appareils", icon: Tablet },
  { title: "Droits d'accès", url: "/droits", icon: Shield },
  { title: "Site vitrine", url: "/vitrine", icon: Globe },
  { title: "Signature", url: "/signature", icon: PenTool },
  { title: "Exports", url: "/exports", icon: Download },
];

function NavGroup({ label, items }: { label: string; items: typeof mainNav }) {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-widest font-medium mb-1">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild>
                  <Link
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150",
                      active
                        ? "bg-sidebar-primary/20 text-sidebar-primary font-medium"
                        : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentUser = useCurrentUser();
  const { state: appState } = useAppData();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 pb-2">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-primary flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display font-bold text-sidebar-accent-foreground text-[16px] leading-tight">BabyShark</h1>
              <p className="text-[11px] text-sidebar-foreground/40">Suite petite-enfance</p>
            </div>
          )}
        </Link>
        {!collapsed && (
          <div className="mt-4 flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-sidebar-accent/60 text-sm text-sidebar-accent-foreground">
            <Building2 className="h-4 w-4" />
            <span className="flex-1 text-left text-[13px]">{appState.structure.name}</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 space-y-1">
        <NavGroup label="Principal" items={mainNav} />
        <NavGroup label="Gestion" items={managementNav} />
        <NavGroup label="Configuration" items={settingsNav} />
      </SidebarContent>

      <SidebarFooter className="p-4 pt-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-peach to-coral flex items-center justify-center text-xs font-bold text-primary-foreground">
              {currentUser.name.split(" ").map((part) => part[0]).slice(0,2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-sidebar-accent-foreground truncate">{currentUser.name}</p>
              <p className="text-[11px] text-sidebar-foreground/40 truncate">{currentUser.title ?? currentUser.role}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
