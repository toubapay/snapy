import 'package:flutter/material.dart';
import '../widgets/product_list_view.dart';
import 'boutique_screen.dart';
import 'chat_screen.dart';
import 'edit_product_screen.dart';
import 'auth_screen.dart';

class CategoryFeedScreen extends StatelessWidget {
  final String categoryName;
  const CategoryFeedScreen({super.key, required this.categoryName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Catégorie : $categoryName')),
      body: ProductListView(
        mode: FeedMode.categoryFiltered,
        categoryName: categoryName,
        emptyText: 'Aucune annonce dans cette catégorie pour l\'instant.',
        onOpenBoutique: (phone, label) => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => BoutiqueScreen(phone: phone, label: label)),
        ),
        onOpenChat: (p) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatScreen(product: p))),
        onEdit: (p) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EditProductScreen(product: p))),
        onLoggedOut: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AuthScreen())),
      ),
    );
  }
}
