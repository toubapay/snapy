import 'package:flutter/material.dart';

import 'product_list_screen.dart';

class CategoryFeedScreen extends StatelessWidget {
  final String name;

  const CategoryFeedScreen({super.key, required this.name});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Catégorie : $name')),
      body: ProductListScreen(
        mode: ProductListMode.categoryFiltered,
        categoryName: name,
        emptyText: 'Aucune annonce dans cette catégorie pour l\'instant.',
      ),
    );
  }
}
