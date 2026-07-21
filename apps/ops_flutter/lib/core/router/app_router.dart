import 'package:go_router/go_router.dart';
import 'package:ops_flutter/core/providers/auth_provider.dart';
import 'package:ops_flutter/features/alert/alert_detail_page.dart';
import 'package:ops_flutter/features/alert/alert_list_page.dart';
import 'package:ops_flutter/features/alert/alert_stats_page.dart';
import 'package:ops_flutter/features/auth/login_page.dart';
import 'package:ops_flutter/features/dashboard/dashboard_page.dart';
import 'package:ops_flutter/features/dispatch/dispatch_page.dart';
import 'package:ops_flutter/features/inspection/inspection_exec_page.dart';
import 'package:ops_flutter/features/inspection/inspection_list_page.dart';
import 'package:ops_flutter/features/inspection/inspection_report_page.dart';
import 'package:ops_flutter/features/knowledge/knowledge_page.dart';
import 'package:ops_flutter/features/messages/messages_page.dart';
import 'package:ops_flutter/features/profile/profile_page.dart';
import 'package:ops_flutter/features/remote_control/remote_control_page.dart';
import 'package:ops_flutter/features/shift_handover/shift_handover_page.dart';
import 'package:ops_flutter/features/spare_parts/spare_parts_page.dart';
import 'package:ops_flutter/features/scan/scan_page.dart';
import 'package:ops_flutter/features/settings/about_page.dart';
import 'package:ops_flutter/features/settings/change_password_page.dart';
import 'package:ops_flutter/features/settings/notification_settings_page.dart';
import 'package:ops_flutter/features/settings/settings_page.dart';
import 'package:ops_flutter/features/station/device_detail_page.dart';
import 'package:ops_flutter/features/station/station_page.dart';
import 'package:ops_flutter/features/workorder/workorder_create_page.dart';
import 'package:ops_flutter/features/workorder/workorder_detail_page.dart';
import 'package:ops_flutter/features/workorder/workorder_list_page.dart';
import 'package:ops_flutter/features/workorder/workorder_process_page.dart';
import 'package:ops_flutter/features/workorder/workorder_stats_page.dart';
import 'package:ops_flutter/features/profile/profile_edit_page.dart';
import 'package:ops_flutter/shared/widgets/app_scaffold.dart';

// ── Route Names ────────────────────────────────────────────────

class RouteNames {
  RouteNames._();

  static const String login = 'login';
  static const String home = 'home';
  static const String dashboard = 'dashboard';
  static const String alerts = 'alerts';
  static const String messages = 'messages';
  static const String workOrders = 'workOrders';
  static const String profile = 'profile';

  // Detail routes
  static const String stationDetail = 'stationDetail';
  static const String deviceDetail = 'deviceDetail';
  static const String alertDetail = 'alertDetail';
  static const String alertStats = 'alertStats';
  static const String workOrderDetail = 'workOrderDetail';
  static const String workOrderProcess = 'workOrderProcess';
  static const String workOrderStats = 'workOrderStats';
  static const String inspectionDetail = 'inspectionDetail';
  static const String inspectionExec = 'inspectionExec';
  static const String inspectionReport = 'inspectionReport';
  static const String inspectionList = 'inspectionList';
  static const String workOrderCreate = 'workOrderCreate';
  static const String profileEdit = 'profileEdit';
  static const String settings = 'settings';
  static const String about = 'about';
  static const String changePassword = 'changePassword';
  static const String scanQr = 'scanQr';
  static const String notificationSettings = 'notificationSettings';
  static const String dispatch = 'dispatch';
  static const String remoteControl = 'remoteControl';
  static const String spareParts = 'spareParts';
  static const String knowledge = 'knowledge';
  static const String shiftHandover = 'shiftHandover';
}

// ── Route Paths ────────────────────────────────────────────────

class RoutePaths {
  RoutePaths._();

