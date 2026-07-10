import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../services/api.dart';
import '../services/auth_provider.dart';
import '../theme/colors.dart';
import 'product_card.dart';

enum FeedMode { all, top, mine, boutique, categoryFiltered }

class ProductListView extends StatefulWidget {
  final FeedMode mode;
  final String? sellerPhone;
  final String? categoryName;
  final String emptyText;
  final void Function(String phone, String label)? onOpenBoutique;
  final void Function(Product)? onOpenChat;
  final void Function(Product)? onEdit;
  final VoidCallback? onLoggedOut;

  const ProductListView({
    super.key,
    required this.mode,
    this.sellerPhone,
    this.categoryName,
    required this.emptyText,
    this.onOpenBoutique,
    this.onOpenChat,
    this.onEdit,
    this.onLoggedOut,
  });

  @override
  State<ProductListView> createState() => ProductListViewState();
}

class ProductListViewState extends State<ProductListView> {
  List<Product> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    final auth = context.read<AuthProvider>().auth;
    if (widget.mode == FeedMode.mine && auth == null) {
      setState(() {
        _products = [];
        _loading = false;
      });
      return;
    }
    setState(() => _loading = true);
    try {
      List<dynamic> raw;
      if (widget.mode == FeedMode.mine) {
        raw = await Api.instance.myProducts(auth!.token);
      } else {
        raw = await Api.instance.products(
          seller: widget.mode == FeedMode.boutique ? widget.sellerPhone : null,
          category: widget.mode == FeedMode.categoryFiltered ? widget.categoryName : null,
          sort: widget.mode == FeedMode.top ? 'top' : null,
        );
      }
      if (!mounted) return;
      setState(() {
        _products = raw.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
        _loading = false;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() => _loading = false);
      if (err is ApiException && err.status == 401 && widget.mode == FeedMode.mine) {
        widget.onLoggedOut?.call();
      }
    }
  }

  Future<void> _handleDelete(String id) async {
    final auth = context.read<AuthProvider>().auth;
    if (auth == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: SnapyColors.panel,
        title: const Text('Supprimer', style: TextStyle(color: SnapyColors.paper)),
        content: const Text('Supprimer définitivement cette annonce ?', style: TextStyle(color: SnapyColors.textDim)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Supprimer', style: TextStyle(color: SnapyColors.error))),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await Api.instance.deleteProduct(auth.token, id);
      load();
    } catch (err) {
      if (err is ApiException && err.status == 401) widget.onLoggedOut?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: SnapyColors.amber));
    }

    if (_products.isEmpty) {
      return RefreshIndicator(
        color: SnapyColors.amber,
        onRefresh: load,
        child: ListView(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 24),
              child: Text(widget.emptyText, textAlign: TextAlign.center, style: const TextStyle(color: SnapyColors.textDim, fontSize: 13)),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: SnapyColors.amber,
      onRefresh: load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _products.length,
        itemBuilder: (context, i) {
          final p = _products[i];
          return ProductCard(
            product: p,
            mine: widget.mode == FeedMode.mine,
            onOpenBoutique: widget.onOpenBoutique,
            onOpenChat: widget.onOpenChat,
            onEdit: widget.onEdit,
            onDelete: _handleDelete,
          );
        },
      ),
    );
  }
}
