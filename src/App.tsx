import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/toast";
import { ProgressBar, LoadingBar } from "@/components/ui/ProgressBar";
import { PageContentProvider } from "@/context/PageContentContext";

import LandingPage from "@/pages/LandingPage";
import PricingPage from "@/pages/PricingPage";
import TemplatesPage from "@/pages/TemplatesPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import ContactPage from "@/pages/ContactPage";
import PublicResumePage from "@/pages/PublicResumePage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ResumesPage from "@/pages/dashboard/ResumesPage";
import ResumeBuilderPage from "@/pages/dashboard/ResumeBuilderPage";
import ATSCheckerPage from "@/pages/dashboard/ATSCheckerPage";
import CoverLetterPage from "@/pages/dashboard/CoverLetterPage";
import BillingPage from "@/pages/dashboard/BillingPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import OverviewPage from "@/pages/admin/OverviewPage";
import UsersPage from "@/pages/admin/UsersPage";
import PageContentManagerPage from "@/pages/admin/PageContentManagerPage";
import BkashPaymentsPage from "@/pages/admin/BkashPaymentsPage";
import AdminSettingsPage from "@/pages/admin/SettingsPage";
import AdminTemplatesPage from "@/pages/admin/TemplatesPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Component to handle route change loading bar
function RouteLoader() {
  const location = useLocation();

  useEffect(() => {
    // Start the loading bar when route changes
    LoadingBar.start();

    // Simulate completion after a short delay
    // In real apps, you might want to tie this to actual data loading
    const timer = setTimeout(() => {
      LoadingBar.done();
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <ProgressBar />
      <RouteLoader />
      <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogPostPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        <Route path="verify-email" element={<PublicRoute><VerifyEmailPage /></PublicRoute>} />
      </Route>

      <Route path="r/:slug" element={<PublicResumePage />} />

      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="resumes" element={<ResumesPage />} />
        <Route path="resumes/new" element={<ResumeBuilderPage />} />
        <Route path="resumes/:id" element={<ResumeBuilderPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="ats" element={<ATSCheckerPage />} />
        <Route path="cover-letters" element={<CoverLetterPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="bkash-payments" element={<BkashPaymentsPage />} />
        <Route path="content-manager" element={<PageContentManagerPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="templates" element={<AdminTemplatesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default function App() {
  const content = (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <PageContentProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster />
          </BrowserRouter>
        </PageContentProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
  }
  return content;
}
