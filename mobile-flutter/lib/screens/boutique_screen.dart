import 'package:flutter/material.dart';

import 'product_list_screen.dart';

class BoutiqueScreen extends StatelessWidget {
  final String phone;
  final String label;

  const BoutiqueScreen({super.key, required this.phone, required this.label});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('🏪 $label')),
      body: ProductListScreen(
        mode: ProductListMode.boutique,
        sellerPhone: phone,
        emptyText: "Cette boutique n'a pas encore publié d'annonce.",
      ),
    );
  }
}
