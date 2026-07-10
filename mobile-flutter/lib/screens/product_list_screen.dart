import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api.dart';
import '../auth.dart';
import '../theme.dart';
import '../widgets/product_card.dart';
import 'boutique_screen.dart';
import 'chat_screen.dart';
import 'edit_product_screen.dart';

enum ProductListMode { all, top, mine, boutique, categoryFiltered }

class ProductListScreen extends StatefulWidget {
  final ProductListMode mode;
  final String? sellerPhone;
  final String? categoryName;
  final String emptyText;
  final Listenable? refreshSignal;

  const ProductListScreen({
    super.key,
    required this.mode,
    required this.emptyText,
    this.sellerPhone,
    this.categoryName,
    this.refreshSignal,
  });

  @override
  State<ProductListScreen> createState() => ProductListScreenState();
}

class ProductListScreenState extends State<ProductListScreen> {
  List<Product> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    widget.refreshSignal?.addListener(_onRefreshSignal);
    load();
  }

  @override
  void dispose() {
    widget.refreshSignal?.removeListener(_onRefreshSignal);
    super.dispose();
  }

  void _onRefreshSignal() => load(isRefresh: true);

  Future<void> load({bool isRefresh = false}) async {
    final authProvider = context.read<AuthProvider>();
    final auth = authProvider.auth;

    if (widget.mode == ProductListMode.mine && auth == null) {
      setState(() {
        _products = [];
        _loading = false;
      });
      return;
    }

    if (!isRefresh) setState(() => _loading = true);

    try {
      List<Product> result;
      switch (widget.mode) {
        case ProductListMode.mine:
          result = await Api.myProducts(auth!.token);
          break;
        case ProductListMode.top:
          result = await Api.products(sort: 'top');
          break;
        case ProductListMode.boutique:
          result = await Api.products(seller: widget.sellerPhone);
          break;
        case ProductListMode.categoryFiltered:
          result = await Api.products(category: widget.categoryName);
          break;
        case ProductListMode.all:
          result = await Api.products();
          break;
      }
      if (mounted) setState(() => _products = result);
    } on ApiError catch (err) {
      if (err.status == 401 && widget.mode == ProductListMode.mine) {
        await authProvider.setAuth(null);
      }
    } catch (_) {
      // network hiccup — keep showing whatever was already loaded
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openBoutique(String phone, String label) {
    if (phone.isEmpty) return;
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => BoutiqueScreen(phone: phone, label: label)));
  }

  void _openChat(Product product) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatScreen(product: product), fullscreenDialog: true));
  }

  void _openEdit(Product product) {
    Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => EditProductScreen(product: product, onSaved: load), fullscreenDialog: true));
  }

  Future<void> _handleDelete(String id) async {
    final auth = context.read<AuthProvider>().auth;
    if (auth == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.panel,
        title: const Text('Supprimer l\'annonce', style: TextStyle(color: AppColors.paper)),
        content: const Text('Supprimer définitivement cette annonce ?', style: TextStyle(color: AppColors.textDim)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Supprimer', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await Api.deleteProduct(auth.token, id);
      load();
    } on ApiError catch (err) {
      if (err.status == 401) await context.read<AuthProvider>().setAuth(null);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      color: AppColors.amber,
      onRefresh: () => load(isRefresh: true),
      child: _products.isEmpty
          ? ListView(
              padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
              children: [
                Text(widget.emptyText, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textDim, fontSize: 13)),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _products.length,
              itemBuilder: (context, index) => ProductCard(
                product: _products[index],
                mine: widget.mode == ProductListMode.mine,
                onOpenChat: _openChat,
                onOpenBoutique: _openBoutique,
                onEdit: _openEdit,
                onDelete: _handleDelete,
              ),
            ),
    );
  }
}
