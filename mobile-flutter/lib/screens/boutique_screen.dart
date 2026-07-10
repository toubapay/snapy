import 'package:flutter/material.dart';
import '../widgets/product_list_view.dart';
import 'chat_screen.dart';
import 'edit_product_screen.dart';
import 'auth_screen.dart';

class BoutiqueScreen extends StatelessWidget {
  final String phone;
  final String label;
  const BoutiqueScreen({super.key, required this.phone, required this.label});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('🏪 $label')),
      body: ProductListView(
        mode: FeedMode.boutique,
        sellerPhone: phone,
        emptyText: 'Cette boutique n\'a pas encore publié d\'annonce.',
        onOpenChat: (p) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatScreen(product: p))),
        onEdit: (p) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EditProductScreen(product: p))),
        onLoggedOut: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AuthScreen())),
      ),
    );
  }
}
