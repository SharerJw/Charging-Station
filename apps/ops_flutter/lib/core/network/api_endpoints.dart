/// All API endpoint constants for the ops app.
///
/// Endpoints aligned with backend controllers:
/// - OpsAuthController     (/api/v1/ops/auth)
/// - OpsStationController  (/api/v1/ops/stations)
/// - AlertController       (/api/v1/ops/alerts)
/// - WorkOrderController   (/api/v1/ops/workorders)
/// - InspectionController  (/api/v1/ops/inspections)
/// - MessageController     (/api/v1/ops/messages)
/// - DispatchController    (/api/v1/ops/dispatch)
/// - DashboardController   (/api/dashboard)
/// - AuthController        (/api/auth)
class ApiEndpoints {
  ApiEndpoints._();

  // ── Auth ──────────────────────────────────────────────────────
  static const String opsLogin = '/api/v1/ops/auth/login';
  static const String refreshToken = '/api/auth/refresh';
  static const String logout = '/api/auth/logout';
  static const String getUserInfo = '/api/v1/ops/user/profile';

  // ── Stations (OpsStationController: /api/v1/ops/stations) ────
  static const String stations = '/api/v1/ops/stations';
  static const String stationDetail = '/api/v1/ops/stations/{id}';

  // ── Devices (OpsStationController: /api/v1/ops/stations) ─────
  static const String deviceDetail = '/api/v1/ops/stations/devices/{id}';
  static const String deviceStatus = '/api/v1/ops/stations/devices/{id}/status';
  static const String deviceFaults = '/api/v1/ops/stations/devices/{id}/faults';
  static String deviceTelemetry(String code) => '/api/v1/ops/stations/devices/$code/telemetry';

  // ── Alerts (AlertController: /api/v1/ops/alerts) ─────────────
  static const String alerts = '/api/v1/ops/alerts';
  static const String alertDetail = '/api/v1/ops/alerts/{id}';
  static const String alertStatistics = '/api/v1/ops/alerts/statistics';
  static String alertHandle(String id) => '/api/v1/ops/alerts/$id/handle';
  static String alertIgnore(String id) => '/api/v1/ops/alerts/$id/ignore';

  // ── Work Orders (WorkOrderController: /api/v1/ops/workorders) ─
  static const String workOrders = '/api/v1/ops/workorders';
  static const String workOrderDetail = '/api/v1/ops/workorders/{id}';
  static const String workOrderCreate = '/api/v1/ops/workorders';
  static const String workOrderStatistics = '/api/v1/ops/workorders/statistics';
  static const String workOrderAssign = '/api/v1/ops/workorders/{id}/assign';
  static String workOrderAccept(String id) => '/api/v1/ops/workorders/$id/accept';
  static String workOrderComplete(String id) => '/api/v1/ops/workorders/$id/complete';

  // ── Inspections (InspectionController: /api/v1/ops/inspections)
  static const String inspections = '/api/v1/ops/inspections';
  static const String inspectionDetail = '/api/v1/ops/inspections/{id}';
  static String inspectionStart(String id) => '/api/v1/ops/inspections/$id/start';
  static String inspectionSubmit(String id) => '/api/v1/ops/inspections/$id/submit';

  // ── Messages (MessageController: /api/v1/ops/messages) ───────
  static const String messages = '/api/v1/ops/messages';
  static const String messageUnreadCount = '/api/v1/ops/messages/unread-count';
  static String messageRead(String id) => '/api/v1/ops/messages/$id/read';
  static String messageReadAll({String? type}) =>
      '/api/v1/ops/messages/read-all${type != null ? '?type=$type' : ''}';

  // ── Dispatch (DispatchController: /api/v1/ops/dispatch) ──────
  static const String dispatchRules = '/api/v1/ops/dispatch/rules';
  static String dispatchRuleDetail(String id) => '/api/v1/ops/dispatch/rules/$id';
  static const String dispatchRecords = '/api/v1/ops/dispatch/records';
  static const String operators = '/api/v1/ops/dispatch/operators';

  // ── Dashboard (DashboardController: /api/dashboard) ──────────
  static const String dashboardOverview = '/api/dashboard/overview';
  static const String dashboardAlerts = '/api/dashboard/alerts';
  static const String dashboardTrend = '/api/dashboard/trend';
  static const String dashboardStationRank = '/api/dashboard/station-rank';
  static const String dashboardRecentOrders = '/api/dashboard/recent-orders';
  static const String dashboardTodoCounts = '/api/dashboard/todo-counts';
}
