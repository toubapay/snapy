import 'package:flutter/material.dart';
import '../widgets/product_list_view.dart';
import 'boutique_screen.dart';
import 'chat_screen.dart';

class TopScreen extends StatelessWidget {
  const TopScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ProductListView(
      mode: FeedMode.top,
      emptyText: 'Pas encore assez d\'activité pour établir un classement.',
      onOpenBoutique: (phone, label) => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => BoutiqueScreen(phone: phone, label: label)),
      ),
      onOpenChat: (p) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatScreen(product: p))),
    );
  }
}
