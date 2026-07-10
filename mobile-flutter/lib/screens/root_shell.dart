import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../auth.dart';
import '../theme.dart';
import 'account_screen.dart';
import 'auth_screen.dart';
import 'categories_screen.dart';
import 'compose_screen.dart';
import 'product_list_screen.dart';
import 'mes_annonces_screen.dart';

const _titles = ['Snapy', 'Top annonces', 'Catégories', 'Mes annonces'];

class RootShell extends StatefulWidget {
  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int _tabIndex = 0;
  final _refreshSignal = ValueNotifier<int>(0);

  @override
  void dispose() {
    _refreshSignal.dispose();
    super.dispose();
  }

  void _openAuth() {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AuthScreen(), fullscreenDialog: true));
  }

  Future<void> _openCompose() async {
    final published = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const ComposeScreen(), fullscreenDialog: true));
    if (published == true) _refreshSignal.value++;
  }

  Future<void> _openAccount() async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AccountScreen(), fullscreenDialog: true));
    _refreshSignal.value++;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>().auth;

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_tabIndex]),
        actions: [
          IconButton(
            icon: const Text('＋', style: TextStyle(fontSize: 20, color: AppColors.paper)),
            onPressed: auth != null ? _openCompose : _openAuth,
          ),
          IconButton(
            icon: Text(auth != null ? '🏪' : '👤', style: const TextStyle(fontSize: 18)),
            onPressed: auth != null ? _openAccount : _openAuth,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: IndexedStack(
        index: _tabIndex,
        children: [
          ProductListScreen(
            mode: ProductListMode.all,
            emptyText: "Aucun produit pour l'instant — soyez le premier à en publier un.",
            refreshSignal: _refreshSignal,
          ),
          ProductListScreen(
            mode: ProductListMode.top,
            emptyText: 'Pas encore assez d\'activité pour établir un classement.',
            refreshSignal: _refreshSignal,
          ),
          CategoriesScreen(refreshSignal: _refreshSignal),
          MesAnnoncesScreen(refreshSignal: _refreshSignal, onRequireAuth: _openAuth),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tabIndex,
        onTap: (i) => setState(() => _tabIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Text('📰', style: TextStyle(fontSize: 16)), label: 'Annonces'),
          BottomNavigationBarItem(icon: Text('🔥', style: TextStyle(fontSize: 16)), label: 'Top'),
          BottomNavigationBarItem(icon: Text('🗂️', style: TextStyle(fontSize: 16)), label: 'Catégories'),
          BottomNavigationBarItem(icon: Text('🏪', style: TextStyle(fontSize: 16)), label: 'Mes annonces'),
        ],
      ),
    );
  }
}
