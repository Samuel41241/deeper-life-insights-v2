import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/layout/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ChurchHierarchy from "./pages/admin/ChurchHierarchy";
import Members from "./pages/admin/Members";
import MemberDetails from "./pages/admin/MemberDetails";
import RegisterMember from "./pages/admin/RegisterMember";
import QRCards from "./pages/admin/QRCards";
import AttendanceScanner from "./pages/admin/AttendanceScanner";
import AttendanceHistory from "./pages/admin/AttendanceHistory";
import Reports from "./pages/admin/Reports";
import Engagement from "./pages/admin/Engagement";
import SettingsPage from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="hierarchy" element={<ChurchHierarchy />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:id" element={<MemberDetails />} />
            <Route path="members/register" element={<RegisterMember />} />
            <Route path="qr-cards" element={<QRCards />} />
            <Route path="scanner" element={<AttendanceScanner />} />
            <Route path="attendance" element={<AttendanceHistory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="engagement" element={<Engagement />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
