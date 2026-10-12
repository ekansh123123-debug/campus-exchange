import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell.jsx';
import {
  RequireAuth,
  RequireVerifiedStudent,
  RequireAdmin,
} from './route-guards.jsx';
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '../features/auth/AuthPages.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { MarketplacePage } from '../features/marketplace/MarketplacePage.jsx';
import {
  ListingDetailPage,
  CreateEditListingPage,
  MyListingsPage,
} from '../features/listings/ListingPages.jsx';
import { WishlistPage } from '../features/wishlist/WishlistPage.jsx';
import { MessagesPage } from '../features/conversations/MessagesPage.jsx';
import { TransactionsPage } from '../features/transactions/TransactionsPage.jsx';
import {
  ResourcesPage,
  UploadResourcePage,
} from '../features/resources/ResourcesPages.jsx';
import { ProfilePage } from '../features/profile/ProfilePage.jsx';
import { NotificationsPage } from '../features/notifications/NotificationsPage.jsx';
import {
  AdminDashboardPage,
  AdminListingsPage,
  AdminResourcesPage,
  AdminUsersPage,
  AdminReportsPage,
} from '../features/admin/AdminPages.jsx';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Public & Guest Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/listings/:listingCode" element={<ListingDetailPage />} />
        <Route path="/resources" element={<ResourcesPage />} />

        {/* Authenticated Student Routes */}
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Route>

        {/* Verified Student Only Routes */}
        <Route element={<RequireVerifiedStudent />}>
          <Route path="/listings/new" element={<CreateEditListingPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationCode" element={<MessagesPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/resources/upload" element={<UploadResourcePage />} />
        </Route>

        {/* Admin Governance Routes */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/listings" element={<AdminListingsPage />} />
          <Route path="/admin/resources" element={<AdminResourcesPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
