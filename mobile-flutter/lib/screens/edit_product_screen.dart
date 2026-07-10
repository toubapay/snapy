import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../api.dart';
import '../auth.dart';
import '../theme.dart';
import '../widgets/app_field.dart';
import '../widgets/buttons.dart';

class EditProductScreen extends StatefulWidget {
  final Product product;
  final Future<void> Function() onSaved;

  const EditProductScreen({super.key, required this.product, required this.onSaved});

  @override
  State<EditProductScreen> createState() => _EditProductScreenState();
}

class _EditProductScreenState extends State<EditProductScreen> {
  final _picker = ImagePicker();
  late final TextEditingController _nameController;
  List<Category> _categories = [];
  File? _photo;
  String? _category;
  String _error = '';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.product.name);
    _category = widget.product.category.isNotEmpty ? widget.product.category : null;
    Api.categories().then((c) => setState(() => _categories = c)).catchError((_) {});
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _pick(ImageSource source) async {
    final file = await _picker.pickImage(source: source, imageQuality: 85);
    if (file != null) setState(() => _photo = File(file.path));
  }

  Future<void> _submit() async {
    setState(() => _error = '');
    if (_nameController.text.trim().isEmpty) {
      setState(() => _error = 'Le nom du produit est requis.');
      return;
    }

    final auth = context.read<AuthProvider>().auth!;
    setState(() => _submitting = true);

    try {
      await Api.updateProduct(auth.token, widget.product.id, name: _nameController.text.trim(), category: _category ?? '', image: _photo);
      await widget.onSaved();
      if (mounted) Navigator.of(context).pop();
    } on ApiError catch (err) {
      if (err.status == 401) {
        await context.read<AuthProvider>().setAuth(null);
        if (mounted) Navigator.of(context).pop();
        return;
      }
      setState(() => _error = err.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final existingImageUrl = widget.product.absoluteImageUrl(Api.base);

    return Scaffold(
      appBar: AppBar(title: const Text("Modifier l'annonce")),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          GestureDetector(
            onTap: () => _pick(ImageSource.gallery),
            child: Stack(
              alignment: Alignment.bottomCenter,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(kRadius),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: _photo != null ? Image.file(_photo!, fit: BoxFit.cover) : Image.network(existingImageUrl, fit: BoxFit.cover),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xBF100F16), borderRadius: BorderRadius.circular(20)),
                    child: const Text('Cliquez pour remplacer la photo', style: TextStyle(color: AppColors.text, fontSize: 10)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: SecondaryButton(title: '📷 Prendre une photo', onPressed: () => _pick(ImageSource.camera))),
              const SizedBox(width: 8),
              Expanded(child: SecondaryButton(title: '🖼️ Galerie', onPressed: () => _pick(ImageSource.gallery))),
            ],
          ),
          const SizedBox(height: 16),
          AppField(placeholder: 'Nom du produit', maxLength: 80, controller: _nameController),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _categories.map((c) {
              final active = _category == c.name;
              return GestureDetector(
                onTap: () => setState(() => _category = c.name),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: active ? AppColors.amber : AppColors.hairline),
                    color: active ? const Color(0x1AE8A33D) : null,
                  ),
                  child: Text(c.name, style: TextStyle(fontSize: 12, color: active ? AppColors.amber : AppColors.textDim)),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          PrimaryButton(title: 'Enregistrer les modifications', onPressed: _submitting ? null : _submit, loading: _submitting),
          if (_error.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(_error, style: const TextStyle(color: AppColors.error, fontSize: 11.5)),
          ],
        ],
      ),
    );
  }
}
