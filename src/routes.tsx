import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProgressBar, LoadingBar } from "@/components/ui/ProgressBar";
import i18n from "@/i18n";
import type { Lang } from "@/lib/i18nRouting";
import { GUIDES } from "@/content/guides";
import { lazyPage, registerRoutePreloads } from "@/lib/lazyPage";
import LandingPage from "@/pages/LandingPage";

// Everything except the landing page is split into its own chunk.
const AboutPage = lazyPage(() => import("@/pages/AboutPage"));
const PricingPage = lazyPage(() => import("@/pages/PricingPage"));
const TemplatesPage = lazyPage(() => import("@/pages/TemplatesPage"));
const BlogPage = lazyPage(() => import("@/pages/BlogPage"));
const BlogPostPage = lazyPage(() => import("@/pages/BlogPostPage"));
const ContactPage = lazyPage(() => import("@/pages/ContactPage"));
const GuidePage = lazyPage(() => import("@/pages/GuidePage"));
const NotFoundPage = lazyPage(() => import("@/pages/NotFoundPage"));

// Public pages the prerenderer and hydration preload, keyed by path without /bn
registerRoutePreloads({
  pages: {
    "/about": AboutPage.preload,
    "/pricing": PricingPage.preload,
    "/templates": TemplatesPage.preload,
    "/blog": BlogPage.preload,
    "/contact": ContactPage.preload,
  },
  guide: GuidePage.preload,
  notFound: NotFoundPage.preload,
});
const PublicResumePage = lazy(() => import("@/pages/PublicResumePage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/VerifyEmailPage"));
const DashboardLayout = lazy(() => import("@/components/layout/DashboardLayout").then((m) => ({ default: m.DashboardLayout })));
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const ResumesPage = lazy(() => import("@/pages/dashboard/ResumesPage"));
const ResumeBuilderPage = lazy(() => import("@/pages/dashboard/ResumeBuilderPage"));
const ATSCheckerPage = lazy(() => import("@/pages/dashboard/ATSCheckerPage"));
const CoverLetterPage = lazy(() => import("@/pages/dashboard/CoverLetterPage"));
const BillingPage = lazy(() => import("@/pages/dashboard/BillingPage"));
const SettingsPage = lazy(() => import("@/pages/dashboard/SettingsPage"));
const OverviewPage = lazy(() => import("@/pages/admin/OverviewPage"));
const UsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const PlansPage = lazy(() => import("@/pages/admin/PlansPage"));
const PageContentManagerPage = lazy(() => import("@/pages/admin/PageContentManagerPage"));
const MenuManagerPage = lazy(() => import("@/pages/admin/MenuManagerPage"));
const BkashPaymentsPage = lazy(() => import("@/pages/admin/BkashPaymentsPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));
const AdminTemplatesPage = lazy(() => import("@/pages/admin/TemplatesPage"));
const AdminBlogPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

const page = (node: ReactNode) => <Suspense fallback={<PageFallback />}>{node}</Suspense>;

/**
 * Keeps the UI language in step with the /bn prefix on public pages. It does not
 * persist the choice, so reading an English guide doesn't reset a Bangla user's app language.
 */
function LanguageScope({ lang }: { lang: Lang }) {
  useEffect(() => {
    if (i18n.language !== lang) i18n.changeLanguage(lang);
  }, [lang]);
  return <Outlet />;
}

function RouteLoader() {
  const { pathname } = useLocation();
  useEffect(() => {
    LoadingBar.start();
    const timer = setTimeout(() => LoadingBar.done(), 300);
    window.scrollTo(0, 0);
    return () => clearTimeout(timer);
  }, [pathname]);
  return null;
}

function publicPages() {
  return (
    <>
      <Route index element={<LandingPage />} />
      <Route path="about" element={page(<AboutPage />)} />
      <Route path="pricing" element={page(<PricingPage />)} />
      <Route path="templates" element={page(<TemplatesPage />)} />
      <Route path="blog" element={page(<BlogPage />)} />
      <Route path="blog/:slug" element={page(<BlogPostPage />)} />
      <Route path="contact" element={page(<ContactPage />)} />
      {GUIDES.map((guide) => (
        <Route key={guide.slug} path={guide.slug} element={page(<GuidePage slug={guide.slug} />)} />
      ))}
    </>
  );
}

export function AppRoutes() {
  return (
    <AuthProvider>
      <ProgressBar />
      <RouteLoader />
      <Routes>
        <Route element={<MainLayout />}>
          <Route element={<LanguageScope lang="en" />}>{publicPages()}</Route>
          <Route path="bn" element={<LanguageScope lang="bn" />}>
            {publicPages()}
            <Route path="*" element={page(<NotFoundPage />)} />
          </Route>

          <Route path="login" element={page(<PublicRoute><LoginPage /></PublicRoute>)} />
          <Route path="register" element={page(<PublicRoute><RegisterPage /></PublicRoute>)} />
          <Route path="forgot-password" element={page(<PublicRoute><ForgotPasswordPage /></PublicRoute>)} />
          <Route path="reset-password" element={page(<PublicRoute><ResetPasswordPage /></PublicRoute>)} />
          <Route path="verify-email" element={page(<VerifyEmailPage />)} />
          <Route path="*" element={page(<NotFoundPage />)} />
        </Route>

        <Route path="r/:slug" element={page(<PublicResumePage />)} />

        <Route path="dashboard" element={page(<ProtectedRoute><DashboardLayout /></ProtectedRoute>)}>
          <Route index element={page(<DashboardPage />)} />
          <Route path="resumes" element={page(<ResumesPage />)} />
          <Route path="resumes/new" element={page(<ResumeBuilderPage />)} />
          <Route path="resumes/:id" element={page(<ResumeBuilderPage />)} />
          <Route path="templates" element={page(<TemplatesPage />)} />
          <Route path="ats" element={page(<ATSCheckerPage />)} />
          <Route path="cover-letters" element={page(<CoverLetterPage />)} />
          <Route path="billing" element={page(<BillingPage />)} />
          <Route path="settings" element={page(<SettingsPage />)} />
        </Route>

        <Route path="admin" element={page(<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>)}>
          <Route index element={page(<OverviewPage />)} />
          <Route path="users" element={page(<UsersPage />)} />
          <Route path="bkash-payments" element={page(<BkashPaymentsPage />)} />
          <Route path="plans" element={page(<PlansPage />)} />
          <Route path="content-manager" element={page(<PageContentManagerPage />)} />
          <Route path="menu-manager" element={page(<MenuManagerPage />)} />
          <Route path="blog" element={page(<AdminBlogPage />)} />
          <Route path="settings" element={page(<AdminSettingsPage />)} />
          <Route path="templates" element={page(<AdminTemplatesPage />)} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
