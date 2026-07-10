import 'package:flutter/material.dart';

import '../theme.dart';

class AppField extends StatelessWidget {
  final String? placeholder;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final int? maxLength;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  const AppField({
    super.key,
    this.placeholder,
    this.controller,
    this.obscureText = false,
    this.keyboardType,
    this.maxLength,
    this.onChanged,
    this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      maxLength: maxLength,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      style: const TextStyle(color: AppColors.text, fontSize: 14),
      decoration: InputDecoration(
        hintText: placeholder,
        hintStyle: const TextStyle(color: AppColors.textDim),
        filled: true,
        fillColor: AppColors.ink,
        counterText: '',
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kRadius),
          borderSide: const BorderSide(color: AppColors.hairline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kRadius),
          borderSide: const BorderSide(color: AppColors.hairline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kRadius),
          borderSide: const BorderSide(color: AppColors.amber),
        ),
      ),
    );
  }
}
