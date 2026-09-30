import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { MarketingLayout } from '../components/layout/MarketingLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { FullPageLoader } from '../components/ui/FullPageLoader';
import { GuestRoute, ProtectedRoute } from './guards';
import { lazyPage } from './lazyPage';

const LandingPage = lazyPage(() => import('../pages/marketing/LandingPage'), 'LandingPage');
const FeaturesPage = lazyPage(() => import('../pages/marketing/FeaturesPage'), 'FeaturesPage');
const PricingPage = lazyPage(() => import('../pages/marketing/PricingPage'), 'PricingPage');
const ContactPage = lazyPage(() => import('../pages/marketing/ContactPage'), 'ContactPage');
const LoginPage = lazyPage(() => import('../pages/auth/LoginPage'), 'LoginPage');
const RegisterPage = lazyPage(() => import('../pages/auth/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = lazyPage(() => import('../pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyPage(() => import('../pages/auth/ResetPasswordPage'), 'ResetPasswordPage');
const DashboardPage = lazyPage(() => import('../pages/app/DashboardPage'), 'DashboardPage');
const InvoicesPage = lazyPage(() => import('../pages/app/InvoicesPage'), 'InvoicesPage');
const InvoiceEditorPage = lazyPage(() => import('../pages/app/InvoiceEditorPage'), 'InvoiceEditorPage');
const InvoiceDetailPage = lazyPage(() => import('../pages/app/InvoiceDetailPage'), 'InvoiceDetailPage');
const ClientsPage = lazyPage(() => import('../pages/app/ClientsPage'), 'ClientsPage');
const ClientDetailPage = lazyPage(() => import('../pages/app/ClientDetailPage'), 'ClientDetailPage');
const AnalyticsPage = lazyPage(() => import('../pages/app/AnalyticsPage'), 'AnalyticsPage');
const ActivityPage = lazyPage(() => import('../pages/app/ActivityPage'), 'ActivityPage');
const SettingsPage = lazyPage(() => import('../pages/app/SettingsPage'), 'SettingsPage');
const NotFoundPage = lazyPage(() => import('../pages/NotFoundPage'), 'NotFoundPage');

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/invoices" element={<InvoicesPage />} />
          <Route path="/app/invoices/new" element={<InvoiceEditorPage />} />
          <Route path="/app/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/app/invoices/:id/edit" element={<InvoiceEditorPage />} />
          <Route path="/app/clients" element={<ClientsPage />} />
          <Route path="/app/clients/:id" element={<ClientDetailPage />} />
          <Route path="/app/analytics" element={<AnalyticsPage />} />
          <Route path="/app/activity" element={<ActivityPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Suspense fallback={<FullPageLoader />}><NotFoundPage /></Suspense>} />
    </Routes>
  );
}
