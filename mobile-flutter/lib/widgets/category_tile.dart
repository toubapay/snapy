import 'package:flutter/material.dart';
import '../models/product.dart';
import '../theme/colors.dart';

class CategoryTile extends StatelessWidget {
  final Category category;
  final void Function(String name) onTap;

  const CategoryTile({super.key, required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onTap(category.name),
      borderRadius: BorderRadius.circular(snapyRadius),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: SnapyColors.panel,
          borderRadius: BorderRadius.circular(snapyRadius),
          border: Border.all(color: SnapyColors.hairline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(category.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: SnapyColors.paper)),
            const SizedBox(height: 4),
            Text(
              '${category.count} annonce${category.count == 1 ? '' : 's'}',
              style: const TextStyle(fontSize: 11, color: SnapyColors.textDim),
            ),
          ],
        ),
      ),
    );
  }
}
