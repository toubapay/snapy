import 'package:flutter/material.dart';

// Same palette as web/src/styles.css and mobile-rn/src/theme.js — keep in sync
// if the brand colors change.
class AppColors {
  static const ink = Color(0xFF100F16);
  static const panel = Color(0xFF1A1926);
  static const panelRaised = Color(0xFF211F30);
  static const hairline = Color(0xFF34313F);
  static const paper = Color(0xFFF2EDE3);
  static const amber = Color(0xFFE8A33D);
  static const teal = Color(0xFF5FC3B0);
  static const text = Color(0xFFECE8F0);
  static const textDim = Color(0xFF8F8AA0);
  static const error = Color(0xFFE8756A);
  static const amberOn = Color(0xFF1A1305);
}

const double kRadius = 14;

ThemeData buildAppTheme() {
  return ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.ink,
    fontFamily: 'Roboto',
    colorScheme: const ColorScheme.dark(
      surface: AppColors.ink,
      primary: AppColors.amber,
      onPrimary: AppColors.amberOn,
      error: AppColors.error,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.panel,
      foregroundColor: AppColors.paper,
      elevation: 0,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.panel,
      selectedItemColor: AppColors.amber,
      unselectedItemColor: AppColors.textDim,
      type: BottomNavigationBarType.fixed,
    ),
    textSelectionTheme: const TextSelectionThemeData(cursorColor: AppColors.amber),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.amber),
  );
}
