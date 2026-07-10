import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../api.dart';
import '../auth.dart';
import '../theme.dart';
import '../widgets/app_field.dart';
import '../widgets/buttons.dart';

class ComposeScreen extends StatefulWidget {
  const ComposeScreen({super.key});

  @override
  State<ComposeScreen> createState() => _ComposeScreenState();
}

class _ComposeScreenState extends State<ComposeScreen> {
  final _picker = ImagePicker();
  final _nameController = TextEditingController();
  List<Category> _categories = [];
  File? _photo;
  String? _category;
  String _status = '';
  bool _statusError = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    Api.categories().then((c) => setState(() => _categories = c)).catchError((_) {});
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _pick(ImageSource source) async {
    try {
      final file = await _picker.pickImage(source: source, imageQuality: 85);
      if (file != null) setState(() => _photo = File(file.path));
    } catch (_) {
      setState(() {
        _status = source == ImageSource.camera
            ? "Autorisez l'accès à la caméra pour prendre une photo."
            : 'Autorisez l\'accès à vos photos pour en choisir une.';
        _statusError = true;
      });
    }
  }

  Future<void> _submit() async {
    setState(() { _status = ''; _statusError = false; });

    if (_photo == null) {
      setState(() { _status = "Ajoutez d'abord une photo du produit."; _statusError = true; });
      return;
    }
    if (_nameController.text.trim().isEmpty) {
      setState(() { _status = 'Le nom du produit est requis.'; _statusError = true; });
      return;
    }
    if (_category == null) {
      setState(() { _status = 'Choisissez une catégorie pour votre produit.'; _statusError = true; });
      return;
    }

    final auth = context.read<AuthProvider>().auth!;
    setState(() {
      _submitting = true;
      _status = "Génération d'une description façon Twitter à partir de votre photo…";
      _statusError = false;
    });

    try {
      final product = await Api.createProduct(auth.token, name: _nameController.text.trim(), category: _category!, image: _photo!);
      setState(() => _status = 'Publié → ${product.description}');
      await Future.delayed(const Duration(milliseconds: 900));
      if (mounted) Navigator.of(context).pop(true);
    } on ApiError catch (err) {
      if (err.status == 401) await context.read<AuthProvider>().setAuth(null);
      setState(() { _status = err.message; _statusError = true; });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>().auth;

    return Scaffold(
      appBar: AppBar(title: const Text('Publier un produit')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          GestureDetector(
            onTap: () => _pick(ImageSource.gallery),
            child: _photo != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(kRadius),
                    child: AspectRatio(aspectRatio: 1, child: Image.file(_photo!, fit: BoxFit.cover)),
                  )
                : AspectRatio(
                    aspectRatio: 1,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.panel,
                        borderRadius: BorderRadius.circular(kRadius),
                        border: Border.all(color: AppColors.hairline, width: 1.5, style: BorderStyle.solid),
                      ),
                      alignment: Alignment.center,
                      child: const Text('Aucune photo sélectionnée', style: TextStyle(color: AppColors.textDim, fontSize: 12)),
                    ),
                  ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: SecondaryButton(title: '📷 Prendre une photo', onPressed: () => _pick(ImageSource.camera))),
              const SizedBox(width: 8),
              Expanded(child: SecondaryButton(title: '🖼️ Galerie', onPressed: () => _pick(ImageSource.gallery))),
            ],
          ),
          const SizedBox(height: 16),
          AppField(placeholder: 'Nom du produit — ex. Veste en jean vintage', maxLength: 80, controller: _nameController),
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
          Text(
            'Publication en tant que ${(auth?.storeName.isNotEmpty ?? false) ? auth!.storeName : auth?.maskedPhone ?? ''} — les acheteurs peuvent vous contacter par chat ou WhatsApp.',
            style: const TextStyle(color: AppColors.teal, fontSize: 10.5),
          ),
          const SizedBox(height: 14),
          PrimaryButton(title: 'Publier le produit', onPressed: _submitting ? null : _submit, loading: _submitting),
          if (_status.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(_status, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: _statusError ? AppColors.error : AppColors.textDim)),
          ],
        ],
      ),
    );
  }
}