  static const String login = '/login';
  static const String home = '/home';
  static const String dashboard = '/dashboard';
  static const String alerts = '/alerts';
  static const String messages = '/messages';
  static const String workOrders = '/work-orders';
  static const String profile = '/profile';

  // Detail routes
  static const String stationDetail = '/station/:id';
  static const String station = '/station';
  static const String deviceDetail = '/device/:id';
  static const String alertDetail = '/alert/:id';
  static const String alertStats = '/alert-stats';
  static const String workOrderDetail = '/work-order/:id';
  static const String workOrderProcess = '/work-order/:id/process';
  static const String workOrderStats = '/work-order-stats';
  static const String inspectionDetail = '/inspection/:id';
  static const String inspectionExec = '/inspection/:id/execute';
  static const String inspectionReport = '/inspection/:id/report';
  static const String inspectionList = '/inspection';
  static const String workOrderCreate = '/work-order/create';
  static const String profileEdit = '/profile/edit';
  static const String settings = '/settings';
  static const String about = '/settings/about';
  static const String changePassword = '/settings/change-password';
  static const String scanQr = '/scan';
  static const String notificationSettings = '/settings/notifications';
  static const String dispatch = '/dispatch';
  static const String remoteControl = '/remote-control';
  static const String spareParts = '/spare-parts';
  static const String knowledge = '/knowledge';
  static const String shiftHandover = '/shift-handover';
}

