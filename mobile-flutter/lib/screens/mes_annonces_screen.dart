import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../theme/colors.dart';
import '../widgets/product_list_view.dart';
import 'auth_screen.dart';
import 'edit_product_screen.dart';

class MesAnnoncesScreen extends StatelessWidget {
  const MesAnnoncesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>().auth;

    if (auth == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Connectez-vous avec votre compte vendeur pour voir vos annonces.',
                textAlign: TextAlign.center,
                style: TextStyle(color: SnapyColors.textDim, fontSize: 13),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AuthScreen())),
                child: const Text('Se connecter / S\'inscrire'),
              ),
            ],
          ),
        ),
      );
    }

    return ProductListView(
      mode: FeedMode.mine,
      emptyText: 'Vous n\'avez encore publié aucune annonce.',
      onEdit: (p) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EditProductScreen(product: p))),
      onLoggedOut: () => context.read<AuthProvider>().setAuth(null),
    );
  }
}
