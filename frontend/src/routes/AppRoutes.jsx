import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { VerifyLoginOtp } from '@/pages/VerifyLoginOtp';
import { VerifyRegisterOtp } from '@/pages/VerifyRegisterOtp';
import { Dashboard } from '@/pages/Dashboard';
import { StudentProfile } from '@/pages/StudentProfile';
import { SkillEvidence } from '@/pages/SkillEvidence';
import { CareerRoles } from '@/pages/CareerRoles';
import { GapAnalysis } from '@/pages/GapAnalysis';
import { GapAnalysisResult } from '@/pages/GapAnalysisResult';
import { GapAnalysisHistory } from '@/pages/GapAnalysisHistory';
import { Roadmap } from '@/pages/Roadmap';
import { RoadmapHistory } from '@/pages/RoadmapHistory';
import { Reports } from '@/pages/Reports';
import { ReportDetail } from '@/pages/ReportDetail';
import { Notifications } from '@/pages/Notifications';
import { ResumeList } from '@/pages/ResumeList';
import { ResumeUpload } from '@/pages/ResumeUpload';
import { ResumeReview } from '@/pages/ResumeReview';
import { AuthLanding } from '@/pages/AuthLanding';
import { ChangePassword } from '@/pages/ChangePassword';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { CreateMentor } from '@/pages/admin/CreateMentor';
import { AdminMentors } from '@/pages/admin/AdminMentors';
import { AdminStudents } from '@/pages/admin/AdminStudents';
import { AssignMentor } from '@/pages/admin/AssignMentor';
import { AdminCareerRoles } from '@/pages/admin/AdminCareerRoles';
import { ReviewAiRoles } from '@/pages/admin/ReviewAiRoles';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { AdminActivityLog } from '@/pages/admin/AdminActivityLog';
import { MentorDashboard } from '@/pages/mentor/MentorDashboard';
import { MentorStudents } from '@/pages/mentor/MentorStudents';
import { MentorStudentDetail } from '@/pages/mentor/MentorStudentDetail';
import { MentorEvidenceReview } from '@/pages/mentor/MentorEvidenceReview';
import { MentorReviewHistory } from '@/pages/mentor/MentorReviewHistory';
import { MentorStudentGapReports } from '@/pages/mentor/MentorStudentGapReports';
import { MentorStudentRoadmap } from '@/pages/mentor/MentorStudentRoadmap';
import { NotFound } from '@/pages/NotFound';
import { ProtectedRoute } from './ProtectedRoute';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth" element={<AuthLanding />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-register-otp" element={<VerifyRegisterOtp />} />
          <Route path="/verify-login-otp" element={<VerifyLoginOtp />} />
        </Route>

        <Route
          element={
            <ProtectedRoute roles={['student']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/evidence" element={<SkillEvidence />} />
          <Route path="/roles" element={<CareerRoles />} />
          <Route path="/gaps" element={<GapAnalysis />} />
          <Route path="/gaps/history" element={<GapAnalysisHistory />} />
          <Route path="/gaps/:id" element={<GapAnalysisResult />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/roadmap/history" element={<RoadmapHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:type" element={<ReportDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/resumes" element={<ResumeList />} />
          <Route path="/resumes/upload" element={<ResumeUpload />} />
          <Route path="/resumes/:id/review" element={<ResumeReview />} />
        </Route>

        <Route element={<ProtectedRoute roles={['mentor']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="/mentor/dashboard" element={<MentorDashboard />} />
          <Route path="/mentor/students" element={<MentorStudents />} />
          <Route path="/mentor/students/:studentId" element={<MentorStudentDetail />} />
          <Route path="/mentor/students/:studentId/gap-reports" element={<MentorStudentGapReports />} />
          <Route path="/mentor/students/:studentId/roadmap" element={<MentorStudentRoadmap />} />
          <Route path="/mentor/evidence-review" element={<MentorEvidenceReview />} />
          <Route path="/mentor/reviews" element={<MentorReviewHistory />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/mentors/create" element={<CreateMentor />} />
          <Route path="/admin/mentors" element={<AdminMentors />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/students/assign" element={<AssignMentor />} />
          <Route path="/admin/career-roles" element={<AdminCareerRoles />} />
          <Route path="/admin/career-roles/review" element={<ReviewAiRoles />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/activity" element={<AdminActivityLog />} />
        </Route>

        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
