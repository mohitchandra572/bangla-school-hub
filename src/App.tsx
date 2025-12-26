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
import BiometricDevicesManagement from "./pages/dashboard/BiometricDevicesManagement";
import AttendanceReportsPage from "./pages/dashboard/AttendanceReportsPage";
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
import ExamRoutineManagement from "./pages/dashboard/exams/ExamRoutineManagement";
import AdmitCardGeneration from "./pages/dashboard/exams/AdmitCardGeneration";
import ResultsVerification from "./pages/dashboard/exams/ResultsVerification";
import AbsenceResponsePage from "./pages/dashboard/parent/AbsenceResponsePage";
import ParentAttendanceHistory from "./pages/dashboard/parent/ParentAttendanceHistory";
import ParentFeePortal from "./pages/dashboard/parent/ParentFeePortal";
import AbsenceResponsesManagement from "./pages/dashboard/AbsenceResponsesManagement";
import FeeStructureManagement from "./pages/dashboard/fees/FeeStructureManagement";
import TeacherDashboard from "./pages/dashboard/teacher/TeacherDashboard";
import TeacherStudents from "./pages/dashboard/teacher/TeacherStudents";
import TeacherAttendance from "./pages/dashboard/teacher/TeacherAttendance";
import TeacherMarksEntry from "./pages/dashboard/teacher/TeacherMarksEntry";
import TeacherLeave from "./pages/dashboard/teacher/TeacherLeave";
import TeacherProfile from "./pages/dashboard/teacher/TeacherProfile";
import StudentDashboard from "./pages/dashboard/student/StudentDashboard";
import StudentProfile from "./pages/dashboard/student/StudentProfile";
import StudentAttendance from "./pages/dashboard/student/StudentAttendance";
import StudentExams from "./pages/dashboard/student/StudentExams";
import StudentResults from "./pages/dashboard/student/StudentResults";
import StudentAdmitCards from "./pages/dashboard/student/StudentAdmitCards";
import StudentFees from "./pages/dashboard/student/StudentFees";
import StudentNotices from "./pages/dashboard/student/StudentNotices";
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
            <Route path="/dashboard/biometric-devices" element={<BiometricDevicesManagement />} />
            <Route path="/dashboard/attendance-reports" element={<AttendanceReportsPage />} />
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
            <Route path="/dashboard/exams/:examId/routine" element={<ExamRoutineManagement />} />
            <Route path="/dashboard/exams/:examId/admit-cards" element={<AdmitCardGeneration />} />
            <Route path="/dashboard/exams/:examId/verify" element={<ResultsVerification />} />
            <Route path="/dashboard/fees" element={<FeeManagementPage />} />
            <Route path="/dashboard/reports" element={<ReportsPage />} />
            
            {/* Parent Routes */}
            <Route path="/dashboard/parent/absence-response/:attendanceId" element={<AbsenceResponsePage />} />
            <Route path="/dashboard/parent/attendance-history" element={<ParentAttendanceHistory />} />
            <Route path="/dashboard/parent/fees" element={<ParentFeePortal />} />
            
            {/* Admin Management */}
            <Route path="/dashboard/absence-responses" element={<AbsenceResponsesManagement />} />
            <Route path="/dashboard/fee-structure" element={<FeeStructureManagement />} />
            
            {/* Teacher Routes */}
            <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
            <Route path="/dashboard/teacher/my-students" element={<TeacherStudents />} />
            <Route path="/dashboard/teacher/attendance" element={<TeacherAttendance />} />
            <Route path="/dashboard/teacher/marks-entry" element={<TeacherMarksEntry />} />
            <Route path="/dashboard/teacher/leave" element={<TeacherLeave />} />
            <Route path="/dashboard/teacher/profile" element={<TeacherProfile />} />
            
            {/* Student Routes */}
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/dashboard/student/profile" element={<StudentProfile />} />
            <Route path="/dashboard/student/attendance" element={<StudentAttendance />} />
            <Route path="/dashboard/student/exams" element={<StudentExams />} />
            <Route path="/dashboard/student/results" element={<StudentResults />} />
            <Route path="/dashboard/student/admit-cards" element={<StudentAdmitCards />} />
            <Route path="/dashboard/student/fees" element={<StudentFees />} />
            <Route path="/dashboard/student/notices" element={<StudentNotices />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
