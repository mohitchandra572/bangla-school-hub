import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Notices from "./pages/Notices";
import Teachers from "./pages/Teachers";
import Admission from "./pages/Admission";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import SchoolAdminDashboard from "./pages/dashboard/SchoolAdminDashboard";
import StudentsManagement from "./pages/dashboard/StudentsManagement";
import AttendanceManagement from "./pages/dashboard/AttendanceManagement";
import MessagesPage from "./pages/dashboard/MessagesPage";
import SchoolsManagement from "./pages/dashboard/SchoolsManagement";
import SubscriptionPlans from "./pages/dashboard/SubscriptionPlans";
import TeachersManagement from "./pages/dashboard/TeachersManagement";
import ParentsManagement from "./pages/dashboard/ParentsManagement";
import EnhancedAuditLogs from "./pages/dashboard/EnhancedAuditLogs";
import SystemSettings from "./pages/dashboard/SystemSettings";
import BillingOverview from "./pages/dashboard/BillingOverview";
import ClassSectionManagement from "./pages/dashboard/ClassSectionManagement";
import NoticesManagement from "./pages/dashboard/NoticesManagement";
import ExamsManagementPage from "./pages/dashboard/ExamsManagementPage";
import FeeManagementPage from "./pages/dashboard/FeeManagementPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/admission" element={<Admission />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/dashboard/school-admin" element={<SchoolAdminDashboard />} />
            <Route path="/dashboard/students" element={<StudentsManagement />} />
            <Route path="/dashboard/students/new" element={<StudentsManagement />} />
            <Route path="/dashboard/attendance" element={<AttendanceManagement />} />
            <Route path="/dashboard/messages" element={<MessagesPage />} />
            <Route path="/dashboard/schools" element={<SchoolsManagement />} />
            <Route path="/dashboard/plans" element={<SubscriptionPlans />} />
            <Route path="/dashboard/teachers" element={<TeachersManagement />} />
            <Route path="/dashboard/parents" element={<ParentsManagement />} />
            <Route path="/dashboard/audit" element={<EnhancedAuditLogs />} />
            <Route path="/dashboard/system-settings" element={<SystemSettings />} />
            <Route path="/dashboard/billing" element={<BillingOverview />} />
            <Route path="/dashboard/classes" element={<ClassSectionManagement />} />
            <Route path="/dashboard/notices" element={<NoticesManagement />} />
            <Route path="/dashboard/exams" element={<ExamsManagementPage />} />
            <Route path="/dashboard/fees" element={<FeeManagementPage />} />
            <Route path="/dashboard/reports" element={<ReportsPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
