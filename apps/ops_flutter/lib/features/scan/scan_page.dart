import 'package:flutter/material.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'package:ops_flutter/core/theme/app_theme.dart';

class ScanPage extends StatefulWidget {
  const ScanPage({super.key});

  @override
  State<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends State<ScanPage> {
  MobileScannerController? _controller;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null || barcode.rawValue == null) return;

    setState(() => _isProcessing = true);
    final code = barcode.rawValue!;

    // Try to parse as device code or URL
    EasyLoading.showSuccess('扫码结果: $code');

    // Navigate back with result after a short delay
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        context.pop(code);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('扫码', style: TextStyle(color: Colors.white)),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          // Camera preview
          MobileScanner(
            controller: _controller!,
            onDetect: _onDetect,
          ),

          // Overlay with scan frame
          _buildOverlay(),

          // Bottom tips
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  '将二维码放入框内，即可自动扫描',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ),
            ),
          ),

          // Flash toggle
          Positioned(
            bottom: 30,
            left: 0,
            right: 0,
            child: Center(
              child: IconButton(
                onPressed: () => _controller?.toggleTorch(),
                icon: const Icon(Icons.flashlight_on_rounded, color: Colors.white70, size: 28),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverlay() {
    const scanSize = 250.0;
    return ColorFiltered(
      colorFilter: const ColorFilter.mode(Colors.black54, BlendMode.srcOut),
      child: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(color: Colors.transparent),
            child: Center(
              child: Container(
                width: scanSize,
                height: scanSize,
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
          // Corner decorations
          Center(
            child: SizedBox(
              width: scanSize,
              height: scanSize,
              child: CustomPaint(painter: _ScanFramePainter()),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScanFramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.brandBlue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    const cornerLen = 30.0;
    const radius = 16.0;

    // Top-left
    canvas.drawArc(const Rect.fromLTWH(0, 0, radius * 2, radius * 2), -3.14, 1.57, false, paint);
    canvas.drawLine(const Offset(0, radius), const Offset(0, cornerLen), paint);
    canvas.drawLine(const Offset(radius, 0), const Offset(cornerLen, 0), paint);

    // Top-right
    canvas.drawArc(Rect.fromLTWH(size.width - radius * 2, 0, radius * 2, radius * 2), -1.57, 1.57, false, paint);
    canvas.drawLine(Offset(size.width, radius), Offset(size.width, cornerLen), paint);
    canvas.drawLine(Offset(size.width - radius, 0), Offset(size.width - cornerLen, 0), paint);

    // Bottom-left
    canvas.drawArc(Rect.fromLTWH(0, size.height - radius * 2, radius * 2, radius * 2), 1.57, 1.57, false, paint);
    canvas.drawLine(Offset(0, size.height - radius), Offset(0, size.height - cornerLen), paint);
    canvas.drawLine(Offset(radius, size.height), Offset(cornerLen, size.height), paint);

    // Bottom-right
    canvas.drawArc(Rect.fromLTWH(size.width - radius * 2, size.height - radius * 2, radius * 2, radius * 2), 0, 1.57, false, paint);
    canvas.drawLine(Offset(size.width, size.height - radius), Offset(size.width, size.height - cornerLen), paint);
    canvas.drawLine(Offset(size.width - radius, size.height), Offset(size.width - cornerLen, size.height), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
