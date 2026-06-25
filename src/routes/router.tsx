import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import CustomerRoute from './CustomerRoute';
import RoleRedirect from './RoleRedirect';
import AdminShell from '../layouts/AdminShell';
import CustomerShell from '../layouts/CustomerShell';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import AcceptInvitePage from '../pages/AcceptInvitePage';
import DashboardPage from '../pages/DashboardPage';
import SessionsPage from '../pages/SessionsPage';
import SessionDetailPage from '../pages/SessionDetailPage';
import WorkoutPlanPage from '../pages/WorkoutPlanPage';
import ExerciseDetailPage from '../pages/ExerciseDetailPage';
import MetricsPage from '../pages/MetricsPage';
import AvailabilityPage from '../pages/AvailabilityPage';
import PaymentsPage from '../pages/PaymentsPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import CustomersPage from '../pages/admin/CustomersPage';
import CustomerDetailPage from '../pages/admin/CustomerDetailPage';
import CreateCustomerPage from '../pages/admin/CreateCustomerPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import CreateAdminUserPage from '../pages/admin/CreateAdminUserPage';
import AdminUserDetailPage from '../pages/admin/AdminUserDetailPage';
import AppBuilderPage from '../pages/admin/app-builder/AppBuilderPage';
import BrandingSettingsPage from '../pages/admin/app-builder/BrandingSettingsPage';
import DashboardBuilderPage from '../pages/admin/app-builder/DashboardBuilderPage';
import ContentBlocksPage from '../pages/admin/app-builder/ContentBlocksPage';
import NavigationBuilderPage from '../pages/admin/app-builder/NavigationBuilderPage';
import PolicySettingsPage from '../pages/admin/app-builder/PolicySettingsPage';
import LanguageSettingsPage from '../pages/admin/app-builder/LanguageSettingsPage';
import FeatureFlagsPage from '../pages/admin/app-builder/FeatureFlagsPage';
import CustomerPreviewPage from '../pages/admin/app-builder/CustomerPreviewPage';
import ExercisesPage from '../pages/admin/ExercisesPage';
import ExerciseEditorPage from '../pages/admin/ExerciseEditorPage';
import WorkoutPlansPage from '../pages/admin/WorkoutPlansPage';
import WorkoutPlanEditorPage from '../pages/admin/WorkoutPlanEditorPage';
import AdminSessionsPage from '../pages/admin/SessionsPage';
import BookingsPage from '../pages/admin/BookingsPage';
import AdminPaymentsPage from '../pages/admin/PaymentsPage';
import PackagesPage from '../pages/admin/PackagesPage';
import AdminSettingsPage from '../pages/admin/SettingsPage';
import AdminNotificationsPage from '../pages/admin/NotificationsPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';

export const router = createBrowserRouter([
  { path: '/', element: <ProtectedRoute />, children: [{ index: true, element: <RoleRedirect /> }] },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/accept-invite', element: <AcceptInvitePage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <CustomerRoute />,
        children: [
          { element: <CustomerShell />, children: [
            { path: '/dashboard', element: <DashboardPage /> },
            { path: '/sessions', element: <SessionsPage /> },
            { path: '/sessions/:id', element: <SessionDetailPage /> },
            { path: '/workout-plan', element: <WorkoutPlanPage /> },
            { path: '/exercises/:id', element: <ExerciseDetailPage /> },
            { path: '/metrics', element: <MetricsPage /> },
            { path: '/availability', element: <AvailabilityPage /> },
            { path: '/payments', element: <PaymentsPage /> },
            { path: '/notifications', element: <NotificationsPage /> },
            { path: '/settings', element: <SettingsPage /> },
          ]},
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          { path: '/admin', element: <AdminShell />, children: [
            { index: true, element: <AdminDashboardPage /> },
            { path: 'customers', element: <CustomersPage /> },
            { path: 'customers/new', element: <CreateCustomerPage /> },
            { path: 'customers/:id', element: <CustomerDetailPage /> },
            { path: 'admins', element: <AdminUsersPage /> },
            { path: 'admins/new', element: <CreateAdminUserPage /> },
            { path: 'admins/:id', element: <AdminUserDetailPage /> },
            { path: 'app-builder', element: <AppBuilderPage /> },
            { path: 'app-builder/branding', element: <BrandingSettingsPage /> },
            { path: 'app-builder/dashboard', element: <DashboardBuilderPage /> },
            { path: 'app-builder/content', element: <ContentBlocksPage /> },
            { path: 'app-builder/navigation', element: <NavigationBuilderPage /> },
            { path: 'app-builder/policies', element: <PolicySettingsPage /> },
            { path: 'app-builder/languages', element: <LanguageSettingsPage /> },
            { path: 'app-builder/features', element: <FeatureFlagsPage /> },
            { path: 'app-builder/preview', element: <CustomerPreviewPage /> },
            { path: 'exercises', element: <ExercisesPage /> },
            { path: 'exercises/new', element: <ExerciseEditorPage /> },
            { path: 'exercises/:id', element: <ExerciseEditorPage /> },
            { path: 'workout-plans', element: <WorkoutPlansPage /> },
            { path: 'workout-plans/new', element: <WorkoutPlanEditorPage /> },
            { path: 'workout-plans/:id', element: <WorkoutPlanEditorPage /> },
            { path: 'sessions', element: <AdminSessionsPage /> },
            { path: 'bookings', element: <BookingsPage /> },
            { path: 'payments', element: <AdminPaymentsPage /> },
            { path: 'packages', element: <PackagesPage /> },
            { path: 'settings', element: <AdminSettingsPage /> },
            { path: 'notifications', element: <AdminNotificationsPage /> },
            { path: 'audit-logs', element: <AuditLogsPage /> },
          ]},
        ],
      },
    ],
  },
]);
