import 'package:flutter/material.dart';

import '../api.dart';
import '../theme.dart';
import '../widgets/category_tile.dart';
import 'category_feed_screen.dart';

class CategoriesScreen extends StatefulWidget {
  final Listenable? refreshSignal;

  const CategoriesScreen({super.key, this.refreshSignal});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<Category> _categories = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    widget.refreshSignal?.addListener(_load);
    _load();
  }

  @override
  void dispose() {
    widget.refreshSignal?.removeListener(_load);
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final categories = await Api.categories();
      if (mounted) setState(() => _categories = categories);
    } catch (_) {
      // leave the previous cache if the refresh fails
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openCategory(String name) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => CategoryFeedScreen(name: name)));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      color: AppColors.amber,
      onRefresh: _load,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.7,
        ),
        itemCount: _categories.length,
        itemBuilder: (context, index) => CategoryTile(category: _categories[index], onTap: _openCategory),
      ),
    );
  }
}
