import 'package:flutter/material.dart';

/// Same palette as the web app's styles.css — keep in sync if the brand
/// colors change.
class SnapyColors {
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

const double snapyRadius = 14;

ThemeData buildSnapyTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: SnapyColors.ink,
    colorScheme: const ColorScheme.dark(
      primary: SnapyColors.amber,
      secondary: SnapyColors.teal,
      surface: SnapyColors.panel,
      error: SnapyColors.error,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: SnapyColors.panel,
      foregroundColor: SnapyColors.paper,
      elevation: 0,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: SnapyColors.panel,
      selectedItemColor: SnapyColors.amber,
      unselectedItemColor: SnapyColors.textDim,
      type: BottomNavigationBarType.fixed,
    ),
    textTheme: const TextTheme().apply(
      bodyColor: SnapyColors.text,
      displayColor: SnapyColors.text,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: SnapyColors.ink,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      hintStyle: const TextStyle(color: SnapyColors.textDim),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(snapyRadius),
        borderSide: const BorderSide(color: SnapyColors.hairline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(snapyRadius),
        borderSide: const BorderSide(color: SnapyColors.hairline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(snapyRadius),
        borderSide: const BorderSide(color: SnapyColors.amber),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: SnapyColors.amber,
        foregroundColor: SnapyColors.amberOn,
        disabledBackgroundColor: SnapyColors.hairline,
        disabledForegroundColor: SnapyColors.textDim,
        minimumSize: const Size.fromHeight(46),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(snapyRadius)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: SnapyColors.textDim,
        side: const BorderSide(color: SnapyColors.hairline),
        minimumSize: const Size.fromHeight(42),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(snapyRadius)),
      ),
    ),
  );
}
