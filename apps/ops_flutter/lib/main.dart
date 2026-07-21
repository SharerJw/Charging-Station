import 'package:flutter/material.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/providers/auth_provider.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/storage/storage_service.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialise storage.
  final storage = StorageService();
  await storage.init();

  // Initialise API client.
  await ApiClient.init(storage: storage);

  runApp(EVChargingOpsApp(storage: storage));
}

class EVChargingOpsApp extends StatelessWidget {
  final StorageService storage;

  const EVChargingOpsApp({super.key, required this.storage});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(storage)),
      ],
      child: const _AppRoot(),
    );
  }
}

class _AppRoot extends StatefulWidget {
  const _AppRoot();

  @override
  State<_AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<_AppRoot> {
  late final Future<void> _initFuture;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>();
    _router = createRouter(auth);
    // 监听认证状态变更，刷新路由重定向（避免每次 build 重建 Router）
    auth.addListener(_onAuthChanged);
    _initFuture = auth.tryAutoLogin();
  }

  @override
  void dispose() {
    // 安全移除监听，避免内存泄漏
    try {
      context.read<AuthProvider>().removeListener(_onAuthChanged);
    } catch (_) {
      // Provider 已被释放时忽略
    }
    super.dispose();
  }

  void _onAuthChanged() {
    _router.refresh();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: _initFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            home: const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        return MaterialApp.router(
          title: 'EV 运维端',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          routerConfig: _router,
          builder: EasyLoading.init(),
        );
      },
    );
  }
}