/// Creates the GoRouter instance with StatefulShellRoute for tab state preservation.
GoRouter createRouter(AuthProvider authProvider) {
  return GoRouter(
    initialLocation: RoutePaths.home,
    redirect: (context, state) {
      final isLoggedIn = authProvider.isAuthenticated;
      final isLoginPage = state.matchedLocation == RoutePaths.login;

      if (!isLoggedIn && !isLoginPage) {
        return RoutePaths.login;
      }
      if (isLoggedIn && isLoginPage) {
        return RoutePaths.home;
      }
      return null;
    },
    routes: [
      // ── Login ────────────────────────────────────────────────
      GoRoute(
        path: RoutePaths.login,
        name: RouteNames.login,
        builder: (context, state) => const LoginPage(),
      ),

      // ── StatefulShellRoute (bottom tab navigation with state preservation) ──
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppScaffold(navigationShell: navigationShell);
        },
        branches: [
          // ── Branch 0: Dashboard ──────────────────────────────
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.home,
                name: RouteNames.home,
                builder: (context, state) => const DashboardPage(),
              ),
            ],
          ),
          // ── Branch 1: Alerts ─────────────────────────────────
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.alerts,
                name: RouteNames.alerts,
                builder: (context, state) => const AlertListPage(),
              ),
            ],
          ),
          // ── Branch 2: Messages ───────────────────────────────
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.messages,
                name: RouteNames.messages,
                builder: (context, state) => const MessagesPage(),
              ),
            ],
          ),
          // ── Branch 3: Work Orders ────────────────────────────
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.workOrders,
                name: RouteNames.workOrders,
                builder: (context, state) => const WorkOrderListPage(),
              ),
            ],
          ),
          // ── Branch 4: Profile ────────────────────────────────
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.profile,
                name: RouteNames.profile,
                builder: (context, state) => const ProfilePage(),
              ),
            ],
          ),
        ],
      ),

      // ── Station Route ───────────────────────────────────────
      GoRoute(
        path: RoutePaths.station,
        name: RouteNames.stationDetail,
        builder: (context, state) => const StationPage(),
      ),
      GoRoute(
        path: RoutePaths.stationDetail,
        name: '${RouteNames.stationDetail}_detail',
        builder: (context, state) => const StationPage(),
      ),

      // ── Device Detail Route ─────────────────────────────────
      GoRoute(
        path: RoutePaths.deviceDetail,
        name: RouteNames.deviceDetail,
        builder: (context, state) => DeviceDetailPage(
          deviceId: state.pathParameters['id']!,
        ),
      ),

      // ── Alert Routes ────────────────────────────────────────
      GoRoute(
        path: RoutePaths.alertDetail,
        name: RouteNames.alertDetail,
        builder: (context, state) => AlertDetailPage(
          alertId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: RoutePaths.alertStats,
        name: RouteNames.alertStats,
        builder: (context, state) => const AlertStatsPage(),
      ),

      // ── Work Order Routes ───────────────────────────────────
      GoRoute(
        path: RoutePaths.workOrderDetail,
        name: RouteNames.workOrderDetail,
        builder: (context, state) => WorkOrderDetailPage(
          workOrderId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: RoutePaths.workOrderProcess,
        name: RouteNames.workOrderProcess,
        builder: (context, state) => WorkOrderProcessPage(
          workOrderId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: RoutePaths.workOrderStats,
        name: RouteNames.workOrderStats,
        builder: (context, state) => const WorkOrderStatsPage(),
      ),
      GoRoute(
        path: RoutePaths.workOrderCreate,
        name: RouteNames.workOrderCreate,
        builder: (context, state) => const WorkOrderCreatePage(),
      ),

      // ── Inspection Routes ───────────────────────────────────
      GoRoute(
        path: RoutePaths.inspectionList,
        name: RouteNames.inspectionList,
        builder: (context, state) => const InspectionListPage(),
      ),
      GoRoute(
        path: RoutePaths.inspectionExec,
        name: RouteNames.inspectionExec,
        builder: (context, state) => InspectionExecPage(
          inspectionId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: RoutePaths.inspectionReport,
        name: RouteNames.inspectionReport,
        builder: (context, state) => InspectionReportPage(
          inspectionId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: RoutePaths.inspectionDetail,
        name: RouteNames.inspectionDetail,
        builder: (context, state) => InspectionReportPage(
          inspectionId: state.pathParameters['id']!,
        ),
      ),

      // ── Profile Routes ──────────────────────────────────────
      GoRoute(
        path: RoutePaths.profileEdit,
        name: RouteNames.profileEdit,
        builder: (context, state) => const ProfileEditPage(),
      ),

      // ── Settings Routes ─────────────────────────────────────
      GoRoute(
        path: RoutePaths.settings,
        name: RouteNames.settings,
        builder: (context, state) => const SettingsPage(),
      ),
      GoRoute(
        path: RoutePaths.about,
        name: RouteNames.about,
        builder: (context, state) => const AboutPage(),
      ),
      GoRoute(
        path: RoutePaths.changePassword,
        name: RouteNames.changePassword,
        builder: (context, state) => const ChangePasswordPage(),
      ),
      GoRoute(
        path: RoutePaths.notificationSettings,
        name: RouteNames.notificationSettings,
        builder: (context, state) => const NotificationSettingsPage(),
      ),

      // ── Scan Route ──────────────────────────────────────────
      GoRoute(
        path: RoutePaths.scanQr,
        name: RouteNames.scanQr,
        builder: (context, state) => const ScanPage(),
      ),

      // ── Feature Routes ──────────────────────────────────────
      GoRoute(
        path: RoutePaths.dispatch,
        name: RouteNames.dispatch,
        builder: (context, state) => const DispatchPage(),
      ),
      GoRoute(
        path: RoutePaths.remoteControl,
        name: RouteNames.remoteControl,
        builder: (context, state) => const RemoteControlPage(),
      ),
      GoRoute(
        path: RoutePaths.spareParts,
        name: RouteNames.spareParts,
        builder: (context, state) => const SparePartsPage(),
      ),
      GoRoute(
        path: RoutePaths.knowledge,
        name: RouteNames.knowledge,
        builder: (context, state) => const KnowledgePage(),
      ),
      GoRoute(
        path: RoutePaths.shiftHandover,
        name: RouteNames.shiftHandover,
        builder: (context, state) => const ShiftHandoverPage(),
      ),
    ],
  );
}


