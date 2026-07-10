import 'package:flutter/material.dart';
import '../widgets/product_list_view.dart';
import 'boutique_screen.dart';
import 'chat_screen.dart';
import 'edit_product_screen.dart';
import 'auth_screen.dart';

class AnnoncesScreen extends StatelessWidget {
  const AnnoncesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ProductListView(
      mode: FeedMode.all,
      emptyText: 'Aucun produit pour l\'instant — soyez le premier à en publier un.',
      onOpenBoutique: (phone, label) => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => BoutiqueScreen(phone: phone, label: label)),
      ),
      onOpenChat: (p) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatScreen(product: p))),
      onEdit: (p) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EditProductScreen(product: p))),
      onLoggedOut: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AuthScreen())),
    );
  }
}
