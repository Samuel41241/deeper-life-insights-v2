import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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
import UserManagement from "./pages/admin/UserManagement";
import NewcomerEntry from "./pages/admin/NewcomerEntry";
import Messaging from "./pages/admin/Messaging";
import CreateAdmin from "./pages/admin/CreateAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="hierarchy" element={<ChurchHierarchy />} />
              <Route path="members" element={<Members />} />
              <Route path="members/:id" element={<MemberDetails />} />
              <Route path="members/register" element={<RegisterMember />} />
              <Route path="qr-cards" element={<QRCards />} />
              <Route path="scanner" element={<AttendanceScanner />} />
              <Route path="newcomers" element={<NewcomerEntry />} />
              <Route path="attendance" element={<AttendanceHistory />} />
              <Route path="reports" element={<Reports />} />
              <Route path="engagement" element={<Engagement />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="messaging" element={<Messaging />} />
              <Route path="create-admin" element={<CreateAdmin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;