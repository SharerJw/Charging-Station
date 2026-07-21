import 'package:flutter/material.dart';

/// App theme configuration following project design specs.
/// Brand blue #1677FF, background #F0F2F5, status colors defined.
class AppTheme {
  AppTheme._();

  // ── Brand Colors ──────────────────────────────────────────────
  static const Color brandBlue = Color(0xFF1677FF);
  static const Color brandBlueLight = Color(0xFF4096FF);
  static const Color brandBlueDark = Color(0xFF0958D9);

  // ── Background Colors ─────────────────────────────────────────
  static const Color backgroundLight = Color(0xFFF0F2F5);
  static const Color backgroundWhite = Color(0xFFFFFFFF);
  static const Color backgroundCard = Color(0xFFFFFFFF);

  // ── Status Colors ─────────────────────────────────────────────
  static const Color success = Color(0xFF52C41A);
  static const Color warning = Color(0xFFFAAD14);
  static const Color error = Color(0xFFFF4D4F);
  static const Color info = Color(0xFF1677FF);

  // ── Text Colors ───────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF1F1F1F);
  static const Color textSecondary = Color(0xFF8C8C8C);
  static const Color textHint = Color(0xFFBFBFBF);
  static const Color textWhite = Color(0xFFFFFFFF);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // ── Border / Divider ──────────────────────────────────────────
  static const Color border = Color(0xFFE8E8E8);
  static const Color divider = Color(0xFFF0F0F0);

  // ── Spacing ───────────────────────────────────────────────────
  static const double spacingXxs = 2;
  static const double spacingXs = 4;
  static const double spacingSm = 8;
  static const double spacingMd = 12;
  static const double spacingLg = 16;
  static const double spacingXl = 24;
  static const double spacingXxl = 32;

  // ── Border Radius ─────────────────────────────────────────────
  static const double radiusSm = 6;
  static const double radiusMd = 8;
  static const double radiusLg = 12;
  static const double radiusXl = 16;

  // ── Minimum touch target (iOS HIG) ───────────────────────────
  static const double minTouchTarget = 44;

  // ──────────────────────────────────────────────────────────────
  // Theme Data
  // ──────────────────────────────────────────────────────────────

  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: brandBlue,
      brightness: Brightness.light,
      primary: brandBlue,
      onPrimary: textOnPrimary,
      secondary: brandBlueLight,
      surface: backgroundWhite,
      error: error,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: Brightness.light,
      scaffoldBackgroundColor: backgroundLight,

      // ── AppBar ──────────────────────────────────────────────
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundWhite,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
      ),

      // ── Card ────────────────────────────────────────────────
      cardTheme: CardThemeData(
        color: backgroundCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
          side: const BorderSide(color: border, width: 0.5),
        ),
        margin: const EdgeInsets.symmetric(
          horizontal: spacingLg,
          vertical: spacingSm,
        ),
      ),

      // ── Elevated Button ─────────────────────────────────────
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: brandBlue,
          foregroundColor: textOnPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(
            horizontal: spacingXl,
            vertical: spacingMd,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── Text Button ─────────────────────────────────────────
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: brandBlue,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),

      // ── Outlined Button ─────────────────────────────────────
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: brandBlue,
          side: const BorderSide(color: brandBlue, width: 1),
          padding: const EdgeInsets.symmetric(
            horizontal: spacingXl,
            vertical: spacingMd,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
        ),
      ),

      // ── Input Decoration ────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: backgroundWhite,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: spacingLg,
          vertical: spacingMd,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: brandBlue, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: error),
        ),
        hintStyle: const TextStyle(
          color: textHint,
          fontSize: 14,
        ),
      ),

      // ── Bottom Navigation Bar ───────────────────────────────
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: backgroundWhite,
        selectedItemColor: brandBlue,
        unselectedItemColor: textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
        unselectedLabelStyle: TextStyle(fontSize: 10),
      ),

      // ── Divider ─────────────────────────────────────────────
      dividerTheme: const DividerThemeData(
        color: divider,
        thickness: 1,
        space: 0,
      ),

      // ── Chip ────────────────────────────────────────────────
      chipTheme: ChipThemeData(
        backgroundColor: backgroundLight,
        selectedColor: brandBlue.withOpacity(0.1),
        side: BorderSide.none,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusSm),
        ),
        labelStyle: const TextStyle(fontSize: 12, color: textPrimary),
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────
  // Text Styles
  // ──────────────────────────────────────────────────────────────

  static const TextStyle headingLarge = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    height: 1.4,
  );

  static const TextStyle headingMedium = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    height: 1.4,
  );

  static const TextStyle titleLarge = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    height: 1.4,
  );

  static const TextStyle titleMedium = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    height: 1.4,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: textPrimary,
    height: 1.6,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: textPrimary,
    height: 1.6,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: textSecondary,
    height: 1.5,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w400,
    color: textSecondary,
    height: 1.4,
  );

  /// Number display style (DIN-like for metrics)
  static const TextStyle numberLarge = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    height: 1.2,
    fontFamily: 'DIN Alternate',
  );

  static const TextStyle numberMedium = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    height: 1.2,
    fontFamily: 'DIN Alternate',
  );

  static const TextStyle numberSmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    height: 1.2,
    fontFamily: 'DIN Alternate',
  );

  // ── Helper: Get status color by name ────────────────────────

  static Color statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
      case 'ONLINE':
      case 'AVAILABLE':
      case 'CHARGING':
      case 'SETTLED':
      case 'PAID':
      case 'COMPLETED':
        return success;
      case 'WARNING':
      case 'ALERT':
      case 'PENDING':
      case 'CREATED':
      case 'STOPPING':
        return warning;
      case 'ERROR':
      case 'OFFLINE':
      case 'FAULT':
      case 'ABNORMAL':
      case 'CANCELLED':
        return error;
      case 'INFO':
      case 'IN_PROGRESS':
      case 'STOPPED':
      case 'SETTLING':
      default:
        return info;
    }
  }
}
