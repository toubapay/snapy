import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../services/api.dart';
import '../services/auth_provider.dart';
import '../theme/colors.dart';

class EditProductScreen extends StatefulWidget {
  final Product product;
  const EditProductScreen({super.key, required this.product});

  @override
  State<EditProductScreen> createState() => _EditProductScreenState();
}

class _EditProductScreenState extends State<EditProductScreen> {
  final _picker = ImagePicker();
  late final TextEditingController _nameCtrl = TextEditingController(text: widget.product.name);
  late String? _category = widget.product.category;

  Uint8List? _photoBytes;
  String? _photoName;
  String? _photoMime;
  List<Category> _categories = [];

  String _error = '';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    Api.instance.categories().then((raw) {
      if (!mounted) return;
      setState(() => _categories = raw.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList());
    }).catchError((_) => null);
  }

  Future<void> _pick(ImageSource source) async {
    final file = await _picker.pickImage(source: source, imageQuality: 85);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() {
      _photoBytes = bytes;
      _photoName = file.name;
      _photoMime = file.mimeType;
    });
  }

  Future<void> _submit() async {
    setState(() => _error = '');
    if (_nameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Le nom du produit est requis.');
      return;
    }

    final auth = context.read<AuthProvider>().auth;
    if (auth == null) return;

    setState(() => _submitting = true);
    try {
      final image = _photoBytes != null
          ? http.MultipartFile.fromBytes(
              'image',
              _photoBytes!,
              filename: _photoName ?? 'photo.jpg',
              contentType: MediaType.parse(_photoMime ?? 'image/jpeg'),
            )
          : null;
      await Api.instance.updateProduct(auth.token, widget.product.id, _nameCtrl.text.trim(), _category ?? widget.product.category, image);
      if (mounted) Navigator.of(context).pop(true);
    } catch (err) {
      setState(() => _error = err is ApiException ? err.message : 'Une erreur s\'est produite.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final existingImageUrl = widget.product.imageUrl.startsWith('http') ? widget.product.imageUrl : '${Api.base}${widget.product.imageUrl}';

    return Scaffold(
      appBar: AppBar(title: const Text('Modifier l\'annonce')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            GestureDetector(
              onTap: () => _pick(ImageSource.gallery),
              child: Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  AspectRatio(
                    aspectRatio: 1,
                    child: Container(
                      clipBehavior: Clip.antiAlias,
                      decoration: BoxDecoration(color: SnapyColors.panel, borderRadius: BorderRadius.circular(snapyRadius)),
                      child: _photoBytes != null
                          ? Image.memory(_photoBytes!, fit: BoxFit.cover)
                          : Image.network(existingImageUrl, fit: BoxFit.cover),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(20)),
                      child: const Text('Cliquez pour remplacer la photo', style: TextStyle(color: Colors.white, fontSize: 10)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: OutlinedButton(onPressed: () => _pick(ImageSource.camera), child: const Text('📷 Prendre une photo'))),
                const SizedBox(width: 8),
                Expanded(child: OutlinedButton(onPressed: () => _pick(ImageSource.gallery), child: const Text('🖼️ Galerie'))),
              ],
            ),
            const SizedBox(height: 16),
            TextField(controller: _nameCtrl, maxLength: 80, decoration: const InputDecoration(hintText: 'Nom du produit')),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _categories
                  .map(
                    (c) => ChoiceChip(
                      label: Text(c.name),
                      selected: _category == c.name,
                      onSelected: (_) => setState(() => _category = c.name),
                      backgroundColor: SnapyColors.panel,
                      selectedColor: const Color(0x1AE8A33D),
                      side: BorderSide(color: _category == c.name ? SnapyColors.amber : SnapyColors.hairline),
                      labelStyle: TextStyle(color: _category == c.name ? SnapyColors.amber : SnapyColors.textDim, fontSize: 12),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: SnapyColors.amberOn))
                  : const Text('Enregistrer les modifications'),
            ),
            if (_error.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(_error, style: const TextStyle(color: SnapyColors.error, fontSize: 11.5)),
              ),
          ],
        ),
      ),
    );
  }
}
