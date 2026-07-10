import 'package:flutter/material.dart';

import '../api.dart';
import '../theme.dart';

class CategoryTile extends StatelessWidget {
  final Category category;
  final ValueChanged<String> onTap;

  const CategoryTile({super.key, required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onTap(category.name),
      borderRadius: BorderRadius.circular(kRadius),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.panel,
          border: Border.all(color: AppColors.hairline),
          borderRadius: BorderRadius.circular(kRadius),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(category.name, style: const TextStyle(color: AppColors.paper, fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 4),
            Text('${category.count} annonce${category.count == 1 ? '' : 's'}', style: const TextStyle(color: AppColors.textDim, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
