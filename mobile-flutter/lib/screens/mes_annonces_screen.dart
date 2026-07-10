import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../auth.dart';
import '../theme.dart';
import '../widgets/buttons.dart';
import 'product_list_screen.dart';

class MesAnnoncesScreen extends StatelessWidget {
  final Listenable refreshSignal;
  final VoidCallback onRequireAuth;

  const MesAnnoncesScreen({super.key, required this.refreshSignal, required this.onRequireAuth});

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
                style: TextStyle(color: AppColors.textDim, fontSize: 13),
              ),
              const SizedBox(height: 16),
              PrimaryButton(title: 'Se connecter / S\'inscrire', onPressed: onRequireAuth),
            ],
          ),
        ),
      );
    }

    return ProductListScreen(
      mode: ProductListMode.mine,
      emptyText: "Vous n'avez encore publié aucune annonce.",
      refreshSignal: refreshSignal,
    );
  }
}
