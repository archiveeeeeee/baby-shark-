import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppDataProvider } from "@/context/AppDataContext";
import Dashboard from "./pages/Dashboard";
import ChildProfile from "./pages/ChildProfile";
import Billing from "./pages/Billing";
import PlanningChildren from "./pages/PlanningChildren";
import TeamApp from "./pages/TeamApp";
import FamilyApp from "./pages/FamilyApp";
import Vitrine from "./pages/Vitrine";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Superadmin from "./pages/Superadmin";
import ChildrenPage from "./pages/ChildrenPage";
import PreRegistrations from "./pages/PreRegistrations";
import ContractsPage from "./pages/ContractsPage";
import PlanningTeam from "./pages/PlanningTeam";
import TeamDirectory from "./pages/TeamDirectory";
import StatisticsPage from "./pages/StatisticsPage";
import MessagingPage from "./pages/MessagingPage";
import DocumentsPage from "./pages/DocumentsPage";
import SettingsPage from "./pages/SettingsPage";
import DevicesPage from "./pages/DevicesPage";
import AccessPage from "./pages/AccessPage";
import SignaturePage from "./pages/SignaturePage";
import ExportsPage from "./pages/ExportsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppDataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/superadmin" element={<Superadmin />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/enfants" element={<ChildrenPage />} />
            <Route path="/enfants/:id" element={<ChildProfile />} />
            <Route path="/pre-inscriptions" element={<PreRegistrations />} />
            <Route path="/contrats" element={<ContractsPage />} />
            <Route path="/facturation" element={<Billing />} />
            <Route path="/planning-enfants" element={<PlanningChildren />} />
            <Route path="/planning-equipe" element={<PlanningTeam />} />
            <Route path="/equipe" element={<TeamDirectory />} />
            <Route path="/statistiques" element={<StatisticsPage />} />
            <Route path="/messagerie" element={<MessagingPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/parametrage" element={<SettingsPage />} />
            <Route path="/appareils" element={<DevicesPage />} />
            <Route path="/droits" element={<AccessPage />} />
            <Route path="/signature" element={<SignaturePage />} />
            <Route path="/exports" element={<ExportsPage />} />
            <Route path="/app-equipe" element={<TeamApp />} />
            <Route path="/app-famille" element={<FamilyApp />} />
            <Route path="/vitrine" element={<Vitrine />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppDataProvider>
  </QueryClientProvider>
);

export default App;
