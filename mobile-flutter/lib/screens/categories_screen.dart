import 'package:flutter/material.dart';
import '../models/product.dart';
import '../services/api.dart';
import '../theme/colors.dart';
import '../widgets/category_tile.dart';
import 'category_feed_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => CategoriesScreenState();
}

class CategoriesScreenState extends State<CategoriesScreen> {
  List<Category> _categories = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() => _loading = true);
    try {
      final raw = await Api.instance.categories();
      if (!mounted) return;
      setState(() {
        _categories = raw.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  void _openCategory(String name) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => CategoryFeedScreen(categoryName: name)));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: SnapyColors.amber));
    }
    return RefreshIndicator(
      color: SnapyColors.amber,
      onRefresh: load,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.7,
        ),
        itemCount: _categories.length,
        itemBuilder: (context, i) => CategoryTile(category: _categories[i], onTap: _openCategory),
      ),
    );
  }
}
