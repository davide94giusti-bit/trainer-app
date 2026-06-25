import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import CustomerRoute from './CustomerRoute';
import AppShell from '../layouts/AppShell';
import AdminShell from '../layouts/AdminShell';
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
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/accept-invite', element: <AcceptInvitePage /> },
  { element: <ProtectedRoute />, children: [{ element: <AppShell />, children: [
    { element: <CustomerRoute />, children: [
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
    { element: <AdminRoute />, children: [{ path: '/admin', element: <AdminShell />, children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/new', element: <CreateCustomerPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },
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
    ]}]},
  ]}]},
]);
